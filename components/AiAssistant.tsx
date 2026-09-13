"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { doc, onSnapshot } from "firebase/firestore";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import { Bot, ChevronRight, Send, Sparkles, X } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { db } from "@/lib/firebaseConfig";
import { LOCAL_ADMIN_SESSION_KEY } from "@/lib/demoAuth";

type Message = { from: "bot" | "you"; text: string; action?: { label: string; href: string } };

const refusal =
  "I am Breach Buddy, your internal ByteBreach cyber assistant. I can only guide you through your academy tracks, labs, cheat sheets, and platform features.";

const authenticatedPresets = [
  ["CCNA Track & Modules", "/learning-paths/ccna"],
  ["CCNP Track & Modules", "/learning-paths/ccnp-enterprise"],
  ["CCIE Track & Modules", "/learning-paths/ccie"],
  ["Ethical Hacking Track", "/learning-paths/ethical-hacking"],
  ["New Cheat Codes", "/resources"],
  ["About ByteBreach", "/about"],
  ["Contact", "/contact"],
  ["FAQ", "/faq"],
  ["Terms & Conditions", "/terms"],
  ["Disclaimer", "/disclaimer"],
  ["Careers", "/careers"],
  ["Privacy Policy", "/privacy"],
  ["Cookie Policy", "/cookies"],
];

const publicPresets = [
  ["About ByteBreach", "/about"],
  ["Contact Support", "/contact"],
  ["FAQ", "/faq"],
  ["Terms & Conditions", "/terms"],
  ["Disclaimer", "/disclaimer"],
  ["Privacy Policy", "/privacy"],
  ["Cookie Policy", "/cookies"],
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

  const [messages, setMessages] = useState<Message[]>([
    {
      from: "bot",
      text: "I’m Breach Buddy, your ByteBreach guide. Explore platform policies, support, and documentation below, or sign in to access training tracks and labs."
    }
  ]);

  // Update initial message when auth state transitions
  useEffect(() => {
    setMessages([
      {
        from: "bot",
        text: isPublicOrLoggedOut
          ? "I’m Breach Buddy, your ByteBreach guide. Explore platform policies, support, and documentation below, or sign in to access training tracks and labs."
          : "I’m Breach Buddy, your internal ByteBreach assistant. Choose a guide or ask about your academy."
      }
    ]);
  }, [isPublicOrLoggedOut]);

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

    const destinations: Array<[string, string]> = [
      ["about bytebreach", "/about"],
      ["about", "/about"],
      ["contact support", "/contact"],
      ["contact", "/contact"],
      ["faq", "/faq"],
      ["terms", "/terms"],
      ["disclaimer", "/disclaimer"],
      ["careers", "/careers"],
      ["privacy", "/privacy"],
      ["cookies", "/cookies"]
    ];

    const destination = destinations.find(([phrase]) => lower.includes(phrase));
    if (destination) {
      setOpen(false);
      router.push(destination[1] as Route);
      return;
    }

    // Strict boundary for unauthenticated visitors
    if (isPublicOrLoggedOut) {
      if (
        lower.includes("lab") ||
        lower.includes("track") ||
        lower.includes("module") ||
        lower.includes("dashboard") ||
        lower.includes("overview") ||
        lower.includes("learning") ||
        lower.includes("practice") ||
        lower.includes("cheat") ||
        lower.includes("ccna") ||
        lower.includes("ccnp") ||
        lower.includes("ccie") ||
        lower.includes("ethical") ||
        lower.includes("xp") ||
        lower.includes("room") ||
        lower.includes("challenge") ||
        lower.includes("rank") ||
        lower.includes("flag")
      ) {
        return reply(
          "Access restricted. Please log in or register your ByteBreach account to access our training labs, tracks, and resources.",
          { label: "Go to Login", href: "/login" }
        );
      }

      return reply(
        "I am Breach Buddy. Explore platform policies, documentation, and support links below, or sign in to access training tracks and labs.",
        { label: "Go to Login", href: "/login" }
      );
    }

    // Authenticated queries
    if (lower.includes("increase xp") || lower.includes("earn xp")) {
      return reply(
        "Operative, here is how you earn XP on ByteBreach:\n1. Daily Challenge: +50 XP per day upon successful solution verification.\n2. Study Rooms & Modules: +25 XP upon completing all knowledge checks and marking the room complete.\n3. Practice Labs CTF: +50 to +150 XP per captured flag.\nStack XP to advance your rank from Script Kiddie up to Root Master!"
      );
    }
    if (lower.includes("how to lab") || lower.includes("practice lab")) {
      return reply(
        "Head to Practice Labs, inspect the briefing, access the target IP/link, capture the flag, and submit it in FLAG{...} format."
      );
    }
    if (
      lower.includes("ccna") ||
      lower.includes("ccnp") ||
      lower.includes("ccie") ||
      lower.includes("ethical") ||
      lower.includes("network") ||
      lower.includes("module") ||
      lower.includes("track") ||
      lower.includes("navigate") ||
      lower.includes("bytebreach")
    ) {
      return reply(
        "I can guide you through ByteBreach tracks, modules, networking lessons, ethical hacking rooms, Practice Labs, resources, XP, and account features. Use the preset commands below to open a workspace."
      );
    }

    return reply(refusal);
  };

  const activate = (label: string, href?: string) => {
    if (isPublicOrLoggedOut) {
      if (href) {
        setOpen(false);
        router.push(href as Route);
      } else {
        reply(
          "Access restricted. Please log in or register your ByteBreach account to access our training labs, tracks, and resources.",
          { label: "Go to Login", href: "/login" }
        );
      }
      return;
    }

    if (label === "Currently Studying") {
      const moduleId = profile.lastVisitedModuleId;
      if (moduleId)
        reply(`You are currently deployed on: ${profile.lastStudiedModuleTitle || "your active learning room"}.`, {
          label: "Resume Module",
          href: `/room/${moduleId}`
        });
      else if (profile.lastVisitedPath)
        reply(`You are currently deployed on: ${profile.lastStudiedModuleTitle || "your active track"}.`, {
          label: "Resume Track",
          href: profile.lastVisitedPath
        });
      else
        reply("No active room deployment found. Deploy to CCNA, CCNP, CCIE, or Ethical Hacking to start ranking up.", {
          label: "Open Learning Paths",
          href: "/learning-paths"
        });
      return;
    }

    if (label === "How to Increase XP") {
      return reply(
        "Operative, here is how you earn XP on ByteBreach:\n1. Daily Challenge: +50 XP per day upon successful solution verification.\n2. Study Rooms & Modules: +25 XP upon completing all knowledge checks and marking the room complete.\n3. Practice Labs CTF: +50 to +150 XP per captured flag.\nStack XP to advance your rank from Script Kiddie up to Root Master!"
      );
    }

    if (label === "How to Lab") {
      return reply(
        "Head to Practice Labs, inspect the briefing, access the target IP/link, capture the flag, and submit it in FLAG{...} format."
      );
    }

    if (href) {
      setOpen(false);
      router.push(href as Route);
    }
  };

  const visiblePresets = isPublicOrLoggedOut
    ? publicPresets
    : [
        ...authenticatedPresets.slice(0, 5),
        ["Currently Studying", ""],
        ["How to Increase XP", ""],
        ["How to Lab", ""],
        ...authenticatedPresets.slice(5)
      ];

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
        <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] sm:bottom-24 sm:inset-x-auto sm:right-6 sm:w-[380px] z-50 flex max-h-[min(74vh,600px)] flex-col overflow-hidden rounded-2xl border border-line bg-[#0d141e] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-3 border-b border-line p-4">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet/15 text-violet">
              <Bot size={19} />
            </div>
            <div>
              <div className="text-sm font-semibold">
                Breach Buddy <span className="ml-1 text-[10px] text-cyan">● ONLINE</span>
              </div>
              <div className="text-[11px] text-muted">
                {isPublicOrLoggedOut ? "Public platform guide" : "Internal ByteBreach assistant"}
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

          <div className="max-h-96 space-y-3 overflow-y-auto p-4">
            {messages.map((message, i) => (
              <div key={i} className={`flex ${message.from === "you" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[90%] rounded-xl px-3 py-2 text-xs leading-5 ${
                    message.from === "you" ? "bg-cyan text-ink" : "bg-panel text-slate-300"
                  }`}
                >
                  {message.text}
                  {message.action && (
                    <button
                      onClick={() => {
                        setOpen(false);
                        router.push(message.action!.href as Route);
                      }}
                      className="mt-3 block rounded-lg bg-cyan px-3 py-2 text-[11px] font-bold text-ink hover:opacity-90 transition"
                    >
                      {message.action.label}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="space-y-2 pt-1">
              <div className="text-[10px] uppercase tracking-wider text-muted">
                {isPublicOrLoggedOut ? "Information & Policies" : "ByteBreach commands"}
              </div>
              <div className="grid gap-2">
                {visiblePresets.map(([label, href]) => (
                  <button
                    key={label}
                    onClick={() => activate(label, href)}
                    className="flex min-h-9 w-full items-center justify-between rounded-lg border border-line px-3 py-2 text-left text-xs text-slate-300 hover:border-cyan/50 transition"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles size={12} className="text-violet" />
                      {label}
                    </span>
                    <ChevronRight size={13} />
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
              placeholder={
                isPublicOrLoggedOut
                  ? "Ask about policies, FAQ, contact..."
                  : "Ask about ByteBreach..."
              }
              className="min-w-0 flex-1 rounded-lg bg-panel px-3 py-2 text-xs outline-none placeholder:text-muted focus:ring-1 focus:ring-cyan"
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

