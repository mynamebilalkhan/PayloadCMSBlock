"use client";

import { useBuilderStore } from "@/block-builder/store/builder.store";
import { cn } from "@/block-builder/lib/utils";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium mb-1" style={{ color: "var(--payload-muted)" }}>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full px-2 py-1.5 text-xs rounded border outline-none focus:border-[var(--payload-accent)] transition-colors",
        className
      )}
      style={{
        background: "var(--payload-bg)",
        borderColor: "var(--payload-border)",
        color: "var(--payload-text)",
      }}
    />
  );
}

export function BlockConfig() {
  const { blocks, activeBlockId, updateBlock } = useBuilderStore();
  const block = blocks.find((b) => b.id === activeBlockId);

  if (!block) {
    return (
      <div className="p-4 text-xs text-center" style={{ color: "var(--payload-muted)" }}>
        No block selected
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3 panel-enter">
      <p
        className="text-xs font-semibold uppercase tracking-widest pb-1 border-b"
        style={{ color: "var(--payload-muted)", borderColor: "var(--payload-border)" }}
      >
        Block Config
      </p>

      <div>
        <Label>Slug *</Label>
        <Input
          value={block.slug}
          onChange={(v) => updateBlock(block.id, { slug: v.replace(/\s/g, "") })}
          placeholder="myBlock"
        />
        <p className="text-xs mt-1" style={{ color: "var(--payload-muted)" }}>Used as blockType identifier</p>
      </div>

      <div>
        <Label>Interface Name</Label>
        <Input
          value={block.interfaceName ?? ""}
          onChange={(v) => updateBlock(block.id, { interfaceName: v })}
          placeholder="MyBlock"
        />
        <p className="text-xs mt-1" style={{ color: "var(--payload-muted)" }}>TypeScript interface name</p>
      </div>

      <div>
        <Label>Singular Label</Label>
        <Input
          value={block.labels?.singular ?? ""}
          onChange={(v) => updateBlock(block.id, { labels: { ...block.labels, singular: v } })}
          placeholder="My Block"
        />
      </div>

      <div>
        <Label>Plural Label</Label>
        <Input
          value={block.labels?.plural ?? ""}
          onChange={(v) => updateBlock(block.id, { labels: { ...block.labels, plural: v } })}
          placeholder="My Blocks"
        />
      </div>

      <div>
        <Label>Image URL (optional)</Label>
        <Input
          value={block.imageURL ?? ""}
          onChange={(v) => updateBlock(block.id, { imageURL: v })}
          placeholder="https://..."
        />
        <p className="text-xs mt-1" style={{ color: "var(--payload-muted)" }}>Thumbnail shown in block selector</p>
      </div>
    </div>
  );
}
