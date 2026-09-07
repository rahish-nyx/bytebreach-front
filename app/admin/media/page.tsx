"use client";

import { useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { FileUp, Link as LinkIcon, Save } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { storage } from "@/lib/firebaseConfig";
import { createRecord } from "@/lib/firestore";

export default function MediaPage() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Cheat Codes / Command Syntax");
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState("");
  const upload = async () => {
    if (!file) return;
    setBusy(true); setSaved("");
    try {
      const target = ref(storage, `resources/${Date.now()}-${file.name}`);
      await uploadBytes(target, file);
      setUrl(await getDownloadURL(target));
      setSaved("File uploaded. Publish the resource when ready.");
    } catch (error) {
      setSaved(error instanceof Error ? error.message : "Upload failed.");
    } finally { setBusy(false); }
  };
  const publish = async () => {
    await createRecord("resources", { title: title || file?.name || "ByteBreach resource", category, content, fileUrl: url, published: true, createdAt: new Date() });
    setSaved("Resource published."); setTitle(""); setContent(""); setFile(null); setUrl("");
  };
  return <AdminShell><div className="eyebrow text-cyan">Command center / assets</div><h1 className="mt-2 text-3xl font-bold">Media & resource library</h1><p className="mt-2 text-sm text-muted">Upload files and publish Blogger-style cheat sheets or activity guides.</p><div className="mt-8 max-w-3xl rounded-2xl border border-line bg-panel p-6"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Resource title" className="field w-full"/><select value={category} onChange={(e) => setCategory(e.target.value)} className="field mt-3 w-full">
  <option>Cheat Codes / Command Syntax</option>
  <option>Extra Code Snippets</option>
  <option>Lab Handouts & Extra Activity</option>
  <option>Lab Handouts & Extra Activity PCFs</option>
  <option>Lab Handouts & Extra Activity PDFs</option>
</select><textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Markdown / formatted guide content, headings, code blocks, callouts..." className="field mt-3 min-h-48 w-full font-mono"/><div className="mt-4 flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-line"><FileUp className="text-cyan" size={28}/><label className="mt-3 cursor-pointer text-sm text-muted">Choose attachment<input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden"/></label>{file && <div className="mt-2 text-xs text-cyan">{file.name}</div>}</div><div className="mt-4 grid gap-2 sm:grid-cols-2"><button onClick={() => void upload()} disabled={!file || busy} className="rounded-xl border border-line py-3 text-xs font-bold text-muted disabled:opacity-40">{busy ? "Uploading..." : "Upload file"}</button><button onClick={() => void publish()} disabled={!title.trim() || (!content.trim() && !url)} className="flex items-center justify-center gap-2 rounded-xl bg-cyan py-3 text-xs font-bold text-ink disabled:opacity-40"><Save size={15}/>Publish resource</button></div>{url && <div className="mt-4 flex gap-2 rounded-xl bg-[#0b1018] p-3 text-xs"><LinkIcon size={15} className="text-cyan"/><a href={url} target="_blank" rel="noreferrer" className="truncate text-cyan">{url}</a></div>}{saved && <div className="mt-3 text-xs text-cyan">{saved}</div>}</div></AdminShell>;
}
