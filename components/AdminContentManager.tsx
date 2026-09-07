"use client";

import { useMemo, useRef, useState } from "react";
import { Bold, Check, ChevronDown, ChevronUp, FileText, ImagePlus, Italic, Link as LinkIcon, List, Pencil, Plus, Save, Trash2, Underline } from "lucide-react";
import { deleteDoc, doc, increment, updateDoc } from "firebase/firestore";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { createRecord, removeRecord, updateRecord } from "@/lib/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebaseConfig";

type Question = { id: string; question: string; answer: string; points: number; type?: "direct" | "mcq"; options?: { A: string; B: string; C: string; D: string }; correctOption?: "A" | "B" | "C" | "D" };
type Module = { id: string; title?: string; trackId?: string; parentLabel?: string; description?: string; notes?: string; content?: string; duration?: string; order?: number; published?: boolean; questions?: Question[]; labChallenge?: { name?: string; briefing?: string; target?: string; flag?: string; points?: number } };
type Track = { id: string; title?: string; level?: string; description?: string; content?: string; totalModules?: number; completedModules?: number; icon?: string };

function RichEditor({ value, onChange, placeholder, uploadPath }: { value: string; onChange: (value: string) => void; placeholder: string; uploadPath: string }) {
  const editor = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const command = (name: string, argument?: string) => {
    editor.current?.focus();
    document.execCommand(name, false, argument);
    if (editor.current) onChange(editor.current.innerHTML);
  };
  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const target = ref(storage, `${uploadPath}/${Date.now()}-${file.name}`);
      await uploadBytes(target, file);
      const url = await getDownloadURL(target);
      command("insertHTML", `<img src="${url}" alt="${file.name.replace(/"/g, "")}" class="my-4 max-h-96 rounded-xl border border-line" />`);
    } finally {
      setUploading(false);
    }
  };
  return <div className="overflow-hidden rounded-2xl border border-line bg-[#0b1018]">
    <div className="flex flex-wrap items-center gap-1 border-b border-line p-2">
      <button type="button" onClick={() => command("bold")} aria-label="Bold" className="toolbar-button"><Bold size={15}/></button>
      <button type="button" onClick={() => command("italic")} aria-label="Italic" className="toolbar-button"><Italic size={15}/></button>
      <button type="button" onClick={() => command("underline")} aria-label="Underline" className="toolbar-button"><Underline size={15}/></button>
      <button type="button" onClick={() => command("formatBlock", "h2")} className="toolbar-button text-xs font-bold">H2</button>
      <button type="button" onClick={() => command("formatBlock", "h3")} className="toolbar-button text-xs font-bold">H3</button>
      <button type="button" onClick={() => command("insertUnorderedList")} aria-label="Bullet list" className="toolbar-button"><List size={15}/></button>
      <button type="button" onClick={() => { const url = window.prompt("Paste a link URL"); if (url) command("createLink", url); }} aria-label="Insert link" className="toolbar-button"><LinkIcon size={15}/></button>
      <label className="toolbar-button cursor-pointer" aria-label="Upload image"><ImagePlus size={15}/>{uploading ? "Uploading" : ""}<input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); event.currentTarget.value = ""; }}/></label>
      <span className="ml-auto text-[10px] text-muted">Rich content editor</span>
    </div>
    <div ref={editor} contentEditable suppressContentEditableWarning onInput={(event) => onChange(event.currentTarget.innerHTML)} dangerouslySetInnerHTML={{ __html: value }} data-placeholder={placeholder} className="editor-content min-h-52 p-4 text-sm leading-7 text-slate-200 outline-none" />
  </div>;
}

export function AdminContentManager() {
  const tracks = useFirestoreCollection<Track>(["tracks"]);
  const modules = useFirestoreCollection<Module>(["modules"]);
  const [selected, setSelected] = useState("");
  const [showTrack, setShowTrack] = useState(false);
  const [showModule, setShowModule] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null);
  const [toast, setToast] = useState("");
  const [trackForm, setTrackForm] = useState({ id: "", title: "", level: "Beginner", description: "", content: "", totalModules: "0" });
  const [moduleForm, setModuleForm] = useState({ id: "", title: "", trackId: "", parentLabel: "CCNA", duration: "30 min", content: "", published: true });
  const [question, setQuestion] = useState({ question: "", answer: "", points: "25", type: "direct" as "direct" | "mcq", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A" as "A" | "B" | "C" | "D" });
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [labChallenge, setLabChallenge] = useState({ name: "", briefing: "", target: "", flag: "", points: "25" });
  const activeModule = modules.data.find((item) => item.id === selected);
  const moduleTrack = useMemo(() => tracks.data.find((item) => item.id === moduleForm.trackId), [tracks.data, moduleForm.trackId]);

  const editTrack = (item: Track) => {
    setTrackForm({ id: item.id, title: item.title || "", level: item.level || "Beginner", description: item.description || "", content: item.content || "", totalModules: String(item.totalModules || 0) });
    setShowTrack(true);
  };
  const editModule = (item: Module) => {
    setSelected(item.id);
    setModuleForm({ id: item.id, title: item.title || "", trackId: item.trackId || "", parentLabel: String(item.parentLabel || "CCNA"), duration: item.duration || "30 min", content: item.content || item.notes || "", published: item.published !== false });
    setLabChallenge({ name: item.labChallenge?.name || "", briefing: item.labChallenge?.briefing || "", target: item.labChallenge?.target || "", flag: item.labChallenge?.flag || "", points: String(item.labChallenge?.points || 25) });
    setShowModule(true);
  };
  const confirmDeleteModule = async () => {
    if (!moduleToDelete) return;
    try {
      const moduleId = moduleToDelete.id;
      const trackId = moduleToDelete.trackId;
      await deleteDoc(doc(db, "modules", moduleId));
      if (trackId) {
        await updateDoc(doc(db, "tracks", trackId), {
          totalModules: increment(-1),
        });
      }
      if (selected === moduleId) {
        setSelected("");
      }
      setModuleToDelete(null);
      setToast("Module deleted successfully.");
      window.setTimeout(() => setToast(""), 4000);
    } catch (error) {
      console.error("Error deleting module:", error);
    }
  };
  const saveTrack = async () => {
    if (!trackForm.id.trim() || !trackForm.title.trim()) return;
    const payload = { title: trackForm.title.trim(), level: trackForm.level, description: trackForm.description.trim(), content: trackForm.content, totalModules: Number(trackForm.totalModules) };
    if (tracks.data.some((item) => item.id === trackForm.id)) await updateRecord("tracks", trackForm.id, payload);
    else await createRecord("tracks", { ...payload, completedModules: 0, icon: "network" });
    setShowTrack(false);
  };
  const saveModule = async () => {
    if (!moduleForm.id.trim() || !moduleForm.title.trim()) return;
    const payload = { title: moduleForm.title.trim(), trackId: moduleForm.trackId || moduleForm.parentLabel.toLowerCase(), parentLabel: moduleForm.parentLabel, duration: moduleForm.duration, content: moduleForm.content, notes: moduleForm.content, published: moduleForm.published, labChallenge: labChallenge.name.trim() ? { ...labChallenge, points: Number(labChallenge.points) || 25 } : null };
    if (modules.data.some((item) => item.id === moduleForm.id)) await updateRecord("modules", moduleForm.id, payload);
    else await createRecord("modules", { ...payload, order: modules.data.length + 1, questions: [] });
    setShowModule(false);
  };
  const addQuestion = async () => {
    const options = { A: question.optionA, B: question.optionB, C: question.optionC, D: question.optionD };
    const answer = question.type === "mcq" ? options[question.correctOption] : question.answer;
    if (!activeModule || !question.question.trim() || !answer.trim()) return;
    const item: Question = { id: editingQuestionId || `q-${Date.now()}`, question: question.question.trim(), answer: answer.trim(), points: Number(question.points) || 25, type: question.type, options: question.type === "mcq" ? options : undefined, correctOption: question.type === "mcq" ? question.correctOption : undefined };
    const questions = editingQuestionId ? (activeModule.questions || []).map((entry) => entry.id === editingQuestionId ? item : entry) : [...(activeModule.questions || []), item];
    await updateRecord("modules", activeModule.id, { questions });
    setEditingQuestionId(null); setQuestion({ question: "", answer: "", points: "25", type: "direct", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A" });
  };
  const deleteQuestion = async (id: string) => {
    if (activeModule) await updateRecord("modules", activeModule.id, { questions: (activeModule.questions || []).filter((item) => item.id !== id) });
  };
  const editQuestion = (item: Question) => {
    setEditingQuestionId(item.id);
    setQuestion({ question: item.question || "", answer: item.answer || "", points: String(item.points || 25), type: item.type || "direct", optionA: item.options?.A || "", optionB: item.options?.B || "", optionC: item.options?.C || "", optionD: item.options?.D || "", correctOption: item.correctOption || "A" });
  };

  return <>{toast && <div className="fixed right-5 top-5 z-50 rounded-xl border border-cyan/40 bg-panel px-4 py-3 text-xs text-cyan shadow-2xl">{toast}</div>}{moduleToDelete && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-panel p-6 shadow-2xl"><h2 className="text-lg font-bold text-red-300">Delete Module</h2><p className="mt-3 text-sm leading-6 text-muted">Are you sure you want to permanently delete &apos;{moduleToDelete.title || moduleToDelete.id}&apos;? This action will remove all curriculum text and MCQ questions.</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setModuleToDelete(null)} className="rounded-xl border border-line px-4 py-2.5 text-xs text-muted hover:bg-white/[.04]">Cancel</button><button type="button" onClick={() => void confirmDeleteModule()} className="rounded-xl bg-red-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-600">Confirm Delete</button></div></div></div>}<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="eyebrow text-cyan">Content management</div><h1 className="mt-2 text-3xl font-bold">Tracks & modules</h1><p className="mt-2 text-sm text-muted">Write lessons like blog posts, upload images, and publish structured learning content.</p></div><div className="flex gap-2"><button onClick={() => { setTrackForm({ id: "", title: "", level: "Beginner", description: "", content: "", totalModules: "0" }); setShowTrack(true); }} className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-xs font-bold text-white"><Plus size={15}/> Track</button><button onClick={() => { setModuleForm({ id: `module-${Date.now()}`, title: "", trackId: tracks.data[0]?.id || "", parentLabel: "CCNA", duration: "30 min", content: "", published: false }); setShowModule(true); }} className="flex items-center gap-2 rounded-xl bg-cyan px-4 py-2.5 text-xs font-bold text-ink"><Plus size={15}/> Module</button></div></div>
    {showTrack && <div className="mt-6 rounded-2xl border border-cyan/30 bg-cyan/[.04] p-5"><h2 className="font-semibold">Blog-style track editor</h2><div className="mt-4 grid gap-3 md:grid-cols-2"><input value={trackForm.id} onChange={(e) => setTrackForm({ ...trackForm, id: e.target.value })} placeholder="Track ID (e.g. ccna)" className="field"/><input value={trackForm.title} onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })} placeholder="Title" className="field"/><select value={trackForm.level} onChange={(e) => setTrackForm({ ...trackForm, level: e.target.value })} className="field"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select><input value={trackForm.totalModules} onChange={(e) => setTrackForm({ ...trackForm, totalModules: e.target.value })} placeholder="Total modules" type="number" className="field"/><textarea value={trackForm.description} onChange={(e) => setTrackForm({ ...trackForm, description: e.target.value })} placeholder="Short excerpt" className="field md:col-span-2"/><div className="md:col-span-2"><RichEditor value={trackForm.content} onChange={(content) => setTrackForm({ ...trackForm, content })} placeholder="Start writing the track introduction..." uploadPath="tracks"/></div></div><div className="mt-4 flex gap-2"><button onClick={() => void saveTrack()} className="rounded-xl bg-cyan px-4 py-2 text-xs font-bold text-ink"><Save size={14} className="mr-1 inline"/> Save track</button><button onClick={() => setShowTrack(false)} className="text-xs text-muted">Cancel</button></div></div>}
    {showModule && <div className="mt-6 rounded-2xl border border-violet/30 bg-violet/[.04] p-5"><h2 className="font-semibold">{modules.data.some((item) => item.id === moduleForm.id) ? "Edit module" : "Create module"}</h2><div className="mt-4 grid gap-3 md:grid-cols-2"><input value={moduleForm.id} onChange={(e) => setModuleForm({ ...moduleForm, id: e.target.value })} placeholder="Module ID" className="field"/><input value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} placeholder="Module title" className="field"/><select value={moduleForm.trackId} onChange={(e) => { const track = tracks.data.find((item) => item.id === e.target.value); setModuleForm({ ...moduleForm, trackId: e.target.value, parentLabel: track?.title || moduleForm.parentLabel }); }} className="field"><option value="">Select track</option>{tracks.data.map((track) => <option key={track.id} value={track.id}>{track.title || track.id}</option>)}</select><input value={moduleForm.duration} onChange={(e) => setModuleForm({ ...moduleForm, duration: e.target.value })} placeholder="Duration" className="field"/><div className="md:col-span-2"><RichEditor value={moduleForm.content} onChange={(content) => setModuleForm({ ...moduleForm, content })} placeholder="Write the lesson, commands, tips, and lab instructions..." uploadPath={`modules/${moduleForm.id}`}/></div>    <label className="flex items-center gap-2 text-xs text-muted"><input type="checkbox" checked={moduleForm.published} onChange={(e) => setModuleForm({ ...moduleForm, published: e.target.checked })}/> Published</label><div className="md:col-span-2 rounded-xl border border-cyan/20 p-3"><div className="text-xs font-semibold text-cyan">Optional in-room lab challenge</div><div className="mt-2 grid gap-2 md:grid-cols-2"><input value={labChallenge.name} onChange={(e) => setLabChallenge({ ...labChallenge, name: e.target.value })} placeholder="Lab name" className="field"/><input value={labChallenge.target} onChange={(e) => setLabChallenge({ ...labChallenge, target: e.target.value })} placeholder="Target URL / connection details" className="field"/><textarea value={labChallenge.briefing} onChange={(e) => setLabChallenge({ ...labChallenge, briefing: e.target.value })} placeholder="Briefing / hints" className="field md:col-span-2"/><input value={labChallenge.flag} onChange={(e) => setLabChallenge({ ...labChallenge, flag: e.target.value })} placeholder="Preset flag" className="field"/><input value={labChallenge.points} onChange={(e) => setLabChallenge({ ...labChallenge, points: e.target.value })} type="number" placeholder="XP reward" className="field"/></div></div></div><div className="mt-4 flex gap-2"><button onClick={() => void saveModule()} className="rounded-xl bg-cyan px-4 py-2 text-xs font-bold text-ink"><Save size={14} className="mr-1 inline"/> Save module</button><button onClick={() => setShowModule(false)} className="text-xs text-muted">Cancel</button></div></div>}
    <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.2fr]"><section className="space-y-3"><h2 className="text-sm font-semibold">Tracks</h2>{tracks.data.map((track) => <div key={track.id} className="glass flex items-center gap-3 rounded-2xl p-4"><FileText className="text-cyan" size={18}/><div className="min-w-0 flex-1"><div className="font-semibold">{track.title || track.id}</div><div className="text-xs text-muted">{track.level || "Beginner"} · {track.totalModules || 0} modules</div></div><button onClick={() => editTrack(track)} aria-label="Edit track" className="text-muted hover:text-cyan"><Pencil size={15}/></button><button onClick={() => void removeRecord("tracks", track.id)} aria-label="Delete track" className="text-muted hover:text-red-300"><Trash2 size={15}/></button></div>)}<h2 className="pt-5 text-sm font-semibold">Modules</h2>{modules.data.map((item) => <div key={item.id} onClick={() => editModule(item)} className={`glass flex w-full cursor-pointer items-center gap-3 rounded-2xl p-4 text-left transition hover:border-cyan/40 ${selected === item.id ? "border-cyan/50" : ""}`}><FileText className="text-cyan shrink-0" size={18}/><div className="min-w-0 flex-1"><div className="font-semibold truncate">{item.title || item.id}</div><div className="text-xs text-muted truncate">{item.parentLabel || item.trackId} · {item.questions?.length || 0} questions · {item.published === false ? "Draft" : "Published"}</div></div><div className="flex items-center gap-2 shrink-0"><button type="button" onClick={(e) => { e.stopPropagation(); editModule(item); }} aria-label="Edit module" className="text-muted hover:text-cyan p-1"><Pencil size={15}/></button><button type="button" onClick={(e) => { e.stopPropagation(); setModuleToDelete(item); }} aria-label="Delete module" className="text-red-400 hover:text-red-300 p-1"><Trash2 size={15}/></button></div></div>)}</section><section className="rounded-2xl border border-line bg-panel p-5">{activeModule ? <><div className="flex items-start justify-between"><div><div className="eyebrow text-cyan">{moduleTrack?.title || activeModule.parentLabel || "Module"}</div><h2 className="mt-1 text-xl font-bold">{activeModule.title}</h2></div><button onClick={() => editModule(activeModule)} className="text-muted hover:text-cyan"><Pencil size={16}/></button></div><div className="mt-5 border-t border-line pt-5"><div className="text-xs font-semibold">Questions & answer keys</div>{activeModule.questions?.map((item) => <div key={item.id} className="mt-2 flex items-center gap-2 rounded-xl bg-[#0b1018] p-3 text-xs">    <span className="min-w-0 flex-1">{item.question}</span><span className="text-cyan">{item.type === "mcq" ? "MCQ · " : ""}{item.points} XP</span><button onClick={() => editQuestion(item)} className="text-muted hover:text-cyan" aria-label="Edit question"><Pencil size={14}/></button><button onClick={() => void deleteQuestion(item.id)} className="text-muted hover:text-red-300" aria-label="Delete question"><Trash2 size={14}/></button></div>)}<div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_84px]"><input value={question.question} onChange={(e) => setQuestion({ ...question, question: e.target.value })} placeholder="Question prompt" className="field"/><input value={question.answer} onChange={(e) => setQuestion({ ...question, answer: e.target.value })} placeholder="Correct answer" className="field"/>    <input value={question.points} onChange={(e) => setQuestion({ ...question, points: e.target.value })} type="number" className="field"/></div><div className="mt-2 flex gap-3 text-xs text-muted"><label><input type="radio" checked={question.type === "direct"} onChange={() => setQuestion({ ...question, type: "direct" })}/> Direct</label><label><input type="radio" checked={question.type === "mcq"} onChange={() => setQuestion({ ...question, type: "mcq" })}/> MCQ</label></div>{question.type === "mcq" && <div className="mt-2 grid gap-2 sm:grid-cols-2"><input value={question.optionA} onChange={(e) => setQuestion({ ...question, optionA: e.target.value })} placeholder="Option A" className="field"/><input value={question.optionB} onChange={(e) => setQuestion({ ...question, optionB: e.target.value })} placeholder="Option B" className="field"/><input value={question.optionC} onChange={(e) => setQuestion({ ...question, optionC: e.target.value })} placeholder="Option C" className="field"/><input value={question.optionD} onChange={(e) => setQuestion({ ...question, optionD: e.target.value })} placeholder="Option D" className="field"/><select value={question.correctOption} onChange={(e) => setQuestion({ ...question, correctOption: e.target.value as "A" | "B" | "C" | "D" })} className="field"><option value="A">Correct: A</option><option value="B">Correct: B</option><option value="C">Correct: C</option><option value="D">Correct: D</option></select></div>}<button onClick={() => void addQuestion()} className="mt-3 w-full rounded-xl border border-cyan/40 py-2.5 text-xs font-bold text-cyan"><Plus size={14} className="mr-1 inline"/> Add question</button></div></> : <div className="grid min-h-64 place-items-center text-center text-sm text-muted"><div><FileText className="mx-auto mb-3 text-cyan" size={24}/>Select a module to edit content and questions.</div></div>}</section></div></>;
}
