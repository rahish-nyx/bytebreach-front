"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Check,
  Code2,
  Copy,
  Download,
  Eye,
  FileDown,
  FileText,
  Library,
  Sparkles,
  X,
} from "lucide-react";
import { db } from "@/lib/firebaseConfig";
import { renderMarkdown } from "@/lib/markdown";
import { StudentShell } from "@/components/StudentShell";

type Resource = {
  id: string;
  title?: string;
  category?: string;
  content?: string;
  description?: string;
  attachmentUrl?: string;
  fileUrl?: string;
  downloadUrl?: string;
  published?: boolean;
};

const categories = [
  "Cheat Codes / Command Syntax",
  "Extra Code Snippets",
  "Lab Handouts & Extra Activity",
];

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [category, setCategory] = useState(categories[0]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"formatted" | "raw">("formatted");

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, "resources"), where("published", "==", true)),
        (snapshot) =>
          setResources(
            snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Resource))
          )
      ),
    []
  );

  // Close modal on Escape key press and manage body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedResource(null);
      }
    };
    if (selectedResource) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [selectedResource]);

  const visible = resources.filter((item) => {
    if (category === "Lab Handouts & Extra Activity") {
      return (
        item.category === "Lab Handouts & Extra Activity" ||
        item.category?.startsWith("Lab Handouts")
      );
    }
    return item.category === category;
  });

  const handleCopy = async (content?: string) => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy content:", err);
    }
  };

  const getReachableRemoteUrl = (resource: Resource): string | null => {
    const url = resource.fileUrl || resource.downloadUrl || resource.attachmentUrl;
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      return url;
    }
    return null;
  };

  const handleClientDownload = (resource: Resource, format: "md" | "txt" = "md") => {
    const content = resource.content || resource.description || resource.title || "";
    const mimeType =
      format === "md" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8";
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeTitle = (resource.title || "resource")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .toLowerCase();

    a.href = url;
    a.download = `${safeTitle || "resource"}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResourceDownload = (resource: Resource) => {
    const remoteUrl = getReachableRemoteUrl(resource);
    if (remoteUrl) {
      window.open(remoteUrl, "_blank");
    } else {
      handleClientDownload(resource, "md");
    }
  };

  return (
    <StudentShell>
      <div className="grid-bg min-h-screen">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
          <div className="eyebrow text-cyan">Workspace / resource vault</div>
          <h1 className="mt-2 text-3xl font-bold">Cheats & Resources</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Browse command syntax, code snippets, handouts, and activity guides published by the academy. Inspect contents directly or download reference notes.
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`rounded-xl px-3 py-2 text-xs transition-all ${
                  category === item
                    ? "bg-cyan font-bold text-ink shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                    : "bg-panel text-muted hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {visible.map((resource) => (
              <article
                key={resource.id}
                className="glass rounded-2xl p-5 flex flex-col justify-between hover:border-cyan/30 transition-all group"
              >
                <div>
                  <div className="flex items-center gap-2 text-cyan">
                    <Library size={17} />
                    <span className="text-xs font-semibold">{resource.category}</span>
                  </div>

                  <h2 className="mt-4 text-xl font-semibold group-hover:text-cyan transition-colors">
                    {resource.title}
                  </h2>

                  {resource.description && (
                    <p className="mt-2 text-sm leading-6 text-muted">{resource.description}</p>
                  )}

                  {resource.content && (
                    <div className="mt-4 whitespace-pre-wrap rounded-xl border border-line bg-[#0b1018] p-4 font-mono text-xs leading-6 text-slate-200 overflow-x-auto max-h-48 select-text">
                      {resource.content}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-line/40 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedResource(resource);
                      setViewMode("formatted");
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan px-3.5 py-2 text-xs font-bold text-ink hover:bg-cyan/90 transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                  >
                    <Eye size={14} />
                    View / Download
                  </button>

                  <button
                    onClick={() => handleResourceDownload(resource)}
                    title="Download resource note (.md)"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-panel/80 px-3 py-2 text-xs font-medium text-muted hover:text-cyan hover:border-cyan/40 transition-all"
                  >
                    <Download size={13} />
                    .md
                  </button>
                </div>
              </article>
            ))}
          </div>

          {visible.length === 0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
              <FileText className="mx-auto mb-3 text-cyan" />
              No resources published in this category yet.
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Content Viewer Modal */}
      {selectedResource && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedResource(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resource-modal-title"
        >
          <div className="glass w-full max-w-4xl max-h-[90vh] rounded-3xl border border-line/80 bg-[#0c121e] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-line/60 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-cyan text-xs font-semibold eyebrow">
                  <Library size={15} />
                  <span>{selectedResource.category}</span>
                </div>
                <h2
                  id="resource-modal-title"
                  className="mt-2 text-xl sm:text-2xl font-bold text-white tracking-tight break-words"
                >
                  {selectedResource.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedResource(null)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-panel text-muted hover:text-white hover:border-cyan/50 transition-all"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Actions Toolbar */}
            <div className="px-5 py-3 border-b border-line/40 bg-[#090e17] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void handleCopy(selectedResource.content)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-panel px-3 py-1.5 font-medium text-slate-300 hover:text-cyan hover:border-cyan/50 transition-all"
                >
                  {copied ? <Check size={14} className="text-cyan" /> : <Copy size={14} />}
                  <span>{copied ? "Copied to Clipboard!" : "Copy Snippet"}</span>
                </button>

                {/* View Mode Toggle: Formatted vs Raw */}
                <div className="ml-1 inline-flex items-center rounded-xl border border-line/60 bg-panel/60 p-0.5">
                  <button
                    onClick={() => setViewMode("formatted")}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition-all ${
                      viewMode === "formatted"
                        ? "bg-cyan/20 text-cyan font-bold"
                        : "text-muted hover:text-white"
                    }`}
                  >
                    <Sparkles size={12} />
                    Preview
                  </button>
                  <button
                    onClick={() => setViewMode("raw")}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition-all ${
                      viewMode === "raw"
                        ? "bg-cyan/20 text-cyan font-bold"
                        : "text-muted hover:text-white"
                    }`}
                  >
                    <Code2 size={12} />
                    Raw Markdown
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleClientDownload(selectedResource, "md")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-cyan/15 text-cyan border border-cyan/30 px-3 py-1.5 font-bold hover:bg-cyan hover:text-ink transition-all"
                >
                  <FileDown size={14} />
                  Download .md
                </button>
                <button
                  onClick={() => handleClientDownload(selectedResource, "txt")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-panel px-3 py-1.5 font-medium text-slate-300 hover:text-cyan hover:border-cyan/50 transition-all"
                >
                  <Download size={14} />
                  Download .txt
                </button>

                {/* If a real external/cloud file attachment is present */}
                {getReachableRemoteUrl(selectedResource) && (
                  <a
                    href={getReachableRemoteUrl(selectedResource)!}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-cyan px-3 py-1.5 font-bold text-ink hover:bg-cyan/90 transition-all shadow-[0_0_10px_rgba(6,182,212,0.25)]"
                  >
                    <Download size={14} />
                    Original File
                  </a>
                )}
              </div>
            </div>

            {/* Modal Body with sleek cyan scrollbar */}
            <div className="p-5 sm:p-6 overflow-y-auto max-h-[60vh] bg-[#070b12] text-slate-200 selection:bg-cyan/20 selection:text-cyan">
              {viewMode === "formatted" ? (
                selectedResource.content ? (
                  <div
                    className="prose prose-invert max-w-none text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(selectedResource.content),
                    }}
                  />
                ) : (
                  <div className="text-muted italic text-xs">
                    No text content available for this resource.
                  </div>
                )
              ) : (
                <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-300">
                  {selectedResource.content || "No text content available for this resource."}
                </pre>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-line/60 bg-[#090e17] flex items-center justify-between text-xs text-muted">
              <span>Ready for offline student study & lab practice</span>
              <button
                onClick={() => setSelectedResource(null)}
                className="rounded-xl border border-line bg-panel px-4 py-1.5 text-xs text-slate-300 hover:text-white transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentShell>
  );
}

