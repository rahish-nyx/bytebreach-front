import type { Metadata } from "next";
import { PublicPage } from "@/components/PublicPage";
import { Award, BookOpen, CheckCircle2, Flag, Shield, Terminal, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | Mission, Curriculum & Architecture",
  description:
    "ByteBreach Security Academy builds the next breach-proof generation through hands-on simulated cyber warfare, Cisco enterprise networking tracks (CCNA to CCIE), and browser-based CTF arenas.",
};

export default function AboutPage() {
  return (
    <PublicPage eyebrow="Academy Architecture" title="About ByteBreach Security Academy">
      {/* Platform Mission */}
      <section className="space-y-4">
        <p className="text-base font-medium text-slate-200 leading-relaxed">
          ByteBreach exists to build the next breach-proof generation through hands-on, simulated cyber warfare. Operatives learn by doing: packet analysis, network engineering across CCNA, CCNP, and CCIE tracks, ethical hacking, and authorized penetration testing.
        </p>
        <p className="text-sm text-slate-300 leading-relaxed">
          Unlike passive video tutorials, ByteBreach immerses learners in interactive terminal simulations, live capture-the-flag (CTF) challenges, and realistic enterprise networking scenarios from day one. Our gamified progression engine turns consistent practice into visible momentum: earn XP from Daily Challenges, complete structured study rooms, and capture flags on CTF practice targets while advancing through operative ranks.
        </p>
      </section>

      {/* Core Pillars */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-panel p-5">
          <div className="flex items-center gap-2 text-cyan font-bold text-sm">
            <Terminal size={18} />
            <span>Cisco Networking</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            From foundational CCNA 200-301 to CCNP Enterprise and expert CCIE architectures. Master OSPF, BGP, multi-area topologies, IPv4/IPv6 dual-stack addressing, and VLAN segmentation.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-5">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Flag size={18} />
            <span>Offensive & Defensive CTF</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Engage with isolated cyber ranges that reflect actual breach tactics. Learn reconnaissance, OWASP Top 10 exploitation, binary triage, and Linux privilege escalation.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-5">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Zap size={18} />
            <span>Skill Telemetry & XP</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Track daily learning streaks, timed sprints, and peer rankings on the global leaderboard. Earn verifiable telemetry badges as you advance through operative ranks.
          </p>
        </div>
      </div>

      {/* Curriculum Tracks Section */}
      <section className="mt-12 border-t border-line/60 pt-10">
        <div className="eyebrow text-cyan">Curriculum Matrix</div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
          Which cybersecurity and networking tracks does ByteBreach offer?
        </h2>
        <p className="mt-2 text-xs text-muted max-w-3xl">
          Explore our curriculum paths designed to take operatives from foundational networking concepts to expert offensive and defensive cyber operations.
        </p>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-panel/80">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-line bg-ink/70 text-[11px] font-semibold uppercase tracking-wider text-cyan">
              <tr>
                <th scope="col" className="px-4 py-3">Curriculum Track</th>
                <th scope="col" className="px-4 py-3">Skill Level</th>
                <th scope="col" className="px-4 py-3">Key Technical Domains</th>
                <th scope="col" className="px-4 py-3">Practical Lab Focus</th>
                <th scope="col" className="px-4 py-3">Target Certification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              <tr className="hover:bg-cyan/5 transition-colors">
                <td className="px-4 py-3.5 font-bold text-white">CCNA Network Associate</td>
                <td className="px-4 py-3 text-cyan">Beginner</td>
                <td className="px-4 py-3">IPv4/IPv6, Subnetting, VLANs, OSPFv2, NAT, Wireless</td>
                <td className="px-4 py-3">CLI Router &amp; Switch Configuration</td>
                <td className="px-4 py-3 text-slate-400">Cisco CCNA 200-301</td>
              </tr>
              <tr className="hover:bg-cyan/5 transition-colors">
                <td className="px-4 py-3.5 font-bold text-white">CCNP Enterprise</td>
                <td className="px-4 py-3 text-indigo-400">Advanced</td>
                <td className="px-4 py-3">Dual-Stack Routing, BGP, Multicast, QoS, SD-WAN, Automation</td>
                <td className="px-4 py-3">Enterprise Multi-Area Topologies</td>
                <td className="px-4 py-3 text-slate-400">Cisco 350-401 ENCOR</td>
              </tr>
              <tr className="hover:bg-cyan/5 transition-colors">
                <td className="px-4 py-3.5 font-bold text-white">CCIE Enterprise Infrastructure</td>
                <td className="px-4 py-3 text-amber-400">Expert</td>
                <td className="px-4 py-3">Complex Packet Analysis, Border Gateways, Zero Trust Architecture</td>
                <td className="px-4 py-3">Mission-Critical Live Diagnostics</td>
                <td className="px-4 py-3 text-slate-400">Cisco CCIE Lab Exam</td>
              </tr>
              <tr className="hover:bg-cyan/5 transition-colors">
                <td className="px-4 py-3.5 font-bold text-white">Ethical Hacking &amp; Penetration Testing</td>
                <td className="px-4 py-3 text-emerald-400">Intermediate</td>
                <td className="px-4 py-3">OWASP Top 10, Port Scanning, Metasploit, PrivEsc, Web Shells</td>
                <td className="px-4 py-3">Capture-The-Flag (CTF) Cyber Ranges</td>
                <td className="px-4 py-3 text-slate-400">CompTIA PenTest+, CEH, OSCP</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* CTF Practice Labs Section */}
      <section className="mt-12 border-t border-line/60 pt-10">
        <div className="eyebrow text-cyan">Cyber Warfare Ranges</div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
          What Capture-The-Flag (CTF) practice lab domains are offered on ByteBreach?
        </h2>
        <p className="mt-2 text-xs text-muted max-w-3xl">
          ByteBreach hosts an extensive portfolio of browser-accessible cyber ranges designed to develop practical offensive and defensive skills.
        </p>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-panel/80">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-line bg-ink/70 text-[11px] font-semibold uppercase tracking-wider text-cyan">
              <tr>
                <th scope="col" className="px-4 py-3">Lab Category</th>
                <th scope="col" className="px-4 py-3">Primary Attack Vectors &amp; Defense</th>
                <th scope="col" className="px-4 py-3">Simulated Environment</th>
                <th scope="col" className="px-4 py-3">XP Reward</th>
                <th scope="col" className="px-4 py-3">Difficulty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              <tr className="hover:bg-cyan/5 transition-colors">
                <td className="px-4 py-3.5 font-bold text-white">Web Application Exploitation</td>
                <td className="px-4 py-3">SQL Injection, Stored XSS, SSRF, IDOR, Broken Authentication</td>
                <td className="px-4 py-3">Isolated Web App Docker Container</td>
                <td className="px-4 py-3 text-cyan">100 - 250 XP</td>
                <td className="px-4 py-3 text-emerald-400">Easy to Hard</td>
              </tr>
              <tr className="hover:bg-cyan/5 transition-colors">
                <td className="px-4 py-3.5 font-bold text-white">Network Forensics &amp; Packet Triage</td>
                <td className="px-4 py-3">PCAP Stream Reassembly, ARP Poisoning, Rogue DHCP Detection</td>
                <td className="px-4 py-3">Wireshark Stream Terminal</td>
                <td className="px-4 py-3 text-cyan">75 - 200 XP</td>
                <td className="px-4 py-3 text-cyan">Beginner to Intermediate</td>
              </tr>
              <tr className="hover:bg-cyan/5 transition-colors">
                <td className="px-4 py-3.5 font-bold text-white">Linux Privilege Escalation</td>
                <td className="px-4 py-3">SUID Abuse, Sudoer Wildcards, Cron Manipulation, Kernel Exploits</td>
                <td className="px-4 py-3">Interactive SSH Pseudo-Terminal</td>
                <td className="px-4 py-3 text-cyan">150 - 300 XP</td>
                <td className="px-4 py-3 text-indigo-400">Intermediate to Hard</td>
              </tr>
              <tr className="hover:bg-cyan/5 transition-colors">
                <td className="px-4 py-3.5 font-bold text-white">Active Directory &amp; Kerberos Defense</td>
                <td className="px-4 py-3">Kerberoasting, AS-REP Roasting, BloodHound Paths, Pass-the-Hash</td>
                <td className="px-4 py-3">Domain Controller Virtual Topology</td>
                <td className="px-4 py-3 text-cyan">200 - 350 XP</td>
                <td className="px-4 py-3 text-amber-400">Advanced</td>
              </tr>
              <tr className="hover:bg-cyan/5 transition-colors">
                <td className="px-4 py-3.5 font-bold text-white">Applied Cryptography &amp; Steganography</td>
                <td className="px-4 py-3">RSA Padding Oracle, Hash Length Extension, AES-CBC Bit Flipping</td>
                <td className="px-4 py-3">Python / CyberChef Crypto Sandbox</td>
                <td className="px-4 py-3 text-cyan">100 - 250 XP</td>
                <td className="px-4 py-3 text-indigo-400">Intermediate</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Step-by-Step Training Journey */}
      <section className="mt-12 border-t border-line/60 pt-10">
        <div className="eyebrow text-cyan">Pedagogical Framework</div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
          How does the ByteBreach operative training journey work step-by-step?
        </h2>
        <p className="mt-2 text-xs text-muted max-w-3xl">
          Our structured framework guides learners through an immersive cycle of concept mastery, hands-on exploitation, and automated validation.
        </p>
        <ol className="mt-5 space-y-3.5 rounded-2xl border border-line bg-panel/60 p-5 text-xs text-slate-300 list-decimal list-inside">
          <li className="leading-relaxed">
            <strong className="text-white">Select a Structured Learning Path:</strong> Choose between CCNA networking, CCNP enterprise routing, CCIE expert architecture, or Ethical Hacking based on your career goals.
          </li>
          <li className="leading-relaxed">
            <strong className="text-white">Launch Interactive Terminal Simulators:</strong> Execute hands-on configuration commands inside your browser without needing heavy local virtual machines.
          </li>
          <li className="leading-relaxed">
            <strong className="text-white">Capture and Validate Target Flags:</strong> Discover security misconfigurations, retrieve unique <code className="text-cyan bg-ink/70 px-1.5 py-0.5 rounded font-mono">FLAG&#123;...&#125;</code> tokens, and submit them for real-time verification.
          </li>
          <li className="leading-relaxed">
            <strong className="text-white">Earn Telemetry XP and Maintain Streaks:</strong> Accumulate experience points, level up your operative rank from Script Kiddie to Root Master, and climb the leaderboard.
          </li>
          <li className="leading-relaxed">
            <strong className="text-white">Leverage the Technical Resource Vault:</strong> Inspect searchable syntax sheets, Nmap scanning guides, and Wireshark filter templates to accelerate your problem-solving speed.
          </li>
        </ol>
      </section>

      {/* Technical Vault Resources */}
      <section className="mt-12 border-t border-line/60 pt-10">
        <div className="eyebrow text-cyan">Tactical Reference</div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
          What technical cheat codes and tools are available in the ByteBreach vault?
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-panel/60 p-4">
            <h3 className="text-sm font-semibold text-white">Networking &amp; Infrastructure Playbooks</h3>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-400 list-disc list-inside">
              <li>IPv4 Subnetting Matrix (VLSM calculation cheat sheets)</li>
              <li>Cisco IOS Command Quick Reference (OSPF, BGP, VLANs, ACLs)</li>
              <li>Wireshark Packet Filters for Incident Response &amp; Forensics</li>
              <li>BGP Peering &amp; Dual-Stack IPv6 Configuration Recipes</li>
            </ul>
          </div>
          <div className="rounded-xl border border-line bg-panel/60 p-4">
            <h3 className="text-sm font-semibold text-white">Offensive Security &amp; CTF Cheats</h3>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-400 list-disc list-inside">
              <li>Nmap Network Port Scanning &amp; NSE Script Reference</li>
              <li>Linux &amp; Windows Privilege Escalation Enumeration Commands</li>
              <li>OWASP Top 10 Web Exploitation Payloads &amp; Methodologies</li>
              <li>Bash &amp; Python Security Automation One-Liners</li>
            </ul>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
