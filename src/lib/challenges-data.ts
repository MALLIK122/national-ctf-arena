export interface ChallengeDefinition {
  id: string;
  title: string;
  category: "NETWORK_PENETRATION" | "EXPLOITATION" | "CRYPTOGRAPHY" | "DIGITAL_FORENSICS";
  difficulty: "EASY" | "MEDIUM" | "HARD" | "EXPERT";
  points: number;
  estimatedTimeMins: number;
  description: string;
  instructions: string;
  scenario: string;
  baseFlag: string;
  flagSalt: string;
  hasLiveLab: boolean;
  labType?: "LINUX_TERMINAL" | "WEB_APP" | "NETWORK_SANDBOX" | "FORENSICS_STATION";
  labPort?: number;
  prerequisites: string[];
  hints: { id: number; cost: number; text: string }[];
  orderIndex: number;
}

export const INITIAL_CHALLENGES: ChallengeDefinition[] = [
  // ==========================================
  // CATEGORY 1: NETWORK PENETRATION TESTING
  // ==========================================
  {
    id: "NET-01",
    title: "Silent Beacon: Service Enumeration",
    category: "NETWORK_PENETRATION",
    difficulty: "EASY",
    points: 100,
    estimatedTimeMins: 15,
    description: "An unindexed asset has appeared on the municipal grid subnet. Reconnaissance scans indicate several listening non-standard ports running custom daemon headers.",
    instructions: "1. Launch the lab terminal or probe the target IP (10.10.14.22).\n2. Execute a detailed service banner grab using nmap or netcat.\n3. Discover the proprietary management port and retrieve the beacon initialization flag.",
    scenario: "National Grid SOC detected intermittent heartbeat transmissions from an unauthorized SCADA relay. Identify the exposed diagnostic daemon.",
    baseFlag: "CTF{s1l3nt_b34c0n_d1sc0v3r3d}",
    flagSalt: "net_recon_salt_842",
    hasLiveLab: true,
    labType: "LINUX_TERMINAL",
    labPort: 8081,
    prerequisites: [],
    hints: [
      { id: 1, cost: 20, text: "Check non-standard ports above 8000 using 'nmap -sV -p 8000-9000 10.10.14.22'." },
      { id: 2, cost: 30, text: "Connect to port 8088 using 'nc -nv 10.10.14.22 8088' and send 'HELO'." }
    ],
    orderIndex: 1
  },
  {
    id: "NET-02",
    title: "PCAP Sleuth: Covert Exfiltration",
    category: "NETWORK_PENETRATION",
    difficulty: "MEDIUM",
    points: 200,
    estimatedTimeMins: 25,
    description: "A border gateway firewall captured an anomalous 8MB packet stream. The adversary disguised data exfiltration within DNS TXT queries and ICMP Echo payloads.",
    instructions: "1. Download or inspect the capture dump 'covert_stream.pcap' inside the forensics lab.\n2. Filter DNS queries for Base64 encoded TXT records.\n3. Reassemble the fragmented payload to uncover the compromised command token.",
    scenario: "An air-gapped terminal at the defense aerospace center had its telemetry tunnelled over recursive DNS lookups. Carve the exfiltrated flag.",
    baseFlag: "CTF{dns_tunn3l_3xf1ltr4t10n_d3t3ct3d}",
    flagSalt: "dns_exfil_salt_194",
    hasLiveLab: true,
    labType: "NETWORK_SANDBOX",
    labPort: 8082,
    prerequisites: ["NET-01"],
    hints: [
      { id: 1, cost: 30, text: "Filter using 'dns.qry.type == 16' (TXT records) or look for subdomains formatted as Base64 strings." },
      { id: 2, cost: 50, text: "Inspect the final TXT answers; concatenate them in sequence of query IDs." }
    ],
    orderIndex: 2
  },
  {
    id: "NET-03",
    title: "Ghost in the Wire: Industrial Modbus Pivot",
    category: "NETWORK_PENETRATION",
    difficulty: "HARD",
    points: 350,
    estimatedTimeMins: 45,
    description: "A legacy Modbus/TCP programmable logic controller (PLC) controlling reservoir valves is bridged to an internal bastion. Leverage the bastion to dump coil states and overwrite safety registers.",
    instructions: "1. Tunnel into the bastion via port 2222.\n2. Use the custom CLI utility or Python socket script to query Modbus unit 1 on 10.10.14.100:502.\n3. Read holding registers 40001-40010 to reconstruct the emergency override sequence.",
    scenario: "Critical Infrastructure protection exercise. An adversary has established a pivot proxy. Intercept the Modbus function code 0x03 response.",
    baseFlag: "CTF{m0dbus_plc_c01l_ov3rr1d3_9941}",
    flagSalt: "modbus_pivot_salt_331",
    hasLiveLab: true,
    labType: "LINUX_TERMINAL",
    labPort: 5020,
    prerequisites: ["NET-02"],
    hints: [
      { id: 1, cost: 50, text: "Run 'python3 modbus_probe.py --host 10.10.14.100 --port 502 --unit 1 --read-holding 40001 10'." },
      { id: 2, cost: 80, text: "The registers store ASCII characters in pairs of 16-bit high/low bytes." }
    ],
    orderIndex: 3
  },
  {
    id: "NET-04",
    title: "BGP Phantom: Route Poisoning & Hijack",
    category: "NETWORK_PENETRATION",
    difficulty: "HARD",
    points: 400,
    estimatedTimeMins: 50,
    description: "Analyze a recorded autonomous system peering session (AS65001 -> AS65042) where malicious AS-PATH prepend attributes redirected critical banking traffic through an unauthorized mirror.",
    instructions: "1. Inspect the routing table snapshot and MRT BGP dump.\n2. Identify the rogue autonomous system number and the prefix that was hijacked.\n3. Extract the flag embedded within the BGP community string.",
    scenario: "National Cyber Agency telemetry captured a localized route diversion targeting governmental certificate authorities. Unmask the community attribute.",
    baseFlag: "CTF{bgp_h1j4ck_pr3f1x_c0mmun1ty_x0}",
    flagSalt: "bgp_poison_salt_772",
    hasLiveLab: false,
    prerequisites: ["NET-02"],
    hints: [
      { id: 1, cost: 60, text: "Examine BGP Path Attribute 8 (COMMUNITIES) for prefix 198.51.100.0/24." }
    ],
    orderIndex: 4
  },
  {
    id: "NET-05",
    title: "Apex Bastion: Multi-Hop Zero-Trust Pivot",
    category: "NETWORK_PENETRATION",
    difficulty: "EXPERT",
    points: 500,
    estimatedTimeMins: 60,
    description: "Navigate an interconnected multi-tier enterprise simulation: Perimiter DMZ -> Internal LDAP Proxy -> Segregated Vault Network. Craft dynamic SOCKS5 proxies to pivot through all three layers.",
    instructions: "1. Launch the lab instance to access Gateway DMZ (10.10.20.10).\n2. Discover the misconfigured SSH key to pivot to the internal proxy (172.16.5.2).\n3. Pivot into the isolated Vault (192.168.100.5) and extract the encrypted root master flag.",
    scenario: "Red Team National Finals benchmark. Full-scope corporate infrastructure breach test under strict ingress filtering.",
    baseFlag: "CTF{4p3x_mult1_h0p_p1v0t_m4st3r_88}",
    flagSalt: "apex_pivot_salt_901",
    hasLiveLab: true,
    labType: "LINUX_TERMINAL",
    labPort: 2222,
    prerequisites: ["NET-03"],
    hints: [
      { id: 1, cost: 75, text: "Look in /home/operator/.ssh/id_rsa_backup on the DMZ host." },
      { id: 2, cost: 100, text: "Use 'ssh -D 1080 -N -i id_rsa operator@172.16.5.2' and proxychains to query 192.168.100.5:8443." }
    ],
    orderIndex: 5
  },
  {
    id: "NET-06",
    title: "Zero-Day Wire: Kerberos Golden Ticket Relay",
    category: "NETWORK_PENETRATION",
    difficulty: "MEDIUM",
    points: 250,
    estimatedTimeMins: 30,
    description: "An Active Directory domain controller sync stream was captured during an SMB relay attack. Reconstruct the Kerberos ticket-granting ticket (TGT) components and extract the KRBTGT hash.",
    instructions: "1. Analyze 'ad_kerb_capture.pcapng'.\n2. Extract the AS-REP etype 23 enc-part for user 'SVC_BACKUP'.\n3. Decrypt or crack the ticket components to reveal the administrative flag.",
    scenario: "Central Government Federal Domain Controller was compromised via unconstrained delegation. Investigate the Kerberos exchange.",
    baseFlag: "CTF{k3rb3r0s_g0ld3n_t1ck3t_f0rg3d}",
    flagSalt: "kerb_salt_512",
    hasLiveLab: false,
    prerequisites: ["NET-01"],
    hints: [
      { id: 1, cost: 40, text: "Filter for 'kerberos.msg_type == 11' (KRB-AS-REP) in Wireshark/tshark." }
    ],
    orderIndex: 6
  },
  {
    id: "NET-07",
    title: "VLAN Hopper: 802.1Q Trunk Injection",
    category: "NETWORK_PENETRATION",
    difficulty: "HARD",
    points: 350,
    estimatedTimeMins: 40,
    description: "The guest conference Wi-Fi port on switch port Gi0/12 was accidentally configured with Dynamic Trunking Protocol (DTP) enabled. Forge 802.1Q tags to hop into the management VLAN 99.",
    instructions: "1. Use the provided terminal with scapy/yersinia.\n2. Send a DTP negotiate packet to turn the access link into a trunk.\n3. Transmit an ICMP or HTTP request tagged with VLAN ID 99 to 192.168.99.1.",
    scenario: "Physical security assessment of state legislature facility. Bypass VLAN boundary to capture the management gateway banner.",
    baseFlag: "CTF{8021q_vl4n_h0pp1ng_trun_x82}",
    flagSalt: "vlan_hop_salt_661",
    hasLiveLab: true,
    labType: "LINUX_TERMINAL",
    labPort: 8083,
    prerequisites: ["NET-02"],
    hints: [
      { id: 1, cost: 50, text: "Use the custom python script 'vlan_injector.py --interface eth0 --vlan 99 --dest 192.168.99.1'." }
    ],
    orderIndex: 7
  },

  // ==========================================
  // CATEGORY 2: EXPLOITATION
  // ==========================================
  {
    id: "EXP-01",
    title: "SQL Injection: Second-Order Chamber",
    category: "EXPLOITATION",
    difficulty: "EASY",
    points: 100,
    estimatedTimeMins: 15,
    description: "An internal employee feedback portal sanitizes quotes on input, but deserializes and queries raw profile variables when the administrator generates the daily audit report.",
    instructions: "1. Access the web application target via the lab browser.\n2. Register an account with a crafted username payload that triggers during report aggregation.\n3. Dump the hidden administrator password column and obtain the flag.",
    scenario: "State Tax Revenue portal employee module. Exploit a second-order SQL vulnerability in the profile metadata generator.",
    baseFlag: "CTF{s3c0nd_0rd3r_sql1_unmasked}",
    flagSalt: "sqli_salt_401",
    hasLiveLab: true,
    labType: "WEB_APP",
    labPort: 8090,
    prerequisites: [],
    hints: [
      { id: 1, cost: 20, text: "Try registering with username: admin' UNION SELECT 1,flag,3,4 FROM system_secrets-- " },
      { id: 2, cost: 30, text: "Trigger the audit view at /api/audit/render to execute the stored query." }
    ],
    orderIndex: 8
  },
  {
    id: "EXP-02",
    title: "JWT Forgery: Alg-None & Key Confusion",
    category: "EXPLOITATION",
    difficulty: "MEDIUM",
    points: 200,
    estimatedTimeMins: 25,
    description: "The authentication microservice accepts RS256 JSON Web Tokens but fails to strictly validate the signature when modified with HMAC-SHA256 using the publicly exposed PEM public key.",
    instructions: "1. Inspect the session cookie returned upon login.\n2. Obtain the server's public key from /.well-known/jwks.json.\n3. Sign a forged token with role='super_admin' using HMAC-SHA256 with the public key as the secret.",
    scenario: "Federal biometric identity portal. Forge an administrative session token to access the classified directory.",
    baseFlag: "CTF{jwt_k3y_c0nfus10n_3xp0s3d}",
    flagSalt: "jwt_forge_salt_652",
    hasLiveLab: true,
    labType: "WEB_APP",
    labPort: 8091,
    prerequisites: ["EXP-01"],
    hints: [
      { id: 1, cost: 30, text: "Header algorithm should be changed from 'RS256' to 'HS256'." },
      { id: 2, cost: 50, text: "Use the raw bytes of public_key.pem as the secret HMAC key." }
    ],
    orderIndex: 9
  },
  {
    id: "EXP-03",
    title: "Linux Kernel Sudo / SUID Elevation",
    category: "EXPLOITATION",
    difficulty: "HARD",
    points: 350,
    estimatedTimeMins: 45,
    description: "You have obtained a restricted shell as user 'operator'. A custom diagnostic binary in /opt/diagnostics/sysmon has the SUID bit set and invokes a relative path binary without full qualification.",
    instructions: "1. Launch the lab Linux terminal.\n2. Enumerate SUID binaries with 'find / -perm -4000 2>/dev/null'.\n3. Hijack the relative execution path to spawn a root shell and read /root/flag.txt.",
    scenario: "Municipal Traffic Control management server. Privilege escalate from low-privilege maintenance worker to root.",
    baseFlag: "CTF{su1d_p4th_h1j4ck_r00t_0wn3d}",
    flagSalt: "suid_root_salt_883",
    hasLiveLab: true,
    labType: "LINUX_TERMINAL",
    labPort: 2223,
    prerequisites: ["EXP-01"],
    hints: [
      { id: 1, cost: 50, text: "Inspect strings inside /opt/diagnostics/sysmon. Notice it executes 'netstat -tuln' without an absolute path." },
      { id: 2, cost: 80, text: "Create /tmp/netstat with '/bin/bash -p', chmod +x it, and prepend /tmp to $PATH." }
    ],
    orderIndex: 10
  },
  {
    id: "EXP-04",
    title: "Command Injection: Filter Bypass Chain",
    category: "EXPLOITATION",
    difficulty: "MEDIUM",
    points: 250,
    estimatedTimeMins: 30,
    description: "An automated IP traceroute tool strips spaces, pipes, and ampersands. Construct an evasion payload utilizing internal shell variables ($IFS, brace expansion) to achieve arbitrary command execution.",
    instructions: "1. Connect to the network diagnostic web UI.\n2. Supply a command payload that bypasses the input regex filter without using whitespace.\n3. Cat the environment secret file to obtain the competition flag.",
    scenario: "Border Surveillance Radar Diagnostic Portal. Exploit an unsanitized system call behind the ping/traceroute endpoint.",
    baseFlag: "CTF{c0mm4nd_1nj3ct10n_1fs_byp4ss}",
    flagSalt: "cmd_inj_salt_219",
    hasLiveLab: true,
    labType: "WEB_APP",
    labPort: 8092,
    prerequisites: ["EXP-01"],
    hints: [
      { id: 1, cost: 40, text: "Replace spaces with '${IFS}' or use '{cat,/etc/passwd}'." },
      { id: 2, cost: 60, text: "Use ';' or '%0a' (newline) to separate commands." }
    ],
    orderIndex: 11
  },
  {
    id: "EXP-05",
    title: "Prototype Pollution to RCE (NodeJS)",
    category: "EXPLOITATION",
    difficulty: "EXPERT",
    points: 500,
    estimatedTimeMins: 60,
    description: "An express.js API server accepts JSON objects to configure user preferences. Deep merge routines allow pollution of Object.prototype, altering child_process fork options to execute arbitrary shell code.",
    instructions: "1. Analyze the client-side API calls to /api/settings/update.\n2. Inject '__proto__.NODE_OPTIONS' or '__proto__.shell' payload.\n3. Trigger the template compilation worker to spawn a reverse shell.",
    scenario: "National Voting Registry backend API. Leverage prototype pollution to achieve Remote Code Execution on the worker node.",
    baseFlag: "CTF{pr0t0typ3_p0llut10n_rce_g0d}",
    flagSalt: "proto_rce_salt_941",
    hasLiveLab: true,
    labType: "WEB_APP",
    labPort: 8093,
    prerequisites: ["EXP-02", "EXP-04"],
    hints: [
      { id: 1, cost: 80, text: "Send JSON with '__proto__': { 'shell': '/bin/sh', 'argv0': '-c', 'env': {'FLAG':'PAYLOAD'} }." },
      { id: 2, cost: 120, text: "Trigger the /api/report/export worker which executes child_process.fork()." }
    ],
    orderIndex: 12
  },
  {
    id: "EXP-06",
    title: "Memory Corruption: Heap UAF (Use-After-Free)",
    category: "EXPLOITATION",
    difficulty: "EXPERT",
    points: 450,
    estimatedTimeMins: 55,
    description: "Analyze an x86_64 ELF binary running as a high-security cryptographic vault daemon. A dangling pointer in the session cleanup routine permits heap chunk reallocation and arbitrary function pointer hijacking.",
    instructions: "1. Download the binary 'vault_daemon' or connect to port 9005.\n2. Allocate chunks of size 0x40, free the session structure, and allocate a fake buffer over the freed chunk.\n3. Overwrite the function pointer with the address of 'print_flag()'.",
    scenario: "Military Cryptographic Key Storage device. Exploit a use-after-free bug in the firmware memory manager.",
    baseFlag: "CTF{h34p_u4f_funct10n_p01nt3r_h1j4ck}",
    flagSalt: "heap_uaf_salt_734",
    hasLiveLab: true,
    labType: "LINUX_TERMINAL",
    labPort: 9005,
    prerequisites: ["EXP-03"],
    hints: [
      { id: 1, cost: 70, text: "Use 'checksec' to verify NX is enabled but PIE is disabled; 'print_flag' is at 0x00401236." },
      { id: 2, cost: 100, text: "Craft the exploit using pwntools: create user, delete user, create ticket with 32-byte payload." }
    ],
    orderIndex: 13
  },
  {
    id: "EXP-07",
    title: "SSRF: Cloud Metadata & IMDSv2 Bypass",
    category: "EXPLOITATION",
    difficulty: "HARD",
    points: 350,
    estimatedTimeMins: 40,
    description: "A PDF invoice generation service downloads user-supplied logo URLs. Exploit Server-Side Request Forgery to query the local instance metadata service and extract temporary cloud IAM credentials.",
    instructions: "1. Access the invoice branding portal.\n2. Submit an internal redirect URL (http://169.254.169.254/latest/meta-data/iam/security-credentials/).\n3. Capture the IAM role secret token and read the S3 bucket flag.",
    scenario: "Defense Logistics Agency procurement portal. Pivot from a blind PDF renderer to the cloud infrastructure control plane.",
    baseFlag: "CTF{ssrf_cl0ud_m3t4d4t4_3xpl01t}",
    flagSalt: "ssrf_salt_491",
    hasLiveLab: true,
    labType: "WEB_APP",
    labPort: 8094,
    prerequisites: ["EXP-01"],
    hints: [
      { id: 1, cost: 50, text: "Try DNS rebinding or a 302 redirect from an external host you control to bypass 169.254.169.254 blacklist." }
    ],
    orderIndex: 14
  },

  // ==========================================
  // CATEGORY 3: CRYPTOGRAPHY
  // ==========================================
  {
    id: "CRY-01",
    title: "Classical Matrix: Polybius Hill Cipher",
    category: "CRYPTOGRAPHY",
    difficulty: "EASY",
    points: 100,
    estimatedTimeMins: 15,
    description: "An intercepted diplomatic telegram from an embassy attache was encrypted using a 2x2 Hill matrix followed by alternating Caesar offsets.",
    instructions: "1. Review the ciphertext and the known plaintext fragment: 'TREATY'.\n2. Solve the 2x2 modular matrix inversion modulo 26.\n3. Decrypt the remaining message to recover the negotiation flag.",
    scenario: "Foreign Intelligence intercept. Decrypt an encrypted diplomatic communique.",
    baseFlag: "CTF{h1ll_c1ph3r_m4tr1x_inv3rs10n}",
    flagSalt: "crypto_hill_salt_123",
    hasLiveLab: false,
    prerequisites: [],
    hints: [
      { id: 1, cost: 20, text: "Calculate determinant of matrix K; verify gcd(det, 26) == 1 to find modular inverse." }
    ],
    orderIndex: 15
  },
  {
    id: "CRY-02",
    title: "RSA Fracture: Wiener's Small Private Exponent",
    category: "CRYPTOGRAPHY",
    difficulty: "MEDIUM",
    points: 200,
    estimatedTimeMins: 25,
    description: "A secure hardware module generated a 2048-bit RSA key using a small private exponent 'd' to speed up digital signatures. Exploiting continued fractions allows complete recovery of 'd'.",
    instructions: "1. Download the public parameters (N, e, c).\n2. Apply Wiener's continued fractions algorithm on e/N to locate convergent k/d.\n3. Compute m = c^d mod N and decode ASCII bytes.",
    scenario: "Satellite Communications cryptographic module. Uncover the private exponent through continued fraction expansion.",
    baseFlag: "CTF{w13n3r_sm4ll_d_c0nt1nu3d_fr4ct10n}",
    flagSalt: "rsa_wiener_salt_442",
    hasLiveLab: false,
    prerequisites: ["CRY-01"],
    hints: [
      { id: 1, cost: 30, text: "Notice 'e' is very close to N (e > N^0.75). This is the classic signature of Wiener's attack." },
      { id: 2, cost: 50, text: "Use python 'owil/rsa-wiener-attack' or write a quick 15-line continued fraction expansion script." }
    ],
    orderIndex: 16
  },
  {
    id: "CRY-03",
    title: "Fault Injection: AES Key Schedule Leak",
    category: "CRYPTOGRAPHY",
    difficulty: "HARD",
    points: 350,
    estimatedTimeMins: 45,
    description: "A differential fault analysis (DFA) attack on an embedded smart card caused a single bit flip in the 9th round of AES-128 encryption. Compare the faulty ciphertext with the correct ciphertext to deduce the 10th round key.",
    instructions: "1. Inspect the 16 pairs of correct and faulty ciphertexts.\n2. Trace the AES MixColumns and SubBytes differentials.\n3. Reverse the 10th round key through the Rijndael key schedule to extract the master key.",
    scenario: "Hardware Security Module (HSM) lab testing. Recover AES-128 master key from induced voltage glitches.",
    baseFlag: "CTF{d1ff3r3nt14l_f4ult_43s_k3y}",
    flagSalt: "aes_dfa_salt_781",
    hasLiveLab: false,
    prerequisites: ["CRY-02"],
    hints: [
      { id: 1, cost: 50, text: "A single fault in round 9 corrupts 4 bytes of the state in round 10." },
      { id: 2, cost: 80, text: "Use standard DFA equations: Delta C = SBox(State ^ Key) ^ SBox(FaultyState ^ Key)." }
    ],
    orderIndex: 17
  },
  {
    id: "CRY-04",
    title: "Elliptic Anomaly: Invalid Curve Attack",
    category: "CRYPTOGRAPHY",
    difficulty: "HARD",
    points: 400,
    estimatedTimeMins: 50,
    description: "An ECDH implementation over secp256r1 does not verify if peer public keys lie on the curve y^2 = x^3 + ax + b. Transmit points on weak curves with small group orders to recover the private scalar modulo small primes.",
    instructions: "1. Connect to the cryptographic verification API.\n2. Submit chosen invalid curve points with known small prime subgroup orders.\n3. Use the Chinese Remainder Theorem (CRT) to assemble the full private key.",
    scenario: "National Central Bank Inter-Ledger Protocol. Break non-validating elliptic curve diffie-hellman key exchange.",
    baseFlag: "CTF{3cc_1nv4l1d_curv3_crt_r3c0v3ry}",
    flagSalt: "ecc_inv_salt_912",
    hasLiveLab: false,
    prerequisites: ["CRY-02"],
    hints: [
      { id: 1, cost: 60, text: "The curve equation y^2 = x^3 - 3x + b' allows you to choose points on curves with smooth order." }
    ],
    orderIndex: 18
  },
  {
    id: "CRY-05",
    title: "Lattice Siege: Hidden Linear Polymath (LWE)",
    category: "CRYPTOGRAPHY",
    difficulty: "EXPERT",
    points: 500,
    estimatedTimeMins: 60,
    description: "A post-quantum Learning With Errors (LWE) cryptosystem prototype was deployed with insufficient noise parameters (error standard deviation sigma < 0.5). Formulate a CVP/SVP lattice problem and solve using Babai's nearest plane algorithm.",
    instructions: "1. Load the matrix A (dim 120x80) and ciphertext vector b.\n2. Construct the Kannan embedding lattice basis.\n3. Run LLL / BKZ reduction to expose the hidden secret key vector.",
    scenario: "Post-Quantum Cryptography transition trial. Break an under-parametrized Learning With Errors scheme.",
    baseFlag: "CTF{l4tt1c3_lw3_lll_b4b41_r3duc3d}",
    flagSalt: "lwe_lattice_salt_999",
    hasLiveLab: false,
    prerequisites: ["CRY-03", "CRY-04"],
    hints: [
      { id: 1, cost: 80, text: "Use SageMath or fplll to construct the (n+1) dimensional embedding lattice." },
      { id: 2, cost: 120, text: "The secret vector appears as the shortest vector in the reduced basis." }
    ],
    orderIndex: 19
  },
  {
    id: "CRY-06",
    title: "Hash Collide: MD5 Prefix Signature Forgery",
    category: "CRYPTOGRAPHY",
    difficulty: "MEDIUM",
    points: 250,
    estimatedTimeMins: 30,
    description: "A legacy software package verification service checks RSA signatures over MD5 hashes. Utilize chosen-prefix collision blocks to generate two distinct executables with identical digest signatures.",
    instructions: "1. Download the reference installer script and the signature file.\n2. Inspect the colliding prefix blocks.\n3. Extract the hidden verification phrase from the alternative binary payload.",
    scenario: "Firmware signing authority legacy migration audit. Prove collision forgery against MD5 certificate roots.",
    baseFlag: "CTF{ch0s3n_pr3f1x_c0ll1s10n_md5}",
    flagSalt: "md5_col_salt_339",
    hasLiveLab: false,
    prerequisites: ["CRY-01"],
    hints: [
      { id: 1, cost: 40, text: "Look for near-collision block differentials at offset 0x40 and 0x80." }
    ],
    orderIndex: 20
  },

  // ==========================================
  // CATEGORY 4: DIGITAL FORENSICS
  // ==========================================
  {
    id: "FOR-01",
    title: "Pixel Crypt: LSB Steganography & Polyglot",
    category: "DIGITAL_FORENSICS",
    difficulty: "EASY",
    points: 100,
    estimatedTimeMins: 15,
    description: "An operative's passport photo on an abandoned USB flash drive appears normal, but metadata anomalies and lower-order bit variance suggest a secondary filesystem is concealed inside.",
    instructions: "1. Analyze 'agent_id.png' using exiftool and binwalk.\n2. Extract the hidden 7z archive embedded within trailing PNG chunks (IEND trailer).\n3. Extract the password-protected document using the GPS coordinates found in metadata.",
    scenario: "Counter-Espionage Border Intercept. Recover concealed intelligence files from an image polyglot.",
    baseFlag: "CTF{lsb_st3g_p0lygl0t_3xtr4ct}",
    flagSalt: "steg_poly_salt_231",
    hasLiveLab: false,
    prerequisites: [],
    hints: [
      { id: 1, cost: 20, text: "Run 'exiftool agent_id.png' to obtain the GPS coordinates; format is 'XX.XXXX,YY.YYYY' for the 7z password." }
    ],
    orderIndex: 21
  },
  {
    id: "FOR-02",
    title: "Memory Core: Volatility Process Injection",
    category: "DIGITAL_FORENSICS",
    difficulty: "MEDIUM",
    points: 200,
    estimatedTimeMins: 25,
    description: "A memory acquisition dump (memdump.raw) was taken from a workstation compromised by ransomware. Identify the hollowed process, carved shellcode, and decrypted ransom note.",
    instructions: "1. Load the dump in the forensic lab workstation.\n2. Run Volatility 3 'windows.malfind' and 'windows.pslist' to pinpoint the injected PID.\n3. Dump the injected VAD memory region and strings out the decrypted flag string.",
    scenario: "Hospital Critical Care Network incident response. Pinpoint process hollowing injection in Windows memory dump.",
    baseFlag: "CTF{v0l4t1l1ty_m3mdump_m4lf1nd_01}",
    flagSalt: "volatility_salt_551",
    hasLiveLab: true,
    labType: "FORENSICS_STATION",
    labPort: 8095,
    prerequisites: ["FOR-01"],
    hints: [
      { id: 1, cost: 30, text: "Look for PAGE_EXECUTE_READWRITE permissions without a mapped disk file in explorer.exe or svchost.exe." },
      { id: 2, cost: 50, text: "Run 'vol -f memdump.raw windows.malfind --pid 2840 --dump' and inspect strings." }
    ],
    orderIndex: 22
  },
  {
    id: "FOR-03",
    title: "Artifact Hunt: Windows Registry & Prefetch",
    category: "DIGITAL_FORENSICS",
    difficulty: "MEDIUM",
    points: 250,
    estimatedTimeMins: 30,
    description: "Examine SYSTEM, SOFTWARE and NTUSER.DAT hives alongside .pf prefetch files to determine the exact timestamp an adversary executed a wiper utility and the volume serial number of their plugged-in flash drive.",
    instructions: "1. Parse Registry UserAssist and MountedDevices keys.\n2. Correlate with prefetch run counter for 'CLEANER.EXE'.\n3. Format the flag as CTF{VolumeSerialNumber_PrefetchTimestamp}.",
    scenario: "Federal Court Evidence Forensics. Establish chain of custody and execution timeline of data wiping malware.",
    baseFlag: "CTF{pr3f3tch_r3g1stry_t1m3l1n3_94}",
    flagSalt: "prefetch_salt_682",
    hasLiveLab: false,
    prerequisites: ["FOR-01"],
    hints: [
      { id: 1, cost: 40, text: "Check AppCompatCache (Shimcache) and Amcache.hve for the exact SHA1 of the executed binary." }
    ],
    orderIndex: 23
  },
  {
    id: "FOR-04",
    title: "Shadow Carve: Deleted B-Tree SQLite Recovery",
    category: "DIGITAL_FORENSICS",
    difficulty: "HARD",
    points: 350,
    estimatedTimeMins: 45,
    description: "An encrypted chat database had its conversation history wiped via 'DELETE FROM messages'. Carve unallocated B-Tree leaf pages and WAL log frames to reconstruct deleted secret negotiations.",
    instructions: "1. Download 'secure_comms.db' and its companion 'secure_comms.db-wal'.\n2. Carve raw SQLite cell records from freelist pages.\n3. Reassemble the fragmented UTF-8 strings to restore the flag message.",
    scenario: "Organized Cybercrime Task Force raid. Recover deliberately deleted instant messaging logs from database freelists.",
    baseFlag: "CTF{sql1t3_fr33l1st_c4rv1ng_succ3ss}",
    flagSalt: "sqlite_carve_salt_812",
    hasLiveLab: false,
    prerequisites: ["FOR-02"],
    hints: [
      { id: 1, cost: 50, text: "Search for the table header signature 0x0D (leaf table b-tree page) in raw hex." }
    ],
    orderIndex: 24
  },
  {
    id: "FOR-05",
    title: "Firmware Rip: SPI Flash & U-Boot Reverse",
    category: "DIGITAL_FORENSICS",
    difficulty: "HARD",
    points: 400,
    estimatedTimeMins: 50,
    description: "A binary dump of a 16MB SPI NOR flash chip from a compromised military IoT surveillance camera contains U-Boot, a SquashFS rootfs, and a proprietary encrypted calibration partition.",
    instructions: "1. Decompress the SquashFS filesystem using unsquashfs.\n2. Reverse engineer the binary /usr/bin/camera_auth to discover the hardcoded AES key.\n3. Decrypt the calibration blob at offset 0xE00000 to extract the operational flag.",
    scenario: "Autonomous Drone Countermeasures. Extract hardcoded keys from dumped SPI flash firmware image.",
    baseFlag: "CTF{sp1_fl4sh_squ4shfs_ub00t_r3v}",
    flagSalt: "firmware_salt_914",
    hasLiveLab: false,
    prerequisites: ["FOR-02"],
    hints: [
      { id: 1, cost: 60, text: "Look in /etc/init.d/rcS for the calibration partition mount command." }
    ],
    orderIndex: 25
  },
  {
    id: "FOR-06",
    title: "Apex Cold Boot: DRAM Scrambling & Remanence",
    category: "DIGITAL_FORENSICS",
    difficulty: "EXPERT",
    points: 500,
    estimatedTimeMins: 60,
    description: "A liquid nitrogen cold-boot memory image was acquired from a server powered down abruptly. The memory controller utilized pseudo-random bit scrambling. De-scramble the DDR4 lines and extract the ephemeral TLS session keys.",
    instructions: "1. Analyze 'scrambled_ddr4.bin'.\n2. Recover the 32-bit Linear Feedback Shift Register (LFSR) seed used by the memory controller.\n3. XOR the stream and extract the master secrets to decrypt the intercepted HTTPS stream.",
    scenario: "Black Swan Special Operations. Recover ephemeral encryption keys from physical DDR4 cold boot image.",
    baseFlag: "CTF{c0ld_b00t_d3scr4mbl3_m4st3r_x}",
    flagSalt: "cold_boot_salt_998",
    hasLiveLab: false,
    prerequisites: ["FOR-03", "FOR-04"],
    hints: [
      { id: 1, cost: 80, text: "Locate known constant blocks (such as consecutive nulls or kernel page tables) to calculate the LFSR keystream." },
      { id: 2, cost: 120, text: "Polynomial is x^32 + x^22 + x^2 + x^1 + 1. Berlekamp-Massey algorithm will recover the polynomial." }
    ],
    orderIndex: 26
  }
];
