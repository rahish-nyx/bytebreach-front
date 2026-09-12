"use client";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Crown, Medal, Trophy } from "lucide-react";
import { db } from "@/lib/firebaseConfig";
import { StudentShell } from "@/components/StudentShell";

type User = { id: string; handle?: string; displayName?: string; xp?: number; completedLabs?: number; rank?: string };
export default function LeaderboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => onSnapshot(query(collection(db, "users"), orderBy("xp", "desc"), limit(10)), (snapshot) => setUsers(snapshot.docs.map((item) => {
    const d = item.data();
    return {
      id: item.id,
      handle: d.handle,
      displayName: d.displayName,
      xp: Number(d.xp || 0),
      completedLabs: Array.isArray(d.completedLabs) ? d.completedLabs.length : Number(d.completedLabs || 0),
      rank: d.rank || "Script Kiddie"
    };
  }))), []);
  const podium = [users[1], users[0], users[2]];
  return <StudentShell><div className="grid-bg min-h-screen p-5 md:p-10"><div className="mx-auto max-w-5xl"><div className="eyebrow text-cyan">Workspace / competition</div><h1 className="mt-2 text-3xl font-bold">Leaderboard</h1><p className="mt-2 text-sm text-muted">The operators pushing the perimeter forward.</p><div className="mt-10 grid items-end gap-3 md:grid-cols-3">{podium.map((user, index) => user ? <div key={user.id} className={`glass rounded-2xl p-5 text-center ${index === 1 ? "min-h-64 border-amber/40 shadow-[0_0_40px_rgba(244,189,112,.12)]" : "min-h-52"}`}><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-violet to-cyan text-sm font-black text-ink">{(user.handle || user.displayName || "OP").slice(0, 2).toUpperCase()}</div><div className="mt-4 flex justify-center">{index === 1 ? <Crown className="text-amber" size={20}/> : <Medal className={index === 0 ? "text-slate-300" : "text-orange-400"} size={19}/>}</div><div className="mt-2 font-semibold">{user.handle || user.displayName || "Operative"}</div><div className="mt-1 text-xs text-muted">{user.rank || "Script Kiddie"}</div><div className="mt-4 text-2xl font-bold text-cyan">{user.xp || 0}<span className="ml-1 text-xs font-normal text-muted">XP</span></div></div> : <div key={index} className="min-h-52 rounded-2xl border border-dashed border-line"/>)}</div><div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-panel"><div className="min-w-[520px]"><div className="grid grid-cols-[60px_1fr_120px_100px] gap-4 border-b border-line px-5 py-3 text-[10px] uppercase tracking-wider text-muted"><span>#</span><span>Operative</span><span>Labs</span><span>XP</span></div>{users.slice(3).map((user, index) => <div key={user.id} className="grid grid-cols-[60px_1fr_120px_100px] gap-4 border-b border-line px-5 py-4 text-sm last:border-0"><span className="text-muted">{index + 4}</span><span className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-cyan/10 text-[10px] font-bold text-cyan">{(user.handle || "OP").slice(0, 2).toUpperCase()}</span>{user.handle || user.displayName || "Operative"}</span><span className="text-muted">{user.completedLabs || 0}</span><span className="font-bold text-cyan">{user.xp || 0}</span></div>)}</div></div>{users.length === 0 && <div className="py-10 text-center text-sm text-muted"><Trophy className="mx-auto mb-3 text-muted" size={24}/>No operatives ranked yet.</div>}</div></div></StudentShell>;
}
