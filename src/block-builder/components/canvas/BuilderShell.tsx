"use client";

import { useState, useEffect } from "react";
import { TopBar } from "./TopBar";
import { BlockList } from "./BlockList";
import { BuilderCanvas } from "./BuilderCanvas";
import { ConfigPanel } from "./ConfigPanel";
import { FieldPalette } from "@/block-builder/components/sidebar/FieldPalette";
import { CodePreview } from "./CodePreview";
import { Code2, Layout, Loader2 } from "lucide-react";
import { useBuilderStore } from "@/block-builder/store/builder.store";
import type { BlockDefinition } from "@/block-builder/types";

type View = "builder" | "code";

export function BuilderShell({ loadSlug }: { loadSlug?: string }) {
  const [view, setView] = useState<View>("builder");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { loadBlock } = useBuilderStore();

  useEffect(() => {
    if (!loadSlug) return;
    setLoading(true);
    setLoadError(null);
    fetch(`/api/block-builder/load/${encodeURIComponent(loadSlug)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? res.statusText);
        }
        return res.json() as Promise<{ block: BlockDefinition }>;
      })
      .then(({ block }) => loadBlock(block))
      .catch((err: unknown) =>
        setLoadError(err instanceof Error ? err.message : String(err))
      )
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadSlug]);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: "var(--payload-bg)" }}
    >
      {loading && (
        <div
          className="flex items-center gap-2 px-4 py-2 text-xs border-b"
          style={{
            background: "var(--payload-surface)",
            borderColor: "var(--payload-border)",
            color: "var(--payload-muted)",
          }}
        >
          <Loader2 size={12} className="animate-spin" />
          Loading block <strong style={{ color: "var(--payload-accent)" }}>{loadSlug}</strong>…
        </div>
      )}
      {loadError && (
        <div
          className="px-4 py-2 text-xs border-b"
          style={{
            background: "rgba(239,68,68,0.1)",
            borderColor: "rgba(239,68,68,0.3)",
            color: "var(--payload-danger)",
          }}
        >
          Failed to load block: {loadError}
        </div>
      )}
      <TopBar />

      {/* View toggle */}
      <div
        className="flex items-center gap-1 px-3 py-1.5 border-b"
        style={{
          background: "var(--payload-surface)",
          borderColor: "var(--payload-border)",
        }}
      >
        <button
          onClick={() => setView("builder")}
          className="flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors"
          style={{
            background:
              view === "builder" ? "var(--payload-accent-dim)" : "transparent",
            color:
              view === "builder"
                ? "var(--payload-accent)"
                : "var(--payload-muted)",
          }}
        >
          <Layout size={12} />
          Builder
        </button>
        <button
          onClick={() => setView("code")}
          className="flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors"
          style={{
            background:
              view === "code" ? "var(--payload-accent-dim)" : "transparent",
            color:
              view === "code"
                ? "var(--payload-accent)"
                : "var(--payload-muted)",
          }}
        >
          <Code2 size={12} />
          Code Preview
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {view === "builder" ? (
          <>
            <BlockList />
            <FieldPalette />
            <div
              className="flex-1 flex flex-col overflow-hidden"
              style={{ background: "var(--payload-bg)" }}
            >
              <BuilderCanvas />
            </div>
            <ConfigPanel />
          </>
        ) : (
          <>
            <BlockList />
            <div className="flex-1 overflow-hidden">
              <CodePreview />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
