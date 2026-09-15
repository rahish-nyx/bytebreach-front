"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { doc, onSnapshot } from "firebase/firestore";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import { Bot, ChevronRight, ExternalLink, Send, Sparkles, X } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { db } from "@/lib/firebaseConfig";
import { LOCAL_ADMIN_SESSION_KEY } from "@/lib/demoAuth";

type Message = {
  from: "bot" | "you";
  text: string;
  action?: { label: string; href: string };
};

type CurriculumTopic = {
  id: string;
  keywords: string[];
  title: string;
  path: string;
  actionLabel: string;
  answer: string;
};

// Comprehensive ByteBreach curriculum knowledge base
const curriculumKnowledge: CurriculumTopic[] = [
  {
    id: "all_tracks",
    keywords: [
      "curriculum",
      "all tracks",
      "tracks",
      "paths",
      "all paths",
      "learning paths",
      "what do you teach",
      "what tracks",
      "courses",
      "syllabus",
      "offer",
      "catalog",
    ],
    title: "Curriculum Matrix & Learning Tracks",
    path: "/learning-paths",
    actionLabel: "Explore All Learning Paths",
    answer:
      "ByteBreach offers 4 structured, hands-on cybersecurity & networking tracks:\n\n" +
      "1. CCNA (Beginner): Foundations of enterprise networking, IPv4/IPv6 subnetting, Cisco IOS CLI, VLANs, and OSPFv2.\n" +
      "2. CCNP Enterprise (Advanced): Dual-stack architectures, BGP routing, Cisco SD-WAN, QoS, and Python network automation.\n" +
      "3. CCIE Infrastructure (Expert): Complex protocol dissection, MP-BGP, Segment Routing, L3VPNs, and Zero Trust defense.\n" +
      "4. Ethical Hacking & PenTest (Intermediate): OWASP Top 10, Nmap recon, Linux & Windows privilege escalation, Active Directory, and CTF challenges.\n\n" +
      "Choose a path below to begin your operative deployment!",
  },
  {
    id: "ccna",
    keywords: [
      "ccna",
      "cisco certified network associate",
      "200-301",
      "beginner network",
      "routing and switching",
      "cisco basic",
      "learn ccna",
    ],
    title: "Cisco CCNA (200-301) Track",
    path: "/learning-paths/ccna",
    actionLabel: "Open CCNA Track & Modules",
    answer:
      "The CCNA (200-301) Track builds a rock-solid foundation in modern enterprise IP networking:\n\n" +
      "• IPv4 & IPv6 Addressing & VLSM Subnetting\n" +
      "• Cisco IOS Switch & Router CLI Configuration\n" +
      "• VLANs, 802.1Q Trunking & Inter-VLAN Routing (Router-on-a-Stick)\n" +
      "• Spanning Tree Protocol (STP / RSTP 802.1w)\n" +
      "• Dynamic Routing with Single & Multi-Area OSPFv2\n" +
      "• Standard & Extended Access Control Lists (ACLs)\n" +
      "• Network Address Translation (Static, Dynamic NAT & PAT)\n" +
      "• Network Services (DHCP, DNS, NTP, SNMP) and Switch Port Security\n\n" +
      "All modules feature browser-based interactive terminal simulations!",
  },
  {
    id: "ccnp",
    keywords: [
      "ccnp",
      "encor",
      "350-401",
      "ccnp enterprise",
      "advanced routing",
      "enterprise network",
    ],
    title: "Cisco CCNP Enterprise (350-401 ENCOR) Track",
    path: "/learning-paths/ccnp-enterprise",
    actionLabel: "Open CCNP Enterprise Track",
    answer:
      "The CCNP Enterprise (350-401 ENCOR) Track trains operatives for large-scale enterprise network infrastructures:\n\n" +
      "• Advanced OSPF Tuning (LSA types 1-7, stub areas, authentication, virtual links)\n" +
      "• Border Gateway Protocol (eBGP & iBGP peering, path attributes, route maps, weight)\n" +
      "• Dual-Stack Enterprise Network Architectures (IPv4/IPv6)\n" +
      "• First Hop Redundancy Protocols (HSRP, VRRP, GLBP)\n" +
      "• Enterprise Wireless Design, Controllers & Roaming Security\n" +
      "• Quality of Service (QoS queuing, policing, shaping, DSCP/CoS)\n" +
      "• Cisco SD-WAN (vManage, vSmart, vBond, vEdge) & DNA Center\n" +
      "• Network Programmability with Python, RESTCONF, NETCONF & YANG models",
  },
  {
    id: "ccie",
    keywords: [
      "ccie",
      "ccie infrastructure",
      "enterprise infrastructure",
      "expert network",
      "ccie lab",
      "masterclass",
    ],
    title: "Cisco CCIE Enterprise Infrastructure Track",
    path: "/learning-paths/ccie",
    actionLabel: "Open CCIE Track & Architecture",
    answer:
      "The CCIE Enterprise Infrastructure Masterclass is our elite, expert-level track:\n\n" +
      "• Multiprotocol BGP (MP-BGP) & Enterprise Traffic Engineering\n" +
      "• Segment Routing (SR-MPLS) & Layer 3 MPLS VPN (L3VPN, VRFs, RD, RT)\n" +
      "• Advanced Layer 2 & Layer 3 Security Hardening & Zero Trust Topologies\n" +
      "• High-Volume Packet Captures & Mission-Critical Diagnostics\n" +
      "• Automated Streaming Telemetry Pipelines\n" +
      "• CI/CD Network Deployments & Python Automation Frameworks",
  },
  {
    id: "ethical_hacking",
    keywords: [
      "ethical hacking",
      "pentest",
      "penetration testing",
      "hacking",
      "hacker",
      "offensive security",
      "ceh",
      "oscp",
      "cyber security track",
    ],
    title: "Ethical Hacking & Penetration Testing Track",
    path: "/learning-paths/ethical-hacking",
    actionLabel: "Open Ethical Hacking Track",
    answer:
      "The Ethical Hacking & Penetration Testing Track teaches real-world offensive cyber warfare:\n\n" +
      "• Reconnaissance & OSINT (Passive & active scanning, Nmap, Masscan)\n" +
      "• Web Application Exploitation (OWASP Top 10: SQLi, XSS, SSRF, IDOR, CSRF)\n" +
      "• Linux Privilege Escalation (SUID abuse, wildcard sudo, cron jobs, kernel exploits)\n" +
      "• Windows & Active Directory Attacks (Kerberoasting, AS-REP roasting, BloodHound, Pass-the-Hash)\n" +
      "• Applied Cryptography, Asymmetric Ciphers & Hash Cracking (Hashcat, John the Ripper)\n" +
      "• Digital Forensics & Incident Response (DFIR packet & memory triage)\n\n" +
      "Practice directly inside isolated target sandboxes!",
  },
  {
    id: "subnetting",
    keywords: [
      "subnet",
      "subnetting",
      "vlsm",
      "cidr",
      "ipv4",
      "ipv6",
      "ip address",
      "prefix length",
      "slash notation",
      "broadcast address",
      "network id",
    ],
    title: "Subnetting & VLSM Calculation",
    path: "/learning-paths/ccna",
    actionLabel: "Open CCNA Subnetting Room",
    answer:
      "Subnetting divides a larger IP network into smaller, isolated subnets using Variable Length Subnet Masking (VLSM) and CIDR notation (/24 to /30).\n\n" +
      "Key formulas:\n" +
      "• Total Addresses = 2^(32 - prefix)\n" +
      "• Usable Hosts = 2^(32 - prefix) - 2 (subtract Network ID and Broadcast ID)\n" +
      "• Block Size (Magic Number) = 256 - Interesting Octet Mask\n\n" +
      "You can practice hands-on subnetting in Module 1 of the CCNA Track or inspect the Subnetting Cheat Sheet in the Vault!",
  },
  {
    id: "ospf",
    keywords: [
      "ospf",
      "ospfv2",
      "ospfv3",
      "open shortest path first",
      "lsa",
      "dijkstra",
      "spf",
      "stub area",
      "area 0",
      "dr/bdr",
      "link state",
    ],
    title: "Open Shortest Path First (OSPF)",
    path: "/learning-paths/ccna",
    actionLabel: "Study OSPF in CCNA",
    answer:
      "OSPF is an open-standard link-state interior gateway routing protocol (IGP):\n\n" +
      "• Algorithm: Dijkstra's Shortest Path First (SPF) with Cost metric (Reference Bandwidth / Interface Bandwidth)\n" +
      "• Hierarchy: Centered around Area 0 (Backbone Area)\n" +
      "• Packets: Hello (establishes neighbor adjacencies), DBD, LSR, LSU, LSAck\n" +
      "• Multi-Access: Elects Designated Router (DR) and Backup Designated Router (BDR) to reduce LSA flooding\n\n" +
      "Single-area OSPF is taught in CCNA, with multi-area and stub area tuning in CCNP Enterprise!",
  },
  {
    id: "bgp",
    keywords: [
      "bgp",
      "ebgp",
      "ibgp",
      "border gateway",
      "autonomous system",
      "as path",
      "route map",
      "bgp attributes",
      "peering",
    ],
    title: "Border Gateway Protocol (BGP)",
    path: "/learning-paths/ccnp-enterprise",
    actionLabel: "Study BGP in CCNP",
    answer:
      "BGP is the path-vector exterior routing protocol that powers the global internet, exchanging routing reachability between Autonomous Systems (AS):\n\n" +
      "• Types: eBGP (between distinct ASNs, default TTL 1) and iBGP (within the same ASN, full mesh or route reflectors)\n" +
      "• Port: TCP port 179 for reliable session establishment\n" +
      "• Best Path Selection Hierarchy:\n" +
      "  1. Highest Weight (Cisco proprietary, local to router)\n" +
      "  2. Highest Local Preference (propagated within ASN)\n" +
      "  3. Locally originated routes\n" +
      "  4. Shortest AS-Path\n" +
      "  5. Lowest Origin (IGP < EGP < Incomplete)\n" +
      "  6. Lowest MED (Multi-Exit Discriminator)\n\n" +
      "Master BGP configuration and policy route-maps in CCNP and CCIE!",
  },
  {
    id: "vlan_switching",
    keywords: [
      "vlan",
      "vlans",
      "trunking",
      "802.1q",
      "inter-vlan",
      "router on a stick",
      "switchport",
      "access port",
      "trunk port",
      "svi",
    ],
    title: "VLANs & 802.1Q Trunking",
    path: "/learning-paths/ccna",
    actionLabel: "Study Switching in CCNA",
    answer:
      "VLANs (Virtual Local Area Networks) partition a single physical switch into multiple isolated broadcast domains at Layer 2 for security and traffic optimization:\n\n" +
      "• Access Ports: Assigned to a single VLAN for end-user devices (untagged traffic)\n" +
      "• Trunk Ports: Carry traffic for multiple VLANs over a single link using IEEE 802.1Q tags (12-bit VLAN ID)\n" +
      "• Inter-VLAN Routing: Routed using sub-interfaces on a router (Router-on-a-Stick) or Switched Virtual Interfaces (SVIs) on a Layer 3 multilayer switch\n\n" +
      "Interactive switch configuration is practiced in CCNA!",
  },
  {
    id: "stp",
    keywords: [
      "stp",
      "spanning tree",
      "rstp",
      "802.1w",
      "bridge loop",
      "bpdu",
      "root bridge",
      "blocking port",
    ],
    title: "Spanning Tree Protocol (STP & RSTP)",
    path: "/learning-paths/ccna",
    actionLabel: "Study STP in CCNA",
    answer:
      "Spanning Tree Protocol (IEEE 802.1D / RSTP 802.1w) prevents catastrophic Layer 2 broadcast storms and bridge loops on redundant switch topologies:\n\n" +
      "• Root Bridge Election: Lowest Bridge ID (Priority + MAC address) becomes the root\n" +
      "• Port Roles: Root Port (lowest cost to root), Designated Port (best port on segment), Alternate/Blocking Port (drops traffic to prevent loops)\n" +
      "• RSTP (802.1w): Rapid convergence using Proposal/Agreement handshakes instead of timer-based listening/learning states\n\n" +
      "Covered with live topology exercises in CCNA!",
  },
  {
    id: "acls",
    keywords: [
      "acl",
      "acls",
      "access control list",
      "access list",
      "standard acl",
      "extended acl",
      "wildcard mask",
      "permit",
      "deny",
    ],
    title: "Access Control Lists (ACLs)",
    path: "/learning-paths/ccna",
    actionLabel: "Study ACLs in CCNA",
    answer:
      "Access Control Lists (ACLs) filter network traffic based on packet headers:\n\n" +
      "• Standard ACLs (1-99, 1300-1999): Filter based on SOURCE IP address only. Place as close to the destination as possible.\n" +
      "• Extended ACLs (100-199, 2000-2699): Filter based on Source IP, Destination IP, Protocol (TCP, UDP, ICMP), and Port number (e.g., eq 80, eq 443). Place as close to the source as possible.\n" +
      "• Implicit Deny: All ACLs end with an invisible 'deny any' statement at the bottom\n\n" +
      "Hands-on syntax and placement rules are detailed in CCNA!",
  },
  {
    id: "nat",
    keywords: [
      "nat",
      "pat",
      "network address translation",
      "port address translation",
      "nat overload",
      "inside local",
      "inside global",
    ],
    title: "Network Address Translation (NAT & PAT)",
    path: "/learning-paths/ccna",
    actionLabel: "Study NAT in CCNA",
    answer:
      "NAT translates private RFC 1918 IPv4 addresses into routable public IP addresses:\n\n" +
      "• Static NAT: 1-to-1 permanent mapping (ideal for public web or mail servers)\n" +
      "• Dynamic NAT: Many-to-many mapping from a pool of public IPs\n" +
      "• PAT (NAT Overload): Many-to-1 mapping where thousands of internal hosts share a single public IP, distinguished by unique Layer 4 source port numbers\n\n" +
      "Cisco IOS NAT configuration is covered in the CCNA track!",
  },
  {
    id: "sqli",
    keywords: [
      "sqli",
      "sql injection",
      "sql inject",
      "union select",
      "database injection",
      "blind sql",
    ],
    title: "SQL Injection (SQLi) Exploitation & Defense",
    path: "/learning-paths/ethical-hacking",
    actionLabel: "Open SQLi Room in Ethical Hacking",
    answer:
      "SQL Injection (SQLi) occurs when untrusted user input is directly concatenated into SQL queries without sanitization or parameterization:\n\n" +
      "• Classic Authentication Bypass: ' OR 1=1-- or admin' --\n" +
      "• UNION-Based SQLi: Combining attacker query output with original query columns\n" +
      "• Blind SQLi: Extracting data character-by-character using Boolean TRUE/FALSE or time delays (SLEEP)\n" +
      "• Defense: Parameterized queries (Prepared Statements), ORMs, and least-privilege database user accounts\n\n" +
      "Exploit and patch SQLi in Ethical Hacking and Practice Labs!",
  },
  {
    id: "xss",
    keywords: [
      "xss",
      "cross-site scripting",
      "cross site scripting",
      "stored xss",
      "reflected xss",
      "dom xss",
      "cookie theft",
    ],
    title: "Cross-Site Scripting (XSS)",
    path: "/learning-paths/ethical-hacking",
    actionLabel: "Open Web Exploitation Labs",
    answer:
      "Cross-Site Scripting (XSS) allows attackers to execute malicious client-side JavaScript in victims' browsers:\n\n" +
      "• Stored (Persistent) XSS: Malicious payload is stored in the database (e.g., comments or profiles) and served to all visitors\n" +
      "• Reflected XSS: Payload is embedded in a malicious link or query parameter and reflected by the server without storage\n" +
      "• DOM XSS: Vulnerability exists entirely within client-side JavaScript reading from sources (location.search) into sinks (innerHTML, eval)\n" +
      "• Mitigation: Context-aware output encoding, Content Security Policy (CSP), and HttpOnly session cookies\n\n" +
      "Tested inside our isolated Docker container labs!",
  },
  {
    id: "privesc",
    keywords: [
      "privilege escalation",
      "privesc",
      "suid",
      "sudo",
      "cron",
      "linux privesc",
      "windows privesc",
      "root access",
      "sudo -l",
    ],
    title: "Linux & Windows Privilege Escalation",
    path: "/learning-paths/ethical-hacking",
    actionLabel: "Open Privilege Escalation Rooms",
    answer:
      "Privilege Escalation elevates an initial unprivileged foothold to full root or Administrator access:\n\n" +
      "• SUID Binaries: Misconfigured binaries with setuid bit set (`find / -perm -4000 -type f 2>/dev/null`) that can spawn shells\n" +
      "• Sudo Privileges: Checking `sudo -l` for wildcard binaries or NOPASSWD execution\n" +
      "• Cron Jobs: Writable scripts or paths executed on recurring schedules by root\n" +
      "• Kernel Exploits: Missing OS security patches (e.g., Dirty COW, PwnKit)\n" +
      "• Windows Vectors: Unquoted service paths, AlwaysInstallElevated registry keys, token impersonation\n\n" +
      "Practice hands-on Linux privesc in the Ethical Hacking track!",
  },
  {
    id: "active_directory",
    keywords: [
      "active directory",
      "kerberos",
      "kerberoasting",
      "as-rep",
      "asrep",
      "bloodhound",
      "domain controller",
      "pass the hash",
      "mimikatz",
    ],
    title: "Active Directory & Kerberos Exploitation",
    path: "/learning-paths/ethical-hacking",
    actionLabel: "Open Active Directory Modules",
    answer:
      "Active Directory (AD) is the core enterprise identity and access management system:\n\n" +
      "• Kerberoasting: Requesting Kerberos TGS service tickets for accounts with Service Principal Names (SPNs) and cracking the RC4/AES hashes offline\n" +
      "• AS-REP Roasting: Targeting accounts with 'Do not require Kerberos preauthentication' enabled to capture initial AS-REP tickets\n" +
      "• BloodHound: Graph analysis tool mapping shortest attack paths to Domain Admin\n" +
      "• Pass-the-Hash: Authenticating using NTLM password hashes without knowing plaintext passwords\n\n" +
      "Study attack paths and defensive hardening in Ethical Hacking!",
  },
  {
    id: "nmap",
    keywords: [
      "nmap",
      "port scan",
      "port scanning",
      "syn scan",
      "reconnaissance",
      "osint",
      "service version",
      "recon",
    ],
    title: "Nmap Network Reconnaissance & Port Scanning",
    path: "/resources",
    actionLabel: "Open Nmap Playbooks in Vault",
    answer:
      "Nmap (Network Mapper) is the industry standard for network discovery and security auditing:\n\n" +
      "• `nmap -sS <target>`: Stealth TCP SYN Half-Open scan (leaves connection uncompleted)\n" +
      "• `nmap -sV <target>`: Probe open ports to determine service name and exact version\n" +
      "• `nmap -sC <target>`: Run default Nmap Scripting Engine (NSE) scripts\n" +
      "• `nmap -p- <target>`: Scan all 65,535 TCP ports\n" +
      "• `nmap -O <target>`: OS fingerprinting based on TCP/IP stack behavior\n" +
      "• `nmap --script vuln <target>`: Automated CVE vulnerability assessment\n\n" +
      "Inspect complete Nmap scanning cheat codes in the Resource Vault!",
  },
  {
    id: "wireshark",
    keywords: [
      "wireshark",
      "pcap",
      "packet analysis",
      "packet capture",
      "traffic analysis",
      "forensics",
      "tcpdump",
      "arp poisoning",
    ],
    title: "Network Forensics & Wireshark PCAP Triage",
    path: "/resources",
    actionLabel: "Open Wireshark Cheats in Vault",
    answer:
      "Wireshark is the world's most popular packet analysis tool for network forensics and incident response:\n\n" +
      "• PCAP Dissection: Analyzing TCP 3-way handshakes (SYN, SYN-ACK, ACK) and teardowns\n" +
      "• Attack Detection: Detecting ARP poisoning (duplicate MAC addresses), rogue DHCP offers, and SYN floods\n" +
      "• Useful Display Filters:\n" +
      "  - `http.request.method == \"POST\"`\n" +
      "  - `tcp.flags.reset == 1`\n" +
      "  - `ip.addr == 192.168.1.50 && tcp.port == 443`\n" +
      "  - `dns.flags.response == 1 && dns.qry.name contains \"malicious\"`\n\n" +
      "Access Wireshark filter recipes in the Technical Vault!",
  },
  {
    id: "practice_labs",
    keywords: [
      "practice lab",
      "practice labs",
      "ctf",
      "capture the flag",
      "flags",
      "flag",
      "challenges",
      "cyber range",
      "battleground",
      "sandbox",
    ],
    title: "Capture-The-Flag (CTF) Practice Labs",
    path: "/practice-labs",
    actionLabel: "Launch Practice Labs (CTF)",
    answer:
      "ByteBreach hosts 250+ browser-based CTF practice lab domains:\n\n" +
      "• Web Application Exploitation (SQLi, XSS, SSRF, IDOR)\n" +
      "• Network Forensics (Wireshark stream reassembly, ARP inspection)\n" +
      "• Linux Privilege Escalation (SUID, Sudoers, Cron manipulation)\n" +
      "• Active Directory & Kerberos Defense (Kerberoasting, BloodHound)\n" +
      "• Applied Cryptography & Ciphers (RSA, Bit Flipping, CyberChef)\n\n" +
      "Challenge Tiers award between 50 XP and 300 XP. Submit flags in standard FLAG{...} format!",
  },
  {
    id: "daily_challenge",
    keywords: [
      "daily challenge",
      "daily",
      "today's challenge",
      "daily reset",
      "streak",
      "consecutive days",
    ],
    title: "Daily Cyber Warfare Challenge",
    path: "/",
    actionLabel: "Go to Daily Challenge on Dashboard",
    answer:
      "The Daily Challenge delivers a fresh tactical cyber warfare scenario every 24 hours (resets daily at 00:00 UTC):\n\n" +
      "• Format: Real-world scenario with optional PCAPs, configuration snippets, or source code attachments\n" +
      "• Reward: +50 XP upon correct solution verification\n" +
      "• Streak Multipliers: Daily submissions increase your operative streak and boost your global rank on the leaderboard\n\n" +
      "Deploy to today's challenge directly from the main Dashboard!",
  },
  {
    id: "xp_scoring",
    keywords: [
      "xp",
      "points",
      "score",
      "scoring",
      "rank",
      "ranks",
      "level",
      "leaderboard",
      "script kiddie",
      "root master",
      "earn xp",
      "increase xp",
      "how to earn xp",
    ],
    title: "Operative XP Telemetry & Rank Hierarchy",
    path: "/leaderboard",
    actionLabel: "View Operative Leaderboard",
    answer:
      "Operatives advance through 5 tactical rank tiers by earning XP:\n\n" +
      "How to earn XP:\n" +
      "• Daily Challenge: +50 XP per day\n" +
      "• Learning Rooms: +25 XP upon completing study content & checklist\n" +
      "• Practice Labs CTF: +50 to +300 XP depending on lab difficulty\n\n" +
      "Operative Ranks:\n" +
      "1. Script Kiddie: 0 – 249 XP\n" +
      "2. Packet Sniffer: 250 – 499 XP\n" +
      "3. Byte Breaker: 500 – 999 XP\n" +
      "4. Cyber Operative: 1,000 – 1,999 XP\n" +
      "5. Root Master: 2,000+ XP",
  },
  {
    id: "resources_vault",
    keywords: [
      "cheat",
      "cheats",
      "cheat sheet",
      "cheat codes",
      "vault",
      "resources",
      "tools",
      "commands",
      "scripts",
      "handouts",
    ],
    title: "Technical Resource & Cheat Code Vault",
    path: "/resources",
    actionLabel: "Open Technical Vault",
    answer:
      "The ByteBreach Technical Vault provides tactical command cheats, scripts, and handouts:\n\n" +
      "• IPv4 & IPv6 Subnetting Matrix (VLSM quick calculators)\n" +
      "• Cisco IOS Command Cheats (OSPF, BGP, VLANs, ACLs, NAT)\n" +
      "• Wireshark Packet Filter recipes for incident response\n" +
      "• Nmap Scanning syntax & NSE vulnerability scripts\n" +
      "• Linux & Windows Privilege Escalation one-liners\n" +
      "• OWASP Web Exploitation attack payloads\n\n" +
      "Read directly in-browser or download formatted Markdown/PDF attachments!",
  },
  {
    id: "certifications",
    keywords: [
      "cert",
      "certs",
      "certification",
      "certifications",
      "cisco cert",
      "security+",
      "comptia",
      "oscp",
      "ceh",
      "which certification",
      "career",
    ],
    title: "Industry Certification Alignment",
    path: "/learning-paths",
    actionLabel: "Explore Certification Tracks",
    answer:
      "ByteBreach prepares operatives directly for major industry cybersecurity and networking certifications:\n\n" +
      "• Cisco CCNA 200-301 (Network Associate)\n" +
      "• Cisco CCNP Enterprise 350-401 ENCOR\n" +
      "• Cisco CCIE Enterprise Infrastructure Lab Exam\n" +
      "• CompTIA Security+ & PenTest+\n" +
      "• EC-Council Certified Ethical Hacker (CEH)\n" +
      "• OffSec Certified Professional (OSCP)\n\n" +
      "Our interactive terminal topology labs mirror actual exam task requirements!",
  },
  {
    id: "about",
    keywords: [
      "about",
      "about bytebreach",
      "who are you",
      "what is bytebreach",
      "mission",
      "platform",
    ],
    title: "About ByteBreach Security Academy",
    path: "/about",
    actionLabel: "Read About ByteBreach",
    answer:
      "ByteBreach Security Academy is an immersive, hands-on cybersecurity training battleground. We combine real-world Cisco networking tracks (CCNA to CCIE), browser-based CLI terminal simulations, and gamified CTF warfare to train the next breach-proof generation of cyber defenders.",
  },
  {
    id: "faq",
    keywords: [
      "faq",
      "frequently asked questions",
      "questions",
      "knowledge base",
      "help",
    ],
    title: "Frequently Asked Questions (FAQ)",
    path: "/faq",
    actionLabel: "Open FAQ Center",
    answer:
      "Our FAQ Center covers everything about ByteBreach Security Academy, scoring engines, daily challenge rotations, lab terminal browser sandboxes, and learning tracks with searchable categories and instant answers.",
  },
  {
    id: "contact",
    keywords: [
      "contact",
      "support",
      "feedback",
      "report",
      "help desk",
      "contact support",
      "email",
    ],
    title: "Direct Command Uplink (Contact)",
    path: "/contact",
    actionLabel: "Contact Support Team",
    answer:
      "Need direct mission assistance or want to report an issue? You can connect directly with our academy administrators through our Direct Command Uplink.",
  },
];

// Quick presets for navigation and commands - strictly curriculum & platform features (no legal pages)
const curriculumPresets: Array<[string, string]> = [
  ["CCNA Networking Track", "/learning-paths/ccna"],
  ["CCNP Enterprise Track", "/learning-paths/ccnp-enterprise"],
  ["CCIE Infrastructure Track", "/learning-paths/ccie"],
  ["Ethical Hacking Track", "/learning-paths/ethical-hacking"],
  ["All Learning Paths", "/learning-paths"],
  ["Practice Labs (CTF)", "/practice-labs"],
  ["Cheat Codes & Vault", "/resources"],
  ["Operative Leaderboard", "/leaderboard"],
  ["Frequently Asked Questions", "/faq"],
  ["About ByteBreach", "/about"],
  ["Contact Support", "/contact"],
];

export function AiAssistant() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [profile, setProfile] = useState<{
    lastVisitedModuleId?: string;
    lastStudiedModuleTitle?: string;
    lastVisitedPath?: string;
  }>({});

  const constraintsRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Close modal on Escape key press
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const [isLocalAdmin, setIsLocalAdmin] = useState(false);

  useEffect(() => {
    setIsLocalAdmin(
      typeof window !== "undefined" &&
      window.localStorage.getItem(LOCAL_ADMIN_SESSION_KEY) === "true"
    );
  }, []);

  const isAuthenticated = Boolean(user || isLocalAdmin);
  const isPublicOrLoggedOut = !isAuthenticated || pathname === "/login";

  const defaultGreeting =
    "I’m Breach Buddy, your ByteBreach curriculum & academy assistant! Ask me anything about our CCNA, CCNP, CCIE, or Ethical Hacking tracks, CTF practice labs, or technical cheat codes.";

  const [messages, setMessages] = useState<Message[]>([
    {
      from: "bot",
      text: defaultGreeting,
      action: { label: "Explore All Learning Paths", href: "/learning-paths" },
    },
  ]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "users", user.uid), (snapshot) =>
      setProfile((snapshot.data() || {}) as typeof profile)
    );
  }, [user]);

  const reply = (text: string, action?: { label: string; href: string }) =>
    setMessages((items) => [...items, { from: "bot", text, action }]);

  const send = (text = prompt) => {
    const clean = text.trim();
    if (!clean) return;
    setMessages((items) => [...items, { from: "you", text: clean }]);
    setPrompt("");
    const lower = clean.toLowerCase();

    // Friendly greeting handler
    if (
      lower === "hi" ||
      lower === "hello" ||
      lower === "hey" ||
      lower === "greetings" ||
      lower.startsWith("hi ") ||
      lower.startsWith("hello ")
    ) {
      return reply(
        "Greetings, Operative! I am Breach Buddy, your ByteBreach curriculum guide. I can explain any networking or ethical hacking concept, break down our CCNA, CCNP, CCIE, and PenTest tracks, show practice lab domains, or provide direct links to any lesson or tool. What would you like to explore?",
        { label: "Browse Learning Paths", href: "/learning-paths" }
      );
    }

    // Match query against the curriculum knowledge base
    let bestMatch: CurriculumTopic | null = null;
    let highestScore = 0;

    for (const topic of curriculumKnowledge) {
      let score = 0;
      for (const kw of topic.keywords) {
        if (lower === kw) {
          score += 15;
        } else if (lower.includes(kw)) {
          score += kw.length;
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = topic;
      }
    }

    if (bestMatch && highestScore > 0) {
      return reply(bestMatch.answer, {
        label: bestMatch.actionLabel,
        href: bestMatch.path,
      });
    }

    // Fallback response for unrecognized questions with direct guidance
    return reply(
      "I am Breach Buddy, your ByteBreach cyber & curriculum assistant. I specialize in our academy tracks (CCNA, CCNP Enterprise, CCIE, Ethical Hacking), CTF practice labs, Daily Challenges, and technical cheat codes.\n\n" +
      "Try asking about a specific topic such as 'Subnetting', 'OSPF', 'BGP', 'VLANs', 'SQL Injection', 'Linux PrivEsc', 'Active Directory', 'Nmap', 'Wireshark', or 'Practice Labs'!",
      { label: "View All Curriculum Paths", href: "/learning-paths" }
    );
  };

  const activate = (label: string, href?: string) => {
    if (label === "Currently Studying") {
      const moduleId = profile.lastVisitedModuleId;
      if (moduleId)
        reply(
          `You are currently deployed on: ${profile.lastStudiedModuleTitle || "your active learning room"}.`,
          {
            label: "Resume Module",
            href: `/room/${moduleId}`,
          }
        );
      else if (profile.lastVisitedPath)
        reply(
          `You are currently deployed on: ${profile.lastStudiedModuleTitle || "your active track"}.`,
          {
            label: "Resume Track",
            href: profile.lastVisitedPath,
          }
        );
      else
        reply(
          "No active room deployment found. Deploy to CCNA, CCNP, CCIE, or Ethical Hacking to start ranking up.",
          {
            label: "Open Learning Paths",
            href: "/learning-paths",
          }
        );
      return;
    }

    if (label === "How to Increase XP") {
      return reply(
        "Operative, here is how you earn XP on ByteBreach:\n\n" +
        "1. Daily Challenge: +50 XP per day upon successful verification.\n" +
        "2. Study Rooms & Modules: +25 XP upon completing all knowledge checks.\n" +
        "3. Practice Labs CTF: +50 to +300 XP per captured flag.\n\n" +
        "Stack XP to advance your rank from Script Kiddie up to Root Master!",
        { label: "View Leaderboard", href: "/leaderboard" }
      );
    }

    if (label === "How to Solve Labs") {
      return reply(
        "Head to Practice Labs, inspect the briefing, access the target IP/container, capture the flag, and submit it in FLAG{...} format.",
        { label: "Open Practice Labs", href: "/practice-labs" }
      );
    }

    if (href) {
      setOpen(false);
      router.push(href as Route);
    }
  };

  const visiblePresets = isAuthenticated
    ? [
        ["Currently Studying", ""],
        ["How to Increase XP", ""],
        ["How to Solve Labs", ""],
        ...curriculumPresets,
      ]
    : curriculumPresets;

  return (
    <>
      {/* Invisible boundary container for drag constraints within safe viewport area */}
      <div
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none z-50 p-3 pt-16 pb-20 md:pt-4 md:pb-4"
      />

      {/* Floating Draggable Breach Buddy Launcher Button */}
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.12}
        dragMomentum={false}
        onDragStart={() => {
          isDraggingRef.current = true;
        }}
        onDragEnd={() => {
          setTimeout(() => {
            isDraggingRef.current = false;
          }, 120);
        }}
        onClick={() => {
          if (isDraggingRef.current) return;
          setOpen((prev) => !prev);
        }}
        role="button"
        tabIndex={0}
        aria-label={open ? "Close Breach Buddy AI assistant" : "Open Breach Buddy AI assistant"}
        title="Breach Buddy AI (Drag to float freely)"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((prev) => !prev);
          }
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        className="group fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-6 right-4 md:right-6 z-50 grid h-14 w-14 cursor-grab active:cursor-grabbing place-items-center rounded-2xl bg-cyan text-ink shadow-[0_8px_32px_rgba(53,213,208,.35)] select-none touch-none hover:shadow-[0_12px_36px_rgba(53,213,208,.5)] transition-shadow duration-200"
      >
        {open ? (
          <X size={24} />
        ) : (
          <Bot size={26} className="transition-transform group-hover:scale-110" />
        )}
      </motion.div>

      {/* Mobile Backdrop Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {open && (
        <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] sm:bottom-24 sm:inset-x-auto sm:right-6 sm:w-[400px] z-50 flex max-h-[min(78vh,640px)] flex-col overflow-hidden rounded-2xl border border-line bg-[#0d141e] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-3 border-b border-line p-4">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet/15 text-violet">
              <Bot size={19} />
            </div>
            <div>
              <div className="text-sm font-semibold">
                Breach Buddy <span className="ml-1 text-[10px] text-cyan">● ONLINE</span>
              </div>
              <div className="text-[11px] text-muted">
                Curriculum & Tactical Academy Guide
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close Breach Buddy"
              className="ml-auto rounded-lg p-1.5 text-muted hover:bg-white/[.08] hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[420px] space-y-3 overflow-y-auto p-4">
            {messages.map((message, i) => (
              <div
                key={i}
                className={`flex ${message.from === "you" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[92%] rounded-xl px-3.5 py-2.5 text-xs leading-5 whitespace-pre-line ${
                    message.from === "you"
                      ? "bg-cyan text-ink font-medium"
                      : "bg-panel text-slate-300 border border-line/60"
                  }`}
                >
                  {message.text}
                  {message.action && (
                    <button
                      onClick={() => {
                        setOpen(false);
                        router.push(message.action!.href as Route);
                      }}
                      className="mt-3 flex w-full items-center justify-between gap-2 rounded-lg bg-cyan px-3 py-2 text-[11px] font-bold text-ink hover:opacity-90 transition shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                    >
                      <span>{message.action.label}</span>
                      <ChevronRight size={14} className="shrink-0" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="space-y-2 pt-2">
              <div className="text-[10px] uppercase tracking-wider text-muted font-mono">
                {isAuthenticated ? "Academy Commands & Curriculum" : "Curriculum & Training Tracks"}
              </div>
              <div className="grid gap-1.5">
                {visiblePresets.map(([label, href]) => (
                  <button
                    key={label}
                    onClick={() => activate(label, href)}
                    className="flex min-h-9 w-full items-center justify-between rounded-lg border border-line px-3 py-2 text-left text-xs text-slate-300 hover:border-cyan/50 hover:bg-cyan/5 transition"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles size={12} className="text-cyan shrink-0" />
                      {label}
                    </span>
                    <ChevronRight size={13} className="text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 border-t border-line p-3">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about tracks, modules, labs, or tools..."
              className="min-w-0 flex-1 rounded-lg bg-panel px-3 py-2 text-xs outline-none placeholder:text-muted focus:ring-1 focus:ring-cyan text-slate-200"
            />
            <button
              aria-label="Send message"
              onClick={() => send()}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan text-ink hover:opacity-90 transition"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
