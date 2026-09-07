"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { Crosshair, FileText, Pencil, Save, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { db } from "@/lib/firebaseConfig";

type Lab = {
  id: string; title?: string; subtitle?: string; category?: string; difficulty?: string;
  targetIp?: string; targetPort?: string; link?: string; environmentLink?: string; environmentUrl?: string;
  points?: number; xp?: number; scenario?: string; details?: string; prerequisites?: string; tools?: string;
  steps?: string; instructions?: string; hints?: string; guide?: string; presetFlag?: string; flag?: string; published?: boolean;
};
type Submission = { id: string; userHandle?: string; userEmail?: string; labTitle?: string; category?: string; submittedFlag?: string; isCorrect?: boolean; xpAwarded?: number; timestamp?: { toDate?: () => Date } };
type Form = { title: string; subtitle: string; category: string; difficulty: string; targetIp: string; targetPort: string; link: string; points: string; scenario: string; prerequisites: string; steps: string; hints: string; guide: string; presetFlag: string };
const emptyForm: Form = { title: "", subtitle: "", category: "Reconnaissance", difficulty: "Easy", targetIp: "", targetPort: "", link: "", points: "50", scenario: "", prerequisites: "", steps: "", hints: "", guide: "", presetFlag: "" };

function formatTime(value: Submission["timestamp"]) {
  return value && typeof value.toDate === "function" ? value.toDate().toLocaleString() : "Pending timestamp";
}

export default function PracticeLabsAdmin() {
  const [tab, setTab] = useState<"editor" | "feed">("editor");
  const [form, setForm] = useState<Form>({ ...emptyForm });
  const [editingLabId, setEditingLabId] = useState<string | null>(null);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [saved, setSaved] = useState("");

  useEffect(() => onSnapshot(collection(db, "labs"), (snapshot) => setLabs(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Lab)))), []);
  useEffect(() => onSnapshot(query(collection(db, "labSubmissions")), (snapshot) => setSubmissions(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Submission)))), []);

  const update = (key: keyof Form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const handleEditLab = (lab: Lab) => {
    setEditingLabId(lab.id);
    setForm({
      title: lab.title || "", subtitle: lab.subtitle || "", category: lab.category || "Reconnaissance",
      difficulty: lab.difficulty || "Easy", targetIp: lab.targetIp || "", targetPort: lab.targetPort || "",
      link: lab.environmentLink || lab.link || lab.environmentUrl || "", points: String(lab.points ?? lab.xp ?? 50),
      scenario: lab.scenario || lab.details || "", prerequisites: lab.prerequisites || lab.tools || "",
      steps: lab.steps || lab.instructions || "", hints: lab.hints || "", guide: lab.guide || "",
      presetFlag: lab.presetFlag || lab.flag || ""
    });
    setSaved("");
    setTab("editor");
  };
  const resetNewLab = () => { setEditingLabId(null); setForm({ ...emptyForm }); setSaved(""); };
  const save = async (published: boolean) => {
    const payload = { ...form, points: Number(form.points) || 0, link: form.link, environmentLink: form.link, environmentUrl: form.link, prerequisites: form.prerequisites, tools: form.prerequisites, steps: form.steps, instructions: form.steps, presetFlag: form.presetFlag, flag: form.presetFlag, published, active: published, updatedAt: serverTimestamp() };
    if (editingLabId) await updateDoc(doc(db, "labs", editingLabId), payload);
    else { const created = await addDoc(collection(db, "labs"), { ...payload, createdAt: serverTimestamp() }); setEditingLabId(created.id); }
    setSaved(published ? (editingLabId ? "Lab updated." : "Lab published.") : "Draft saved.");
  };
  const remove = async (id: string) => { await deleteDoc(doc(db, "labs", id)); if (editingLabId === id) resetNewLab(); };

  return <AdminShell>
    <div className="eyebrow text-cyan">Command center / practice labs</div>
    <h1 className="mt-2 text-3xl font-bold">Practice Labs</h1>
    <p className="mt-2 text-sm text-muted">Author hands-on labs and audit every flag attempt.</p>
    <div className="mt-6 flex gap-2">
      <button onClick={() => setTab("editor")} className={`rounded-xl px-4 py-2 text-xs font-bold ${tab === "editor" ? "bg-cyan text-ink" : "bg-panel text-muted"}`}><Crosshair className="mr-2 inline" size={14}/>Lab authoring CMS</button>
      <button onClick={() => setTab("feed")} className={`rounded-xl px-4 py-2 text-xs font-bold ${tab === "feed" ? "bg-cyan text-ink" : "bg-panel text-muted"}`}><FileText className="mr-2 inline" size={14}/>Submissions feed ({submissions.length})</button>
    </div>
    {tab === "editor" ? <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_300px]">
      <section className="rounded-2xl border border-line bg-panel p-5 sm:p-7">
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Lab title" className="field"/>
          <input value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)} placeholder="Subtitle" className="field"/>
          <input value={form.category} onChange={(e) => update("category", e.target.value)} placeholder="Category" className="field"/>
          <select value={form.difficulty} onChange={(e) => update("difficulty", e.target.value)} className="field"><option>Easy</option><option>Medium</option><option>Hard</option><option>Insane</option></select>
          <input value={form.targetIp} onChange={(e) => update("targetIp", e.target.value)} placeholder="Target IP (optional)" className="field"/>
          <input value={form.targetPort} onChange={(e) => update("targetPort", e.target.value)} placeholder="Target port (optional)" className="field"/>
          <input value={form.link} onChange={(e) => update("link", e.target.value)} placeholder="Environment link" className="field"/>
          <input value={form.points} onChange={(e) => update("points", e.target.value)} type="number" placeholder="XP bounty" className="field"/>
        </div>
        <textarea value={form.scenario} onChange={(e) => update("scenario", e.target.value)} placeholder="Scenario details" className="field mt-3 min-h-28 w-full"/>
        <textarea value={form.prerequisites} onChange={(e) => update("prerequisites", e.target.value)} placeholder="Prerequisites" className="field mt-3 min-h-20 w-full"/>
        <textarea value={form.steps} onChange={(e) => update("steps", e.target.value)} placeholder="Step-by-step walkthrough" className="field mt-3 min-h-32 w-full"/>
        <textarea value={form.hints} onChange={(e) => update("hints", e.target.value)} placeholder="Hints" className="field mt-3 min-h-20 w-full"/>
        <textarea value={form.guide} onChange={(e) => update("guide", e.target.value)} placeholder="Guide / formatted content" className="field mt-3 min-h-32 w-full"/>
        <input value={form.presetFlag} onChange={(e) => update("presetFlag", e.target.value)} placeholder="Target flag" className="field mt-3 w-full font-mono"/>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => void save(true)} className="flex min-h-11 items-center gap-2 rounded-xl bg-cyan px-4 py-2 text-xs font-bold text-ink"><Save size={15}/>{editingLabId ? "Update Lab" : "Publish Lab"}</button>
          <button onClick={() => void save(false)} className="flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 py-2 text-xs font-bold text-muted"><Save size={15}/>{editingLabId ? "Update Draft" : "Save as Draft"}</button>
          {saved && <span className="self-center text-xs text-cyan">{saved}</span>}
        </div>
      </section>
      <aside className="rounded-2xl border border-line bg-panel p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-muted">Existing labs</div>
        <button onClick={resetNewLab} className="mt-3 w-full rounded-xl border border-dashed border-line px-3 py-2 text-left text-xs text-cyan">+ New lab</button>
        <div className="mt-3 space-y-2">{labs.map((lab) => <div key={lab.id} role="button" tabIndex={0} onClick={() => handleEditLab(lab)} onKeyDown={(event) => { if (event.key === "Enter") handleEditLab(lab); }} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 ${editingLabId === lab.id ? "border-cyan/50 bg-cyan/5" : "border-line"}`}>
          <div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold">{lab.title || lab.id}</div><div className="mt-1 text-[10px] text-muted">{lab.published ? "Published" : "Draft"} · {lab.difficulty}</div></div>
          <button type="button" onClick={(event) => { event.stopPropagation(); handleEditLab(lab); }} aria-label={`Edit ${lab.title || lab.id}`} className="rounded-lg p-1 text-cyan hover:bg-cyan/10"><Pencil size={14}/></button>
          <button type="button" onClick={(event) => { event.stopPropagation(); void remove(lab.id); }} aria-label={`Delete ${lab.title || lab.id}`} className="rounded-lg p-1 text-red-300 hover:bg-red-400/10"><Trash2 size={14}/></button>
        </div>)}</div>
      </aside>
    </div> : <section className="mt-6 overflow-x-auto rounded-2xl border border-line bg-panel"><table className="w-full min-w-[900px] text-left text-xs"><thead className="border-b border-line text-muted"><tr><th className="p-4">Student</th><th className="p-4">Lab</th><th className="p-4">Submitted flag</th><th className="p-4">Status</th><th className="p-4">XP</th><th className="p-4">Timestamp</th><th className="p-4">Actions</th></tr></thead><tbody>{submissions.map((submission) => <tr key={submission.id} className="border-b border-line/60"><td className="p-4"><div className="font-semibold">{submission.userHandle || "Operative"}</div><div className="text-muted">{submission.userEmail}</div></td><td className="p-4">{submission.labTitle || submission.id}<div className="text-muted">{submission.category}</div></td><td className="p-4 font-mono">{submission.submittedFlag || "—"}</td><td className={`p-4 font-semibold ${submission.isCorrect ? "text-cyan" : "text-red-300"}`}>{submission.isCorrect ? "Correct ✔️" : "Incorrect ❌"}</td><td className="p-4">{submission.xpAwarded || 0}</td><td className="p-4 text-muted">{formatTime(submission.timestamp)}</td><td className="p-4"><button onClick={() => void deleteDoc(doc(db, "labSubmissions", submission.id))} className="rounded-lg px-2 py-1 text-red-300 hover:bg-red-400/10">✕</button></td></tr>)}</tbody></table></section>}
  </AdminShell>;
}
