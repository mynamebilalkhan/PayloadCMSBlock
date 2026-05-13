"use client";

import { useBuilderStore } from "@/block-builder/store/builder.store";
import { useState, useEffect, useCallback } from "react";
import { Copy, Check, Code2, RefreshCw } from "lucide-react";
import type { GeneratedOutput } from "@/block-builder/types";

function highlight(code: string): string {
  return code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/('.*?')/g, '<span class="token-string">$1</span>')
    .replace(
      /\b(import|export|from|const|type|as|true|false|undefined|null)\b/g,
      '<span class="token-keyword">$1</span>'
    )
    .replace(/\b(Block|Field|string|number|boolean)\b/g, '<span class="token-type">$1</span>')
    .replace(/(\/\/.*)/g, '<span class="token-comment">$1</span>');
}

export function CodePreview() {
  const { blocks, activeBlockId } = useBuilderStore();
  const [files, setFiles] = useState<GeneratedOutput[]>([]);
  const [activeFile, setActiveFile] = useState(0);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const regenerate = useCallback(async () => {
    if (blocks.length === 0) { setFiles([]); return; }
    setGenerating(true);
    try {
      const res = await fetch('/api/block-builder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const allFiles: GeneratedOutput[] = data.files ?? [];
      setFiles(allFiles);
      const idx = blocks.findIndex((b) => b.id === activeBlockId);
      if (idx >= 0 && idx < allFiles.length - 1) setActiveFile(idx);
    } finally {
      setGenerating(false);
    }
  }, [blocks, activeBlockId]);

  useEffect(() => {
    const t = setTimeout(regenerate, 400);
    return () => clearTimeout(t);
  }, [regenerate]);

  async function copyCode() {
    const code = files[activeFile]?.code;
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--payload-bg)" }}>
      {/* Header */}
      <div
        className="h-10 flex items-center justify-between px-3 border-b flex-shrink-0"
        style={{ background: "var(--payload-surface)", borderColor: "var(--payload-border)" }}
      >
        <div className="flex items-center gap-2">
          <Code2 size={13} style={{ color: "var(--payload-accent)" }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--payload-muted)" }}>
            Generated Code
          </span>
          {generating && <RefreshCw size={11} className="animate-spin" style={{ color: "var(--payload-muted)" }} />}
        </div>
        <button
          onClick={copyCode}
          disabled={files.length === 0}
          className="flex items-center gap-1.5 px-2 py-1 text-xs rounded border transition-colors disabled:opacity-30"
          style={{
            color: copied ? "var(--payload-success)" : "var(--payload-muted)",
            borderColor: copied ? "var(--payload-success)" : "var(--payload-border)",
          }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* File tabs */}
      {files.length > 0 && (
        <div
          className="flex overflow-x-auto border-b flex-shrink-0"
          style={{ background: "var(--payload-surface)", borderColor: "var(--payload-border)" }}
        >
          {files.map((file, i) => (
            <button
              key={file.filename}
              onClick={() => setActiveFile(i)}
              className="px-3 py-1.5 text-xs whitespace-nowrap transition-colors border-b-2"
              style={{
                color: i === activeFile ? "var(--payload-accent)" : "var(--payload-muted)",
                borderBottomColor: i === activeFile ? "var(--payload-accent)" : "transparent",
                background: i === activeFile ? "var(--payload-accent-dim)" : "transparent",
              }}
            >
              {file.filename}
            </button>
          ))}
        </div>
      )}

      {/* Code area */}
      <div className="flex-1 overflow-auto p-4">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: "var(--payload-muted)" }}>
            <Code2 size={32} style={{ opacity: 0.3 }} />
            <p className="text-xs">Add a block to see generated code</p>
          </div>
        ) : (
          <pre
            className="code-preview text-xs leading-relaxed"
            dangerouslySetInnerHTML={{ __html: highlight(files[activeFile]?.code ?? "") }}
          />
        )}
      </div>
    </div>
  );
}
