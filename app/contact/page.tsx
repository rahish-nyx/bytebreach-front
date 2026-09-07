"use client";

import { FormEvent, useEffect, useState } from "react";
import { addDoc, collection, doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { PublicPage } from "@/components/PublicPage";
import { db } from "@/lib/firebaseConfig";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [channels, setChannels] = useState({ telegramUrl: "https://t.me/ByteBreachBot", whatsappUrl: "https://wa.me/", supportEmail: "support@bytebreach.com" });
  useEffect(() => onSnapshot(doc(db, "system", "contacts"), (snapshot) => { if (snapshot.exists()) setChannels((current) => ({ ...current, ...snapshot.data() })); }), []);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSending(true); setStatus("");
    try {
      await addDoc(collection(db, "inquiries"), { ...form, createdAt: serverTimestamp(), status: "unread" });
      const response = await fetch("/api/telegram/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inquiry: true, studentName: form.name, studentEmail: form.email, subject: form.subject, answer: form.message }) });
      if (!response.ok) throw new Error("Inquiry saved, but Telegram notification failed.");
      setForm({ name: "", email: "", subject: "", message: "" });
      setStatus("Inquiry Transmitted. Uplink established with ByteBreach Command.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not transmit inquiry."); }
    finally { setSending(false); }
  };
  return <PublicPage eyebrow="Support uplink" title="Direct Command Uplink"><div className="grid gap-4 sm:grid-cols-3"><a href={channels.telegramUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-line p-4 hover:border-cyan/50"><b className="text-cyan">Telegram</b><div className="mt-1 break-all text-xs text-muted">{channels.telegramUrl}</div></a><a href={channels.whatsappUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-line p-4 hover:border-cyan/50"><b className="text-cyan">WhatsApp</b><div className="mt-1 break-all text-xs text-muted">{channels.whatsappUrl}</div></a><a href={`mailto:${channels.supportEmail}`} className="rounded-xl border border-line p-4 hover:border-cyan/50"><b className="text-cyan">Email</b><div className="mt-1 text-xs text-muted">{channels.supportEmail}</div></a></div><form onSubmit={submit} className="grid gap-3 sm:grid-cols-2"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="field"/><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Operative Email" className="field"/><input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" className="field sm:col-span-2"/><textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Message" className="field min-h-32 sm:col-span-2"/><button disabled={sending} className="rounded-xl bg-cyan px-5 py-3 text-xs font-bold text-ink disabled:opacity-50 sm:col-span-2">{sending ? "Transmitting..." : "Transmit inquiry"}</button></form>{status && <p className="text-xs text-cyan">{status}</p>}</PublicPage>;
}
