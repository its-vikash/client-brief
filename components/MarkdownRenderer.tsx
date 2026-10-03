// ── MarkdownRenderer ─────────────────────────────────────────────────────────
// Converts the Markdown that Gemini returns into clean, styled HTML.
// Handles: headings (#/##/###), bold (**text**), italic (_text_),
//          unordered lists (- item), ordered lists (1. item),
//          horizontal rules (---), tables (|col|col|), checkboxes ([ ]/[x]),
//          code blocks (```), inline code (`code`), blockquotes (> text)
//
// This is intentionally lightweight — no external dependency.

"use client";

import { useMemo } from "react";

interface Props {
  content: string;
  /** Optional CSS class applied to the outer wrapper */
  className?: string;
  /** Optional inline style on wrapper */
  style?: React.CSSProperties;
}

// ── Inline parser (bold, italic, inline-code, links) ─────────────────────────
function parseInline(text: string): string {
  return text
    // Bold-italic: ***text***
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    // Bold: **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    // Italic: *text* or _text_
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    // Inline code: `code`
    .replace(/`([^`]+)`/g, '<code class="md-code-inline">$1</code>')
    // Links: [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>');
}

// ── Block parser ──────────────────────────────────────────────────────────────
function parseMarkdown(raw: string): string {
  const lines = raw.split("\n");
  const out: string[] = [];
  let inCode = false;
  let codeLines: string[] = [];
  let inTable = false;
  let tableRows: string[] = [];
  let inList: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  function flushList() {
    if (!inList) return;
    const tag = inList === "ul" ? "ul" : "ol";
    out.push(`<${tag} class="md-list">${listItems.map((li) => `<li>${parseInline(li)}</li>`).join("")}</${tag}>`);
    listItems = [];
    inList = null;
  }

  function flushTable() {
    if (!tableRows.length) return;
    const [headerRow, , ...bodyRows] = tableRows;
    const headers = headerRow.split("|").map((c) => c.trim()).filter(Boolean);
    const headerHtml = headers.map((h) => `<th>${parseInline(h)}</th>`).join("");
    const bodyHtml = bodyRows.map((row) => {
      const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
      return `<tr>${cells.map((c) => `<td>${parseInline(c)}</td>`).join("")}</tr>`;
    }).join("");
    out.push(`<div class="md-table-wrap"><table class="md-table"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`);
    tableRows = [];
    inTable = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block
    if (line.trim().startsWith("```")) {
      if (!inCode) { inCode = true; codeLines = []; continue; }
      else { out.push(`<pre class="md-code-block"><code>${codeLines.join("\n").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`); inCode = false; codeLines = []; continue; }
    }
    if (inCode) { codeLines.push(line); continue; }

    // Table detection
    if (line.trim().startsWith("|")) {
      flushList();
      inTable = true;
      tableRows.push(line);
      continue;
    }
    if (inTable) { flushTable(); }

    // Horizontal rule
    if (/^(\s*[-*_]){3,}\s*$/.test(line)) { flushList(); out.push('<hr class="md-hr" />'); continue; }

    // Headings
    if (/^#{1,6}\s/.test(line)) {
      flushList();
      const level = line.match(/^(#{1,6})\s/)?.[1].length ?? 1;
      const text  = parseInline(line.replace(/^#{1,6}\s/, "").trim());
      out.push(`<h${level} class="md-h${level}">${text}</h${level}>`);
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      flushList();
      out.push(`<blockquote class="md-blockquote">${parseInline(line.slice(2))}</blockquote>`);
      continue;
    }

    // Checkbox
    if (/^\s*[-*]\s\[[ xX]\]/.test(line)) {
      flushList();
      const checked = /\[[xX]\]/.test(line);
      const text    = parseInline(line.replace(/^\s*[-*]\s\[[ xX]\]\s*/, ""));
      out.push(`<div class="md-checkbox"><span class="md-check${checked ? " checked" : ""}">${checked ? "✓" : ""}</span><span>${text}</span></div>`);
      continue;
    }

    // Unordered list
    if (/^\s*[-*+•]\s/.test(line)) {
      if (inList === "ol") { flushList(); }
      inList = "ul";
      listItems.push(line.replace(/^\s*[-*+•]\s/, "").trim());
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s/.test(line)) {
      if (inList === "ul") { flushList(); }
      inList = "ol";
      listItems.push(line.replace(/^\s*\d+\.\s/, "").trim());
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      flushList();
      out.push('<div class="md-spacer"></div>');
      continue;
    }

    // Regular paragraph
    flushList();
    out.push(`<p class="md-p">${parseInline(line)}</p>`);
  }

  flushList();
  if (inTable) flushTable();
  if (inCode) out.push(`<pre class="md-code-block"><code>${codeLines.join("\n")}</code></pre>`);

  return out.join("\n");
}

// ── CSS injected once ─────────────────────────────────────────────────────────
const MD_STYLES = `
.md-h1{font-family:var(--font-bricolage),sans-serif;font-size:1.4rem;font-weight:800;color:var(--text-primary);margin:1.2rem 0 0.4rem;line-height:1.2;}
.md-h2{font-family:var(--font-bricolage),sans-serif;font-size:1.1rem;font-weight:700;color:var(--text-primary);margin:1rem 0 0.3rem;padding-bottom:0.25rem;border-bottom:1px solid var(--border-light);}
.md-h3{font-size:0.95rem;font-weight:700;color:var(--text-primary);margin:0.8rem 0 0.25rem;}
.md-h4,.md-h5,.md-h6{font-size:0.9rem;font-weight:600;color:var(--text-secondary);margin:0.6rem 0 0.2rem;}
.md-p{margin:0.35rem 0;line-height:1.65;color:var(--text-secondary);font-size:0.875rem;}
.md-spacer{height:0.5rem;}
.md-hr{border:none;border-top:1px solid var(--border);margin:1rem 0;}
.md-list{margin:0.4rem 0 0.4rem 1.2rem;space-y:0.25rem;}
.md-list li{line-height:1.6;color:var(--text-secondary);font-size:0.875rem;margin-bottom:0.2rem;}
.md-code-inline{font-family:var(--font-space-mono),monospace;font-size:0.78rem;background:rgba(28,43,45,0.07);color:var(--teal);padding:0.1rem 0.35rem;border-radius:4px;}
.md-code-block{background:var(--teal-dark);color:#a8d8c8;font-family:var(--font-space-mono),monospace;font-size:0.78rem;padding:1rem;border-radius:10px;overflow-x:auto;margin:0.6rem 0;line-height:1.6;}
.md-table-wrap{overflow-x:auto;margin:0.6rem 0;}
.md-table{width:100%;border-collapse:collapse;font-size:0.825rem;}
.md-table th{background:var(--teal-dark);color:var(--text-cream);font-weight:600;padding:0.5rem 0.75rem;text-align:left;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;}
.md-table td{padding:0.45rem 0.75rem;border-bottom:1px solid var(--border-light);color:var(--text-secondary);}
.md-table tr:last-child td{border-bottom:none;}
.md-table tr:nth-child(even) td{background:rgba(0,0,0,0.02);}
.md-blockquote{border-left:3px solid var(--orange);padding:0.4rem 0.75rem;margin:0.5rem 0;color:var(--text-secondary);font-style:italic;background:rgba(238,137,83,0.06);border-radius:0 8px 8px 0;font-size:0.875rem;}
.md-checkbox{display:flex;align-items:flex-start;gap:0.5rem;margin:0.25rem 0;font-size:0.875rem;color:var(--text-secondary);}
.md-check{width:1.1rem;height:1.1rem;border:1.5px solid var(--border);border-radius:4px;display:inline-flex;align-items:center;justify-content:center;shrink:0;font-size:0.65rem;font-weight:bold;}
.md-check.checked{background:var(--teal);border-color:var(--teal);color:white;}
.md-link{color:var(--teal);text-decoration:underline;}
.md-link:hover{opacity:0.75;}
`;

let stylesInjected = false;

export default function MarkdownRenderer({ content, className, style }: Props) {
  const html = useMemo(() => parseMarkdown(content), [content]);

  // Inject styles once
  if (typeof window !== "undefined" && !stylesInjected) {
    const el = window.document.createElement("style");
    el.id    = "md-renderer-styles";
    if (!window.document.getElementById("md-renderer-styles")) {
      el.textContent = MD_STYLES;
      window.document.head.appendChild(el);
    }
    stylesInjected = true;
  }

  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ── Export raw HTML generator (for download) ──────────────────────────────────
export function markdownToHtml(
  markdown: string,
  theme: "professional" | "minimal" | "dark" = "professional"
): string {
  const body = parseMarkdown(markdown);

  const themes = {
    professional: {
      bg: "#ffffff", text: "#1a2e2f", secondary: "#4a5e5b", border: "#e0dbd2",
      accent: "#ee8953", heading: "#1a2e2f", code_bg: "#1c2b2d", code_text: "#a8d8c8",
      font: "Georgia, 'Times New Roman', serif", hfont: "system-ui, sans-serif",
    },
    minimal: {
      bg: "#fafafa", text: "#222222", secondary: "#555555", border: "#eeeeee",
      accent: "#3d6b63", heading: "#111111", code_bg: "#f4f4f4", code_text: "#333333",
      font: "system-ui, -apple-system, sans-serif", hfont: "system-ui, sans-serif",
    },
    dark: {
      bg: "#1c2b2d", text: "#f5f1ea", secondary: "#a8bfbd", border: "#2e4548",
      accent: "#ee8953", heading: "#ffffff", code_bg: "#142020", code_text: "#a8d8c8",
      font: "system-ui, -apple-system, sans-serif", hfont: "system-ui, sans-serif",
    },
  };

  const t = themes[theme];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>PreConvara Document</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${t.bg}; color: ${t.text}; font-family: ${t.font}; font-size: 14px; line-height: 1.65; padding: 48px; max-width: 820px; margin: 0 auto; }
  h1,h2,h3,h4 { font-family: ${t.hfont}; color: ${t.heading}; }
  h1 { font-size: 1.6rem; font-weight: 800; margin: 1.4rem 0 0.5rem; }
  h2 { font-size: 1.15rem; font-weight: 700; margin: 1.1rem 0 0.4rem; padding-bottom: 0.3rem; border-bottom: 1px solid ${t.border}; }
  h3 { font-size: 0.95rem; font-weight: 700; margin: 0.9rem 0 0.3rem; }
  h4,h5,h6 { font-size: 0.875rem; font-weight: 600; color: ${t.secondary}; margin: 0.7rem 0 0.2rem; }
  .md-p { margin: 0.4rem 0; color: ${t.secondary}; font-size: 0.9rem; line-height: 1.7; }
  .md-spacer { height: 0.6rem; }
  .md-hr { border: none; border-top: 1px solid ${t.border}; margin: 1.2rem 0; }
  .md-list { margin: 0.5rem 0 0.5rem 1.5rem; }
  .md-list li { line-height: 1.65; color: ${t.secondary}; font-size: 0.9rem; margin-bottom: 0.25rem; }
  .md-code-inline { font-family: 'Courier New', monospace; font-size: 0.8rem; background: rgba(0,0,0,0.06); color: ${t.accent}; padding: 0.1rem 0.35rem; border-radius: 4px; }
  .md-code-block { background: ${t.code_bg}; color: ${t.code_text}; font-family: 'Courier New', monospace; font-size: 0.8rem; padding: 1rem; border-radius: 8px; overflow-x: auto; margin: 0.8rem 0; }
  .md-table-wrap { overflow-x: auto; margin: 0.8rem 0; }
  .md-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  .md-table th { background: ${theme === "dark" ? "#2e4548" : t.accent}; color: ${theme === "dark" ? t.text : "#fff"}; font-weight: 600; padding: 0.6rem 0.9rem; text-align: left; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.06em; }
  .md-table td { padding: 0.5rem 0.9rem; border-bottom: 1px solid ${t.border}; color: ${t.secondary}; }
  .md-table tr:last-child td { border-bottom: none; }
  .md-table tr:nth-child(even) td { background: rgba(0,0,0,0.02); }
  .md-blockquote { border-left: 3px solid ${t.accent}; padding: 0.5rem 0.9rem; margin: 0.6rem 0; color: ${t.secondary}; font-style: italic; background: rgba(0,0,0,0.04); border-radius: 0 6px 6px 0; }
  .md-checkbox { display: flex; align-items: flex-start; gap: 0.5rem; margin: 0.3rem 0; font-size: 0.875rem; color: ${t.secondary}; }
  .md-check { width: 1rem; height: 1rem; border: 1.5px solid ${t.border}; border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: bold; flex-shrink: 0; }
  .md-check.checked { background: ${t.accent}; border-color: ${t.accent}; color: white; }
  .md-link { color: ${t.accent}; }
  @media print { body { padding: 24px; } }
</style>
</head>
<body>
${body}
</body>
</html>`;
}
