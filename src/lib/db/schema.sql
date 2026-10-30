-- NATIONAL CTF CYBER ARENA - Relational Database Schema
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- Administrators Table
CREATE TABLE IF NOT EXISTS administrators (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT DEFAULT 'SUPER_ADMIN',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Teams Table (50 Pre-created teams CTF-TEAM-001 to CTF-TEAM-050)
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY, -- 'CTF-TEAM-001' ... 'CTF-TEAM-050'
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  plain_password TEXT, -- Kept encrypted or securely accessible for Admin CSV export
  disciplinary_status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'WARNING_SUSPENDED', 'WARNING_ISSUED', 'DISQUALIFIED', 'ADMIN_REVIEW'
  warning_count INTEGER DEFAULT 0, -- 0 = pristine, 1 = warning used, 2 = disqualified
  suspension_reason TEXT,
  suspended_at DATETIME,
  reinstated_at DATETIME,
  reinstated_by TEXT,
  total_score INTEGER DEFAULT 0,
  solve_count INTEGER DEFAULT 0,
  last_solve_at DATETIME,
  is_online INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Team Members Table (2 per team: Member 1 & Member 2)
CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  member_slot INTEGER NOT NULL, -- 1 or 2
  name TEXT NOT NULL,
  access_code TEXT UNIQUE NOT NULL, -- Unique per participant
  is_online INTEGER DEFAULT 0,
  policy_accepted INTEGER DEFAULT 0,
  policy_accepted_at DATETIME,
  last_active_at DATETIME,
  last_ip TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE(team_id, member_slot)
);

-- Active Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY, -- Session Token
  team_id TEXT,
  member_id TEXT,
  admin_id TEXT,
  role TEXT NOT NULL, -- 'PARTICIPANT' or 'ADMIN'
  ip_address TEXT,
  user_agent TEXT,
  is_revoked INTEGER DEFAULT 0,
  revoked_reason TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES team_members(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES administrators(id) ON DELETE CASCADE
);

-- Challenge Directory Table (24-30 National-Level Challenges)
CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY, -- e.g. 'NET-01', 'EXP-02', 'CRY-01', 'FOR-03'
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'NETWORK_PENETRATION', 'EXPLOITATION', 'CRYPTOGRAPHY', 'DIGITAL_FORENSICS'
  difficulty TEXT NOT NULL, -- 'EASY', 'MEDIUM', 'HARD', 'EXPERT'
  points INTEGER NOT NULL,
  estimated_time_mins INTEGER DEFAULT 25,
  description TEXT NOT NULL,
  instructions TEXT NOT NULL,
  scenario TEXT NOT NULL,
  base_flag TEXT NOT NULL,
  is_dynamic_flag INTEGER DEFAULT 1,
  flag_salt TEXT NOT NULL,
  has_live_lab INTEGER DEFAULT 0,
  lab_type TEXT, -- 'LINUX_TERMINAL', 'WEB_APP', 'NETWORK_SANDBOX', 'FORENSICS_STATION'
  lab_port INTEGER,
  lab_duration_mins INTEGER DEFAULT 60,
  prerequisites TEXT DEFAULT '[]', -- JSON array of required challenge IDs
  hints TEXT DEFAULT '[]', -- JSON array of { id, cost, text }
  order_index INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Team-Specific Challenge Assignments & Dynamic Flags
CREATE TABLE IF NOT EXISTS challenge_assignments (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  assigned_flag TEXT NOT NULL, -- Team-specific HMAC/variant flag
  assigned_variant_data TEXT, -- Team-specific credentials, IPs or datasets
  status TEXT DEFAULT 'AVAILABLE', -- 'LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'SOLVED'
  solved_at DATETIME,
  solved_by_member_id TEXT,
  attempts_count INTEGER DEFAULT 0,
  last_attempt_at DATETIME,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
  UNIQUE(team_id, challenge_id)
);

-- Flag Submissions Log Table
CREATE TABLE IF NOT EXISTS flag_submissions (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  submitted_flag TEXT NOT NULL,
  is_correct INTEGER NOT NULL,
  points_awarded INTEGER DEFAULT 0,
  hint_penalty_points INTEGER DEFAULT 0,
  ip_address TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES team_members(id) ON DELETE CASCADE,
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
);

-- Hint Unlocks Table
CREATE TABLE IF NOT EXISTS hint_unlocks (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  hint_index INTEGER NOT NULL,
  penalty_points INTEGER NOT NULL,
  unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
  UNIQUE(team_id, challenge_id, hint_index)
);

-- Live Lab Instances Table
CREATE TABLE IF NOT EXISTS lab_instances (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  container_id TEXT,
  status TEXT DEFAULT 'STARTING', -- 'STARTING', 'RUNNING', 'STOPPED', 'EXPIRED'
  target_ip TEXT NOT NULL,
  target_port INTEGER NOT NULL,
  internal_url TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  stopped_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
);

-- Security Alerts & Tab Monitoring Events Table
CREATE TABLE IF NOT EXISTS security_alerts (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  member_id TEXT,
  event_type TEXT NOT NULL, -- 'TAB_VISIBILITY_LOST', 'WINDOW_BLUR', 'FULLSCREEN_EXIT', 'REPEATED_FOCUS_LOSS', 'SUSPICIOUS_AUTH', 'CONCURRENT_ANOMALY'
  severity TEXT NOT NULL, -- 'INFO', 'WARNING', 'SUSPICIOUS', 'CRITICAL'
  details TEXT NOT NULL,
  evidence_data TEXT, -- JSON snapshot of window metrics, duration, url
  action_taken TEXT, -- 'NONE', 'SUSPENDED_TEAM_WARNING_1', 'DISQUALIFIED_TEAM', 'LOGGED'
  is_acknowledged INTEGER DEFAULT 0,
  acknowledged_by TEXT,
  acknowledged_at DATETIME,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Permanent Team Disciplinary Audit History
CREATE TABLE IF NOT EXISTS disciplinary_history (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  member_id TEXT,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  reason TEXT NOT NULL,
  initiated_by TEXT NOT NULL, -- 'AUTOMATED_MONITOR_ENGINE' or 'ADMIN:<username>'
  evidence TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Competition Global Settings & 3-Hour Timer Table
CREATE TABLE IF NOT EXISTS competition_settings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'NATIONAL CTF CYBER ARENA',
  status TEXT NOT NULL DEFAULT 'WAITING', -- 'SCHEDULED', 'WAITING', 'RUNNING', 'PAUSED', 'FINISHED'
  duration_seconds INTEGER DEFAULT 10800, -- 3 Hours = 180 mins * 60 = 10,800 seconds
  remaining_seconds INTEGER DEFAULT 10800,
  started_at DATETIME,
  paused_at DATETIME,
  ended_at DATETIME,
  is_leaderboard_frozen INTEGER DEFAULT 0,
  allow_submissions INTEGER DEFAULT 1,
  anti_cheat_grace_ms INTEGER DEFAULT 3000, -- 3 seconds grace for focus switch
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Broadcast Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'NORMAL', -- 'NORMAL', 'URGENT', 'CRITICAL'
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_teams_score ON teams(total_score DESC, last_solve_at ASC);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(disciplinary_status);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(id, is_revoked);
CREATE INDEX IF NOT EXISTS idx_submissions_team ON flag_submissions(team_id, challenge_id);
CREATE INDEX IF NOT EXISTS idx_assignments_team ON challenge_assignments(team_id, challenge_id);
CREATE INDEX IF NOT EXISTS idx_alerts_team ON security_alerts(team_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_sev ON security_alerts(severity, is_acknowledged);
