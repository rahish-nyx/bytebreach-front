import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

type NotificationPayload = {
  studentName?: string;
  studentEmail?: string;
  parentTopic?: string;
  challengeTitle?: string;
  answer?: string;
  subject?: string;
  inquiry?: boolean;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character] || character);
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  const raw = contentType.includes("multipart/form-data") ? null : await request.clone().json() as NotificationPayload & { test?: boolean; telegramBotToken?: string; telegramChatId?: string };
  let token = raw?.telegramBotToken || "";
  let chatId = raw?.telegramChatId || "";
  if (!token || !chatId) {
    try {
      const source = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH ? readFileSync(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH, "utf8") : process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
      if (source) {
        const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(JSON.parse(source)) });
        const settings = (await getFirestore(app).doc("system/settings").get()).data() || {};
        token = String(settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || "");
        chatId = String(settings.telegramChatId || process.env.TELEGRAM_CHAT_ID || "");
      }
    } catch {
      token = process.env.TELEGRAM_BOT_TOKEN || token;
      chatId = process.env.TELEGRAM_CHAT_ID || chatId;
    }
  }
  if (!token || !chatId) {
    return NextResponse.json({ error: "Telegram integration is not configured on the server." }, { status: 503 });
  }

  let payload: NotificationPayload;
  let attachment: File | null = null;
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    payload = {
      studentName: String(form.get("studentName") || ""),
      studentEmail: String(form.get("studentEmail") || ""),
      parentTopic: String(form.get("parentTopic") || ""),
      challengeTitle: String(form.get("challengeTitle") || ""),
      answer: String(form.get("answer") || "")
    };
    const value = form.get("attachment");
    if (value instanceof File && value.size > 0) attachment = value;
  } else {
    payload = raw || {};
    if (raw?.test) {
      const response = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text: "ByteBreach Telegram bridge test connection ✅" }), cache: "no-store" });
      return response.ok ? NextResponse.json({ delivered: true }) : NextResponse.json({ error: "Telegram test failed." }, { status: 502 });
    }
  }
  const message = [
    payload.inquiry ? "📡 <b>ByteBreach Support Inquiry</b>" : "🚨 <b>ByteBreach Daily Challenge Submission</b>",
    "",
    `<b>Student:</b> ${escapeHtml(payload.studentName || "Unknown")}`,
    payload.studentEmail ? `<b>Email:</b> ${escapeHtml(payload.studentEmail)}` : "",
    payload.inquiry ? `<b>Subject:</b> ${escapeHtml(payload.subject || "Support inquiry")}` : `<b>Parent topic:</b> ${escapeHtml(payload.parentTopic || "Not specified")}`,
    payload.inquiry ? `<b>Message:</b> ${escapeHtml(payload.answer || "")}` : `<b>Challenge:</b> ${escapeHtml(payload.challengeTitle || "Daily challenge")}`,
    payload.inquiry ? "" : `<b>Answer:</b> ${escapeHtml(payload.answer || "File submission only")}`
  ].filter(Boolean).join("\n");

  const telegramUrl = `https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`;
  const response = await fetch(telegramUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
    cache: "no-store"
  });
  if (!response.ok) {
    const details = await response.json().catch(() => null) as { description?: string } | null;
    return NextResponse.json({ error: details?.description || "Telegram message delivery failed." }, { status: 502 });
  }

  let attachmentId = "";
  if (attachment) {
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("caption", `Submission attachment: ${attachment.name || "student file"}`);
    form.append("document", attachment, attachment.name || "submission-file");
    const documentResponse = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendDocument`, {
      method: "POST",
      body: form,
      cache: "no-store"
    });
    if (!documentResponse.ok) {
      const details = await documentResponse.json().catch(() => null) as { description?: string } | null;
      return NextResponse.json({ error: details?.description || "Telegram message sent, but attachment delivery failed." }, { status: 502 });
    }
    const documentResult = await documentResponse.json() as { result?: { document?: { file_id?: string } } };
    attachmentId = documentResult.result?.document?.file_id || "";
  }

  return NextResponse.json({ delivered: true, attachmentId });
}
