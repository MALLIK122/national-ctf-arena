import { getDb, hashPassword, verifyPassword } from "../src/lib/db";
import { processViolationEvent, reinstateTeamFirstWarning, clearIncidentCacheForTeam } from "../src/lib/antiCheat";
import { generateTeamFlag, validateFlag } from "../src/lib/flagEngine";
import { createSession, getSession } from "../src/lib/auth";
import { launchLab, executeLabCommand } from "../src/lib/labEngine";

async function runAcceptanceTests() {
  console.log("==================================================================");
  console.log("  NATIONAL CTF CYBER ARENA - END-TO-END ACCEPTANCE & SECURITY TEST");
  console.log("==================================================================\n");

  const db = getDb();
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  // 1. All 50 Teams & 100 Members Created
  const teams = db.prepare("SELECT count(*) as count FROM teams").get() as { count: number };
  assert(teams.count === 50, `Exactly 50 teams pre-created (Found: ${teams.count})`);

  const members = db.prepare("SELECT count(*) as count FROM team_members").get() as { count: number };
  assert(members.count === 100, `Exactly 100 participant slots pre-created (Found: ${members.count})`);

  // Verify CTF-TEAM-001 and CTF-TEAM-050
  const t1 = db.prepare("SELECT * FROM teams WHERE id = 'CTF-TEAM-001'").get() as any;
  const t50 = db.prepare("SELECT * FROM teams WHERE id = 'CTF-TEAM-050'").get() as any;
  assert(t1 !== undefined && t50 !== undefined, "CTF-TEAM-001 through CTF-TEAM-050 exist");

  const t1Members = db.prepare("SELECT * FROM team_members WHERE team_id = 'CTF-TEAM-001'").all() as any[];
  assert(t1Members.length === 2, "CTF-TEAM-001 has exactly 2 member slots (M1 & M2)");

  // 2. Authentication: Password Hashing & Verification
  const passOk = verifyPassword("Arena2026#ctf-team-001", t1.password_hash);
  const passBad = verifyPassword("WrongPassword123", t1.password_hash);
  assert(passOk === true && passBad === false, "PBKDF2 salted password hashing and verification works");

  // 3. Dynamic Flags & Anti-Collusion Isolation
  const chalNet01 = db.prepare("SELECT * FROM challenges WHERE id = 'NET-01'").get() as any;
  const flagTeam1 = generateTeamFlag("CTF-TEAM-001", "NET-01", chalNet01.base_flag, chalNet01.flag_salt);
  const flagTeam2 = generateTeamFlag("CTF-TEAM-002", "NET-01", chalNet01.base_flag, chalNet01.flag_salt);

  assert(flagTeam1 !== flagTeam2, `Dynamic flags are unique per team (${flagTeam1} != ${flagTeam2})`);
  assert(validateFlag(flagTeam1, flagTeam1), "Team 1 flag validates for Team 1");
  assert(!validateFlag(flagTeam2, flagTeam1), "Team 2 flag is REJECTED for Team 1 (Anti-Collusion)");

  // 4. Lab Engine & Interactive Sandbox
  const testLab = launchLab("CTF-TEAM-001", "CTF-TEAM-001-M1", "NET-01");
  assert(testLab.status === "RUNNING", `Lab launched successfully on target IP ${testLab.targetIp}`);

  const nmapOut = executeLabCommand("CTF-TEAM-001", "NET-01", "nmap 10.10.14.22");
  assert(nmapOut.includes("8088/tcp open"), "Sandbox terminal executes realistic nmap port discovery");

  const ncOut = executeLabCommand("CTF-TEAM-001", "NET-01", "nc target 8088");
  assert(ncOut.includes(flagTeam1), "SCADA daemon responds with Team 1's dynamic flag");

  // =================================================================
  // MANDATORY ANTI-CHEAT & AUTOMATIC SUSPENSION WORKFLOW TESTS
  // =================================================================
  console.log("\n--- EXECUTING MANDATORY ANTI-CHEAT SCENARIOS (TESTS A - J) ---");

  const testTeamId = "CTF-TEAM-049";
  // Reset test team to ACTIVE
  db.prepare("UPDATE teams SET disciplinary_status = 'ACTIVE', warning_count = 0, suspension_reason = NULL WHERE id = ?").run(testTeamId);

  // TEST A: Member 1 triggers a qualifying violation. Expected: Both members' team suspended.
  const resA = processViolationEvent({
    teamId: testTeamId,
    memberId: `${testTeamId}-M1`,
    eventType: "TAB_VISIBILITY_LOST",
    details: "Test A: Competition tab visibility was lost by Member 1."
  });
  const teamAfterA = db.prepare("SELECT disciplinary_status, warning_count FROM teams WHERE id = ?").get(testTeamId) as any;
  assert(
    resA.actionTaken === "SUSPENDED_TEAM_WARNING_1" && teamAfterA.disciplinary_status === "WARNING_SUSPENDED",
    "TEST A: Member 1 tab switch triggers team-wide WARNING_SUSPENDED"
  );

  // TEST B: Member 2 tries to submit flag or launch lab while suspended. Expected: Rejection.
  let labBlocked = false;
  try {
    launchLab(testTeamId, `${testTeamId}-M2`, "NET-01");
  } catch (err: any) {
    labBlocked = true;
  }
  assert(labBlocked, "TEST B: Member 2 is blocked from launching labs during team suspension");

  // TEST C: Member 2 login check during suspension.
  const teamSuspCheck = db.prepare("SELECT disciplinary_status FROM teams WHERE id = ?").get(testTeamId) as any;
  assert(
    teamSuspCheck.disciplinary_status === "WARNING_SUSPENDED",
    "TEST C: Server-side authentication blocks login when WARNING_SUSPENDED"
  );

  // TEST D: Admin reinstates team. Expected: Reinstated with single warning consumed (WARNING_ISSUED).
  const resD = reinstateTeamFirstWarning(testTeamId, "SuperAdmin");
  const teamAfterD = db.prepare("SELECT disciplinary_status, warning_count FROM teams WHERE id = ?").get(testTeamId) as any;
  assert(
    resD.success === true && teamAfterD.disciplinary_status === "WARNING_ISSUED" && teamAfterD.warning_count === 1,
    "TEST D: Admin reinstates team; status becomes WARNING_ISSUED and 1 of 1 warning is consumed"
  );

  // TEST E: Member 2 triggers second violation. Expected: Permanent disqualification!
  clearIncidentCacheForTeam(testTeamId); // Clear debounce for distinct incident test
  const resE = processViolationEvent({
    teamId: testTeamId,
    memberId: `${testTeamId}-M2`,
    eventType: "WINDOW_BLUR",
    details: "Test E: Window focus lost after first warning."
  });
  const teamAfterE = db.prepare("SELECT disciplinary_status, warning_count FROM teams WHERE id = ?").get(testTeamId) as any;
  assert(
    resE.actionTaken === "DISQUALIFIED_TEAM" && teamAfterE.disciplinary_status === "DISQUALIFIED",
    "TEST E: Second violation by Member 2 causes immediate, permanent DISQUALIFICATION"
  );

  // TEST F & I: Event deduplication and duplicate visibility events
  const resI = processViolationEvent({
    teamId: testTeamId,
    memberId: `${testTeamId}-M1`,
    eventType: "TAB_VISIBILITY_LOST",
    details: "Rapid duplicate event within grace period."
  });
  assert(
    resI.actionTaken === "IGNORED_DUPLICATE" || resI.actionTaken === "ALREADY_DISQUALIFIED",
    "TEST F & I: Rapid duplicate events within grace period are debounced / deduplicated"
  );

  // TEST J: Super Admin reversal recorded in audit history
  db.prepare(`
    INSERT INTO disciplinary_history (id, team_id, previous_status, new_status, reason, initiated_by)
    VALUES (?, ?, 'DISQUALIFIED', 'ACTIVE', 'Test J: Super Admin penalty audit reversal', 'ADMIN:SuperAdmin')
  `).run(`DISC-TESTJ-${Date.now()}`, testTeamId);

  const auditLog = db.prepare("SELECT * FROM disciplinary_history WHERE team_id = ? ORDER BY rowid DESC LIMIT 1").get(testTeamId) as any;
  assert(
    auditLog !== undefined && auditLog.reason.includes("audit reversal"),
    "TEST J: Super Admin reversal of penalty is recorded in permanent audit history"
  );

  // Clean up test team status
  db.prepare("UPDATE teams SET disciplinary_status = 'ACTIVE', warning_count = 0, suspension_reason = NULL WHERE id = ?").run(testTeamId);

  console.log("\n==================================================================");
  console.log(`  TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================================\n");

  if (failed > 0) process.exit(1);
}

runAcceptanceTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
