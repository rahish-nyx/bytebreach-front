"use client";

import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { AdminShell } from "@/components/AdminShell";
import { db } from "@/lib/firebaseConfig";

type ContactSettings = { telegramUrl: string; whatsappUrl: string; supportEmail: string };
type Inquiry = { id: string; name?: string; email?: string; subject?: string; message?: string; status?: string; createdAt?: { toDate?: () => Date } };
const defaults: ContactSettings = { telegramUrl: "https://t.me/ByteBreachBot", whatsappUrl: "https://wa.me/", supportEmail: "ikkaghostt@gmail.com" };

export default function ContactsPage() {
  const [settings, setSettings] = useState(defaults);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [status, setStatus] = useState("");
  useEffect(() => {
    const unsubscribeSettings = onSnapshot(doc(db, "system", "contacts"), (snapshot) => { if (snapshot.exists()) setSettings({ ...defaults, ...(snapshot.data() as Partial<ContactSettings>) }); });
    const unsubscribeInquiries = onSnapshot(collection(db, "inquiries"), (snapshot) => setInquiries(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Inquiry)).sort((a, b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0))));
    return () => { unsubscribeSettings(); unsubscribeInquiries(); };
  }, []);
  const save = async () => { await setDoc(doc(db, "system", "contacts"), settings, { merge: true }); setStatus("Support channels saved."); };
  return <AdminShell><div className="eyebrow text-cyan">Command center / support</div><h1 className="mt-2 text-3xl font-bold">Contacts & Support</h1><p className="mt-2 text-sm text-muted">Manage public uplinks and process transmitted inquiries.</p><section className="mt-8 max-w-2xl rounded-2xl border border-line bg-panel p-5"><h2 className="font-semibold">Support channels config</h2><div className="mt-4 space-y-3"><input value={settings.telegramUrl} onChange={(e) => setSettings({ ...settings, telegramUrl: e.target.value })} placeholder="Telegram support URL" className="field w-full"/><input value={settings.whatsappUrl} onChange={(e) => setSettings({ ...settings, whatsappUrl: e.target.value })} placeholder="WhatsApp direct link" className="field w-full"/><input value={settings.supportEmail} onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })} placeholder="Official support email" className="field w-full"/><button onClick={() => void save()} className="rounded-xl bg-cyan px-4 py-2.5 text-xs font-bold text-ink">Save support channels</button>{status && <span className="ml-3 text-xs text-cyan">{status}</span>}</div></section><section className="mt-8"><h2 className="font-semibold">Transmitted inquiries</h2><div className="mt-4 space-y-3">{inquiries.map((inquiry) => <article key={inquiry.id} className="rounded-2xl border border-line bg-panel p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-semibold">{inquiry.subject || "No subject"}</div><div className="mt-1 text-xs text-cyan">{inquiry.name} · {inquiry.email}</div></div><div className="text-xs text-muted">{inquiry.createdAt?.toDate?.()?.toLocaleString() || "Pending timestamp"}</div></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">{inquiry.message}</p><div className="mt-4 flex gap-2"><button onClick={() => void updateDoc(doc(db, "inquiries", inquiry.id), { status: "resolved", resolvedAt: serverTimestamp() })} className="rounded-lg border border-cyan/40 px-3 py-2 text-xs text-cyan">{inquiry.status === "resolved" ? "Resolved ✔" : "Mark Resolved"}</button><button onClick={() => void deleteDoc(doc(db, "inquiries", inquiry.id))} className="rounded-lg border border-red-500/40 px-3 py-2 text-xs text-red-300">Delete</button></div></article>)}{inquiries.length === 0 && <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">No inquiries transmitted.</div>}</div></section></AdminShell>;
}
