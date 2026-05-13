"use client";

import { useBuilderStore } from "@/block-builder/store/builder.store";
import { FIELD_PALETTE, FIELD_CATEGORIES } from "@/block-builder/lib/field-palette";
import type { FieldType } from "@/block-builder/types";
import {
  Type, Hash, Mail, AlignLeft, CheckSquare, ChevronDown, Circle,
  Upload, Link, FileText, List, Folder, Columns, Braces, Code,
  MapPin, Puzzle, Calendar,
} from "lucide-react";
import { useState } from "react";

const ICON_MAP: Record<string, React.ElementType> = {
  Type, Hash, Mail, AlignLeft, CheckSquare, ChevronDown, Circle,
  Upload, Link, FileText, List, Folder, Columns, Braces, Code,
  MapPin, Puzzle, Calendar,
};

export function FieldPalette() {
  const { activeBlockId, addField } = useBuilderStore();
  const [search, setSearch] = useState("");

  const filtered = FIELD_PALETTE.filter(
    (f) =>
      f.label.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase())
  );

  function handleAdd(type: FieldType) {
    if (!activeBlockId) return;
    addField(activeBlockId, type);
  }

  return (
    <aside
      className="w-52 flex flex-col border-r"
      style={{ background: "var(--payload-surface)", borderColor: "var(--payload-border)" }}
    >
      <div className="h-10 flex items-center px-3 border-b" style={{ borderColor: "var(--payload-border)" }}>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--payload-muted)" }}>
          Fields
        </span>
      </div>

      <div className="px-2 py-2 border-b" style={{ borderColor: "var(--payload-border)" }}>
        <input
          type="text"
          placeholder="Search fields..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-2 py-1.5 text-xs rounded border outline-none focus:border-[var(--payload-accent)]"
          style={{
            background: "var(--payload-bg)",
            borderColor: "var(--payload-border)",
            color: "var(--payload-text)",
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {!activeBlockId ? (
          <p className="px-3 py-4 text-xs text-center" style={{ color: "var(--payload-muted)" }}>
            Select or create a block first
          </p>
        ) : (
          FIELD_CATEGORIES.map((cat) => {
            const items = filtered.filter((f) => f.category === cat.id);
            if (items.length === 0) return null;
            return (
              <div key={cat.id} className="mb-1">
                <p className="px-3 py-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--payload-muted)" }}>
                  {cat.label}
                </p>
                {items.map((item) => {
                  const Icon = ICON_MAP[item.icon] ?? Type;
                  return (
                    <button
                      key={item.type}
                      onClick={() => handleAdd(item.type)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-white/5 group"
                      title={item.description}
                    >
                      <div className={`w-6 h-6 rounded border flex items-center justify-center flex-shrink-0 ${item.color}`}>
                        <Icon size={11} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: "var(--payload-text)" }}>
                          {item.label}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
