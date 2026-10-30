import { getDb } from "./db";
import { broadcastEvent } from "./realtime";

export interface DisciplinaryResult {
  success: boolean;
  actionTaken: "LOGGED" | "SUSPENDED_TEAM_WARNING_1" | "DISQUALIFIED_TEAM" | "IGNORED_DUPLICATE" | "ALREADY_DISQUALIFIED";
  teamId: string;
  memberId?: string;
  status: string;
  warningCount: number;
  message: string;
}

// In-memory grace period and incident deduplication cache:
// Tracks teamId -> lastViolationTimestamp
const recentIncidents = new Map<string, number>();

export function clearIncidentCacheForTeam(teamId: string) {
  recentIncidents.delete(teamId);
}

/**
 * Atomic handler for anti-cheating browser violations.
 * Executes inside an atomic transaction to eliminate race conditions between
 * concurrent participant requests.
 */
export function processViolationEvent(params: {
  teamId: string;
  memberId: string;
  eventType: "TAB_VISIBILITY_LOST" | "WINDOW_BLUR" | "FULLSCREEN_EXIT" | "REPEATED_FOCUS_LOSS" | "SUSPICIOUS_AUTH";
  details: string;
  evidenceData?: Record<string, any>;
}): DisciplinaryResult {
  const { teamId, memberId, eventType, details, evidenceData } = params;
  const db = getDb();

  // Deduplication check: ignore rapid duplicate events within 5 seconds for the same incident
  const now = Date.now();
  const lastTime = recentIncidents.get(teamId) || 0;
  if (now - lastTime < 5000) {
    return {
      success: true,
      actionTaken: "IGNORED_DUPLICATE",
      teamId,
      memberId,
      status: "DEBOUNCED",
      warningCount: 0,
      message: "Event deduplicated within grace window."
    };
  }
  recentIncidents.set(teamId, now);

  // Begin atomic transaction
  db.exec("BEGIN IMMEDIATE TRANSACTION;");

  try {
    const team = db.prepare(`
      SELECT id, name, disciplinary_status, warning_count, total_score 
      FROM teams 
      WHERE id = ?
    `).get(teamId) as {
      id: string;
      name: string;
      disciplinary_status: string;
      warning_count: number;
      total_score: number;
    } | undefined;

    if (!team) {
      db.exec("ROLLBACK;");
      return {
        success: false,
        actionTaken: "LOGGED",
        teamId,
        status: "UNKNOWN",
        warningCount: 0,
        message: "Team not found."
      };
    }

    // If already disqualified, just log evidence
    if (team.disciplinary_status === "DISQUALIFIED") {
      db.prepare(`
        INSERT INTO security_alerts (id, team_id, member_id, event_type, severity, details, evidence_data, action_taken)
        VALUES (?, ?, ?, ?, 'CRITICAL', ?, ?, 'ALREADY_DISQUALIFIED')
      `).run(
        `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        teamId,
        memberId,
        eventType,
        details,
        JSON.stringify(evidenceData || {})
      );

      db.exec("COMMIT;");
      return {
        success: true,
        actionTaken: "ALREADY_DISQUALIFIED",
        teamId,
        memberId,
        status: "DISQUALIFIED",
        warningCount: team.warning_count,
        message: "Team is already permanently disqualified."
      };
    }

    let newStatus = team.disciplinary_status;
    let newWarningCount = team.warning_count;
    let actionTaken: "LOGGED" | "SUSPENDED_TEAM_WARNING_1" | "DISQUALIFIED_TEAM" = "LOGGED";
    let alertSeverity: "WARNING" | "CRITICAL" = "WARNING";

    if (team.disciplinary_status === "ACTIVE" && team.warning_count === 0) {
      // FIRST VIOLATION -> TEAM-WIDE SUSPENSION
      newStatus = "WARNING_SUSPENDED";
      actionTaken = "SUSPENDED_TEAM_WARNING_1";
      alertSeverity = "CRITICAL";

      // Suspend all active sessions for this team
      db.prepare(`
        UPDATE sessions 
        SET is_revoked = 1, revoked_reason = 'TEAM_SUSPENDED_FIRST_WARNING' 
        WHERE team_id = ?
      `).run(teamId);

      // Stop any active lab instances for this team
      db.prepare(`
        UPDATE lab_instances 
        SET status = 'STOPPED', stopped_at = CURRENT_TIMESTAMP 
        WHERE team_id = ? AND status IN ('STARTING', 'RUNNING')
      `).run(teamId);

      // Update team disciplinary status
      db.prepare(`
        UPDATE teams 
        SET disciplinary_status = 'WARNING_SUSPENDED',
            suspension_reason = ?,
            suspended_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(details, teamId);

      // Record in permanent disciplinary history
      db.prepare(`
        INSERT INTO disciplinary_history (id, team_id, member_id, previous_status, new_status, reason, initiated_by, evidence)
        VALUES (?, ?, ?, 'ACTIVE', 'WARNING_SUSPENDED', ?, 'AUTOMATED_MONITOR_ENGINE', ?)
      `).run(
        `DISC-${Date.now()}`,
        teamId,
        memberId,
        details,
        JSON.stringify(evidenceData || {})
      );
    } else if (team.disciplinary_status === "WARNING_ISSUED" || team.warning_count >= 1) {
      // SECOND VIOLATION -> PERMANENT DISQUALIFICATION
      newStatus = "DISQUALIFIED";
      newWarningCount = team.warning_count + 1;
      actionTaken = "DISQUALIFIED_TEAM";
      alertSeverity = "CRITICAL";

      // Permanently revoke all sessions
      db.prepare(`
        UPDATE sessions 
        SET is_revoked = 1, revoked_reason = 'TEAM_PERMANENTLY_DISQUALIFIED' 
        WHERE team_id = ?
      `).run(teamId);

      // Stop all labs
      db.prepare(`
        UPDATE lab_instances 
        SET status = 'STOPPED', stopped_at = CURRENT_TIMESTAMP 
        WHERE team_id = ? AND status IN ('STARTING', 'RUNNING')
      `).run(teamId);

      // Update team to DISQUALIFIED
      db.prepare(`
        UPDATE teams 
        SET disciplinary_status = 'DISQUALIFIED',
            warning_count = ?,
            suspension_reason = ?,
            suspended_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newWarningCount, details, teamId);

      // Record in permanent disciplinary history
      db.prepare(`
        INSERT INTO disciplinary_history (id, team_id, member_id, previous_status, new_status, reason, initiated_by, evidence)
        VALUES (?, ?, ?, ?, 'DISQUALIFIED', ?, 'AUTOMATED_MONITOR_ENGINE', ?)
      `).run(
        `DISC-${Date.now()}`,
        teamId,
        memberId,
        team.disciplinary_status,
        details,
        JSON.stringify(evidenceData || {})
      );
    }

    // Insert into security alerts table
    const alertId = `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    db.prepare(`
      INSERT INTO security_alerts (id, team_id, member_id, event_type, severity, details, evidence_data, action_taken)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      alertId,
      teamId,
      memberId,
      eventType,
      alertSeverity,
      details,
      JSON.stringify(evidenceData || {}),
      actionTaken
    );

    db.exec("COMMIT;");

    // Broadcast real-time alert via SSE bus for admin dashboard audio notification and live UI update
    broadcastEvent({
      type: "SECURITY_ALERT",
      payload: {
        alertId,
        teamId,
        teamName: team.name,
        memberId,
        eventType,
        severity: alertSeverity,
        actionTaken,
        status: newStatus,
        warningCount: newWarningCount,
        details,
        timestamp: new Date().toISOString()
      }
    });

    // Also broadcast team status update to immediately freeze participant screens
    broadcastEvent({
      type: "TEAM_STATUS_CHANGED",
      payload: {
        teamId,
        status: newStatus,
        reason: details
      }
    });

    return {
      success: true,
      actionTaken,
      teamId,
      memberId,
      status: newStatus,
      warningCount: newWarningCount,
      message: actionTaken === "SUSPENDED_TEAM_WARNING_1" 
        ? "Team temporarily suspended on first warning violation." 
        : actionTaken === "DISQUALIFIED_TEAM"
        ? "Team permanently disqualified on second violation."
        : "Event logged."
    };
  } catch (err: any) {
    db.exec("ROLLBACK;");
    console.error("Disciplinary atomic transaction error:", err);
    return {
      success: false,
      actionTaken: "LOGGED",
      teamId,
      status: "ERROR",
      warningCount: 0,
      message: err.message
    };
  }
}

/**
 * Administrator Reinstatement Action: "REINSTATE TEAM - FIRST WARNING"
 * Restores login access, preserves score, consumes the single warning opportunity.
 */
export function reinstateTeamFirstWarning(teamId: string, adminUsername: string): { success: boolean; message: string } {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE TRANSACTION;");

  try {
    const team = db.prepare("SELECT id, name, disciplinary_status, warning_count FROM teams WHERE id = ?").get(teamId) as any;
    if (!team) {
      db.exec("ROLLBACK;");
      return { success: false, message: "Team not found." };
    }

    if (team.disciplinary_status !== "WARNING_SUSPENDED") {
      db.exec("ROLLBACK;");
      return { success: false, message: `Team is currently in status '${team.disciplinary_status}', not 'WARNING_SUSPENDED'.` };
    }

    // Set to WARNING_ISSUED and consume warning (warning_count = 1)
    db.prepare(`
      UPDATE teams 
      SET disciplinary_status = 'WARNING_ISSUED',
          warning_count = 1,
          reinstated_at = CURRENT_TIMESTAMP,
          reinstated_by = ?,
          suspension_reason = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(adminUsername, teamId);

    // Record audit trail
    db.prepare(`
      INSERT INTO disciplinary_history (id, team_id, previous_status, new_status, reason, initiated_by)
      VALUES (?, ?, 'WARNING_SUSPENDED', 'WARNING_ISSUED', 'Official first warning consumed; reinstated by administrator.', ?)
    `).run(`DISC-REINSTATE-${Date.now()}`, teamId, `ADMIN:${adminUsername}`);

    // Create informational security alert
    db.prepare(`
      INSERT INTO security_alerts (id, team_id, event_type, severity, details, action_taken)
      VALUES (?, ?, 'TEAM_REINSTATED', 'INFO', ?, 'REINSTATED')
    `).run(`ALERT-${Date.now()}`, teamId, `Team reinstated after first warning by ${adminUsername}`);

    db.exec("COMMIT;");

    // Broadcast reinstatement so participants can resume
    broadcastEvent({
      type: "TEAM_STATUS_CHANGED",
      payload: {
        teamId,
        status: "WARNING_ISSUED",
        reinstatedBy: adminUsername
      }
    });

    return { success: true, message: `Team ${teamId} has been successfully reinstated. Warning 1 of 1 consumed.` };
  } catch (err: any) {
    db.exec("ROLLBACK;");
    return { success: false, message: err.message };
  }
}
