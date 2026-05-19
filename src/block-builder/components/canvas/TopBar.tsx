"use client";

import { useBuilderStore } from "@/block-builder/store/builder.store";
import { mapToSaveRequest } from "@/block-builder/lib/mapToSaveRequest";
import { Download, RotateCcw, Box, Loader2, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import type { GeneratedOutput } from "@/block-builder/types";

type PublishStatus = "idle" | "publishing" | "success" | "error";

export function TopBar() {
  const { blocks, activeBlockId, isDirty, reset, markClean } = useBuilderStore();
  const [exporting, setExporting] = useState(false);
  const [publishStatus, setPublishStatus] = useState<PublishStatus>("idle");
  const [publishMessage, setPublishMessage] = useState("");

  async function handleExport() {
    if (blocks.length === 0) return;
    setExporting(true);
    try {
      const res = await fetch('/api/block-builder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks }),
      });
      if (!res.ok) return;
      const { files }: { files: GeneratedOutput[] } = await res.json();

      for (const file of files) {
        const blob = new Blob([file.code], { type: "text/typescript" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.filename;
        a.click();
        URL.revokeObjectURL(url);
        await new Promise((r) => setTimeout(r, 100));
      }
      markClean();
    } finally {
      setExporting(false);
    }
  }

  async function handlePublish() {
    if (blocks.length === 0 || !activeBlockId) return;

    const activeBlock = blocks.find((b) => b.id === activeBlockId);
    if (!activeBlock) return;

    setPublishStatus("publishing");
    setPublishMessage("");

    try {
      const body = mapToSaveRequest(activeBlock);
      const res = await fetch('/api/blocks/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setPublishStatus("success");
        setPublishMessage(`✓ ${activeBlock.slug} published`);
        markClean();
      } else {
        const err = await res.json().catch(() => ({}));
        setPublishStatus("error");
        setPublishMessage(`✗ ${activeBlock.slug}: ${err.error ?? res.statusText}`);
      }
    } catch (e) {
      setPublishStatus("error");
      setPublishMessage(`✗ ${activeBlock.slug}: network error`);
    }

    setTimeout(() => setPublishStatus("idle"), 4000);
  }

  return (
    <header
      className="flex flex-col border-b"
      style={{ background: "var(--payload-surface)", borderColor: "var(--payload-border)" }}
    >
      <div className="h-14 flex items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded flex items-center justify-center"
            style={{ background: "var(--payload-accent)" }}
          >
            <Box size={16} className="text-black" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight" style={{ color: "var(--payload-text)" }}>
              Block Builder
            </span>
            <span className="text-xs ml-2" style={{ color: "var(--payload-muted)" }}>
              for Payload CMS
            </span>
          </div>
          {isDirty && (
            <span
              className="text-xs px-2 py-0.5 rounded-full border"
              style={{
                color: "var(--payload-accent)",
                borderColor: "var(--payload-accent)",
                background: "var(--payload-accent-dim)",
              }}
            >
              unsaved
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="text-xs hidden md:flex items-center gap-4" style={{ color: "var(--payload-muted)" }}>
          <span>{blocks.length} block{blocks.length !== 1 ? "s" : ""}</span>
          <span>{blocks.reduce((acc, b) => acc + b.fields.length, 0)} total fields</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { if (confirm("Reset all blocks? This cannot be undone.")) reset(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors"
            style={{ color: "var(--payload-muted)", borderColor: "var(--payload-border)", background: "transparent" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--payload-border-hover)";
              (e.currentTarget as HTMLElement).style.color = "var(--payload-text)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--payload-border)";
              (e.currentTarget as HTMLElement).style.color = "var(--payload-muted)";
            }}
          >
            <RotateCcw size={12} />
            Reset
          </button>

          <button
            onClick={handleExport}
            disabled={blocks.length === 0 || exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors disabled:opacity-40"
            style={{ color: "var(--payload-muted)", borderColor: "var(--payload-border)", background: "transparent" }}
            onMouseEnter={(e) => {
              if (!(e.currentTarget as HTMLButtonElement).disabled) {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--payload-border-hover)";
                (e.currentTarget as HTMLElement).style.color = "var(--payload-text)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--payload-border)";
              (e.currentTarget as HTMLElement).style.color = "var(--payload-muted)";
            }}
          >
            {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            Export .ts
          </button>

          <button
            onClick={handlePublish}
            disabled={blocks.length === 0 || !activeBlockId || publishStatus === "publishing"}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded font-medium transition-opacity disabled:opacity-40"
            style={{ background: "var(--payload-accent)", color: "#000" }}
          >
            {publishStatus === "publishing" ? (
              <Loader2 size={12} className="animate-spin" />
            ) : publishStatus === "success" ? (
              <CheckCircle size={12} />
            ) : publishStatus === "error" ? (
              <AlertCircle size={12} />
            ) : (
              <Upload size={12} />
            )}
            {publishStatus === "publishing" ? "Publishing…" : "Publish to Payload"}
          </button>
        </div>
      </div>

      {/* Publish status bar */}
      {publishStatus !== "idle" && publishMessage && (
        <div
          className="px-4 py-1.5 text-xs border-t"
          style={{
            background: publishStatus === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            borderColor: publishStatus === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
            color: publishStatus === "success" ? "var(--payload-success)" : "var(--payload-danger)",
          }}
        >
          {publishMessage}
        </div>
      )}
    </header>
  );
}
