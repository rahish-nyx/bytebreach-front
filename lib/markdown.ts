/**
 * Lightweight, zero-dependency Markdown-to-HTML parser for ByteBreach.
 * Handles headings, fenced code blocks with Cisco CLI formatting, inline code,
 * bold/italic styling, lists, blockquotes, and tables, while safely passing through HTML.
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderMarkdown(content: string): string {
  if (!content) return "";

  // If already full HTML and does not look like markdown (no #, ```, or markdown lists), return directly
  const hasMarkdownMarkers = /^(#{1,6}\s|```|[-*]\s|\d+\.\s|>\s)/m.test(content) || /\*\*[^*]+\*\*/.test(content);
  if (!hasMarkdownMarkers && (content.trim().startsWith("<p>") || content.trim().startsWith("<div>") || content.trim().startsWith("<article>"))) {
    return content;
  }

  // Normalize line endings
  const normalized = content.replace(/\r\n/g, "\n");

  // Extract code blocks first to protect their formatting
  const codeBlocks: string[] = [];
  const textWithPlaceholders = normalized.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = escapeHtml(code.trimEnd());
    const languageLabel = lang ? `<div class="code-lang-label text-[10px] uppercase font-mono tracking-wider text-cyan/70 border-b border-cyan/20 px-3 py-1.5 bg-black/40">${escapeHtml(lang)}</div>` : "";
    const html = `<div class="my-5 overflow-hidden rounded-xl border border-cyan/30 bg-[#080d16] shadow-lg font-mono text-xs leading-relaxed text-slate-200">${languageLabel}<pre class="p-4 overflow-x-auto selection:bg-cyan/30"><code>${escaped}</code></pre></div>`;
    codeBlocks.push(html);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // Process line by line
  const lines = textWithPlaceholders.split("\n");
  const output: string[] = [];
  let inList = false;
  let listType: "ul" | "ol" | null = null;
  let inBlockquote = false;
  let blockquoteLines: string[] = [];

  const flushList = () => {
    if (inList && listType) {
      output.push(`</${listType}>`);
      inList = false;
      listType = null;
    }
  };

  const flushBlockquote = () => {
    if (inBlockquote) {
      output.push(`<blockquote class="my-4 border-l-4 border-cyan bg-cyan/[.05] p-3 pl-4 text-xs italic text-slate-300 rounded-r-lg">${blockquoteLines.join("<br/>")}</blockquote>`);
      inBlockquote = false;
      blockquoteLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for code block placeholder
    if (trimmed.startsWith("__CODE_BLOCK_") && trimmed.endsWith("__")) {
      flushList();
      flushBlockquote();
      const index = parseInt(trimmed.replace("__CODE_BLOCK_", "").replace("__", ""), 10);
      if (codeBlocks[index]) {
        output.push(codeBlocks[index]);
      }
      continue;
    }

    // Empty lines
    if (!trimmed) {
      flushList();
      flushBlockquote();
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      flushList();
      inBlockquote = true;
      blockquoteLines.push(formatInline(trimmed.slice(2)));
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
    }

    // Headings
    if (trimmed.startsWith("#### ")) {
      flushList();
      output.push(`<h4 class="mt-6 mb-2 text-base font-semibold text-slate-100">${formatInline(trimmed.slice(5))}</h4>`);
      continue;
    }
    if (trimmed.startsWith("### ")) {
      flushList();
      output.push(`<h3 class="mt-8 mb-3 text-lg font-bold text-cyan flex items-center gap-2">${formatInline(trimmed.slice(4))}</h3>`);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      output.push(`<h2 class="mt-10 mb-4 pb-2 text-xl sm:text-2xl font-bold tracking-tight text-white border-b border-cyan/20 flex items-center gap-2">${formatInline(trimmed.slice(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushList();
      output.push(`<h1 class="mt-8 mb-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">${formatInline(trimmed.slice(2))}</h1>`);
      continue;
    }

    // Horizontal Rule
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      flushList();
      output.push(`<hr class="my-8 border-cyan/20"/>`);
      continue;
    }

    // Unordered List
    if (/^[-*]\s+/.test(trimmed)) {
      if (!inList || listType !== "ul") {
        flushList();
        inList = true;
        listType = "ul";
        output.push(`<ul class="my-3 space-y-1.5 pl-6 list-disc text-slate-300">`);
      }
      const itemContent = trimmed.replace(/^[-*]\s+/, "");
      output.push(`<li>${formatInline(itemContent)}</li>`);
      continue;
    }

    // Ordered List
    if (/^\d+\.\s+/.test(trimmed)) {
      if (!inList || listType !== "ol") {
        flushList();
        inList = true;
        listType = "ol";
        output.push(`<ol class="my-3 space-y-1.5 pl-6 list-decimal text-slate-300">`);
      }
      const itemContent = trimmed.replace(/^\d+\.\s+/, "");
      output.push(`<li>${formatInline(itemContent)}</li>`);
      continue;
    }

    flushList();

    // Tables or direct HTML elements
    if (trimmed.startsWith("<")) {
      output.push(trimmed);
      continue;
    }

    // Regular paragraph
    output.push(`<p class="my-3 text-sm leading-7 text-slate-300">${formatInline(trimmed)}</p>`);
  }

  flushList();
  flushBlockquote();

  return output.join("\n");
}

function formatInline(text: string): string {
  return text
    // Inline code
    .replace(/`([^`]+)`/g, `<code class="px-1.5 py-0.5 rounded bg-cyan/10 text-cyan font-mono text-xs border border-cyan/20">$1</code>`)
    // Bold italic
    .replace(/\*\*\*([^*]+)\*\*\*/g, `<strong><em>$1</em></strong>`)
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, `<strong class="text-white font-semibold">$1</strong>`)
    // Italic
    .replace(/\*([^*]+)\*/g, `<em>$1</em>`)
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" class="text-cyan underline hover:text-cyan/80" target="_blank" rel="noopener noreferrer">$1</a>`);
}
