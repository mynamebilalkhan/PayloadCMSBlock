"use client";

import { useBuilderStore } from "@/block-builder/store/builder.store";
import { cn } from "@/block-builder/lib/utils";
import { Plus, Trash2, Copy, Box, ChevronRight } from "lucide-react";

export function BlockList() {
  const {
    blocks,
    activeBlockId,
    addBlock,
    removeBlock,
    duplicateBlock,
    setActiveBlock,
  } = useBuilderStore();

  return (
    <aside
      className="w-56 flex flex-col border-r"
      style={{
        background: "var(--payload-surface)",
        borderColor: "var(--payload-border)",
      }}
    >
      {/* Header */}
      <div
        className="h-10 flex items-center justify-between px-3 border-b"
        style={{ borderColor: "var(--payload-border)" }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--payload-muted)" }}
        >
          Blocks
        </span>
        <button
          onClick={addBlock}
          className="w-6 h-6 rounded flex items-center justify-center transition-colors"
          style={{ color: "var(--payload-accent)" }}
          title="Add block"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Block list */}
      <div className="flex-1 overflow-y-auto py-1">
        {blocks.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <Box
              size={24}
              className="mx-auto mb-2"
              style={{ color: "var(--payload-border-hover)" }}
            />
            <p className="text-xs" style={{ color: "var(--payload-muted)" }}>
              No blocks yet.
            </p>
            <button
              onClick={addBlock}
              className="mt-2 text-xs underline underline-offset-2"
              style={{ color: "var(--payload-accent)" }}
            >
              Add one
            </button>
          </div>
        ) : (
          blocks.map((block) => {
            const isActive = block.id === activeBlockId;
            return (
              <div
                key={block.id}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors",
                  isActive && "bg-[var(--payload-accent-dim)]"
                )}
                style={{
                  borderLeft: isActive
                    ? "2px solid var(--payload-accent)"
                    : "2px solid transparent",
                }}
                onClick={() => setActiveBlock(block.id)}
              >
                <Box
                  size={12}
                  style={{
                    color: isActive ? "var(--payload-accent)" : "var(--payload-muted)",
                    flexShrink: 0,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-medium truncate"
                    style={{
                      color: isActive ? "var(--payload-accent)" : "var(--payload-text)",
                    }}
                  >
                    {block.slug || "unnamed"}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--payload-muted)" }}>
                    {block.fields.length} field{block.fields.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }}
                    className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10"
                    style={{ color: "var(--payload-muted)" }}
                    title="Duplicate"
                  >
                    <Copy size={10} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete block "${block.slug}"?`)) removeBlock(block.id);
                    }}
                    className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-500/20"
                    style={{ color: "var(--payload-muted)" }}
                    title="Delete"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>

                {isActive && (
                  <ChevronRight size={10} style={{ color: "var(--payload-accent)", flexShrink: 0 }} />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t" style={{ borderColor: "var(--payload-border)" }}>
        <button
          onClick={addBlock}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-xs border border-dashed transition-colors"
          style={{ color: "var(--payload-muted)", borderColor: "var(--payload-border-hover)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--payload-accent)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--payload-accent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--payload-muted)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--payload-border-hover)";
          }}
        >
          <Plus size={12} />
          New Block
        </button>
      </div>
    </aside>
  );
}
