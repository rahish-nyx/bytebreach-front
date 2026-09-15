"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, Search } from "lucide-react";
import { PublicPage } from "@/components/PublicPage";

type FaqItem = {
  q: string;
  a: string;
  category: "General" | "Scoring & XP" | "Labs & CTF" | "Certifications";
};

const faqs: FaqItem[] = [
  {
    category: "General",
    q: "What is ByteBreach Security Academy?",
    a: "ByteBreach Security Academy is a hands-on cybersecurity training platform and gamified cyber warfare battleground providing interactive CLI terminal simulations, Cisco networking tracks (CCNA, CCNP, CCIE), and real-world Capture-The-Flag (CTF) practice labs.",
  },
  {
    category: "General",
    q: "Are ByteBreach study rooms and cheat sheets free?",
    a: "Yes. ByteBreach provides free community access to structured study modules, cheat sheets, protocol summaries, and interactive practice challenges to empower cybersecurity learners worldwide.",
  },
  {
    category: "General",
    q: "Can beginners learn cybersecurity on ByteBreach?",
    a: "Yes. The CCNA and Fundamentals tracks require zero prior engineering experience, starting with basic networking, binary IP addressing, and fundamental Linux terminal operations before progressing to advanced exploits.",
  },
  {
    category: "Scoring & XP",
    q: "How do I earn XP and rank on the Leaderboard?",
    a: "Daily Challenges award 50 XP, completed learning rooms award 25 XP, and hands-on CTF practice labs award between 50 and 300 XP depending on lab difficulty. Consecutive daily logins build streak multipliers on the global operative leaderboard.",
  },
  {
    category: "Scoring & XP",
    q: "When does the Daily Challenge reset?",
    a: "The Daily Challenge resets every 24 hours (with automated daily rotation cycles). Submissions are locked after one attempt until the next daily challenge window unlocks.",
  },
  {
    category: "Labs & CTF",
    q: "How are Capture-The-Flag (CTF) flags validated?",
    a: "Flags are submitted in standard FLAG{...} format. Our automated verification engine trims whitespace and validates submissions case-insensitively, instantly updating your profile telemetry.",
  },
  {
    category: "Labs & CTF",
    q: "How do browser-based terminal labs work?",
    a: "Labs run directly in your web browser with interactive terminal consoles, packet inspectors, and simulated routers, eliminating the need to install heavy virtual machines or hypervisors locally.",
  },
  {
    category: "Labs & CTF",
    q: "Are labs run in isolated sandbox environments?",
    a: "Yes. ByteBreach labs are simulated defensive and offensive testbeds intended for authorized learning, hands-on skill development, and defensive security research.",
  },
  {
    category: "Certifications",
    q: "Which certifications does ByteBreach prepare you for?",
    a: "ByteBreach prepares operatives for Cisco CCNA 200-301, CCNP 350-401 ENCOR, CCIE Enterprise Infrastructure, CompTIA Security+, CEH, and OSCP through hands-on terminal labs and realistic topologies.",
  },
  {
    category: "General",
    q: "What resources are in the ByteBreach cheat sheet vault?",
    a: "The vault contains searchable command cheat codes, Nmap discovery templates, Wireshark filter recipes, Subnetting reference sheets, and Bash automation scripts for quick reference during labs and exams.",
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = ["All", "General", "Scoring & XP", "Labs & CTF", "Certifications"];

  const filteredFaqs = faqs.filter((item) => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch =
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PublicPage eyebrow="Knowledge Base" title="Frequently Asked Questions (FAQ)">
      <p className="text-sm text-slate-300 leading-relaxed">
        Everything you need to know about ByteBreach Security Academy, our Cisco networking tracks, CTF scoring engine, and interactive laboratory sandboxes.
      </p>

      {/* Search and Category Filter */}
      <div className="mt-6 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions or keywords..."
            className="w-full rounded-xl border border-line bg-[#080d16] py-3 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeCategory === cat
                  ? "bg-cyan text-ink shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                  : "border border-line bg-panel text-slate-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="mt-8 space-y-3">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={item.q}
                className={`overflow-hidden rounded-2xl border transition-all ${
                  isOpen ? "border-cyan/50 bg-cyan/[.03] shadow-[0_0_20px_rgba(6,182,212,0.06)]" : "border-line bg-panel hover:border-line/80"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-start justify-between gap-4 p-5 text-left transition"
                >
                  <div className="flex items-start gap-3">
                    <HelpCircle size={17} className={`mt-0.5 shrink-0 ${isOpen ? "text-cyan" : "text-slate-400"}`} />
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-cyan/80">
                        {item.category}
                      </span>
                      <h3 className="mt-0.5 text-sm font-semibold text-white sm:text-base">
                        {item.q}
                      </h3>
                    </div>
                  </div>
                  <ChevronDown
                    className={`shrink-0 text-cyan transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    size={18}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-line/60 px-5 pb-5 pt-3">
                    <p className="text-xs leading-relaxed text-slate-300 sm:text-sm pl-7">
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-line p-8 text-center text-xs text-muted">
            No questions found matching &ldquo;{search}&rdquo;. Try another search term.
          </div>
        )}
      </div>
    </PublicPage>
  );
}
