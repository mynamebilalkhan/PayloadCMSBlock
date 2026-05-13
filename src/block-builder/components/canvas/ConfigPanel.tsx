"use client";

import { useBuilderStore } from "@/block-builder/store/builder.store";
import { BlockConfig } from "@/block-builder/components/config/BlockConfig";
import { FieldConfig } from "@/block-builder/components/config/FieldConfig";
import { useState, useEffect } from "react";

type Tab = "block" | "field";

export function ConfigPanel() {
  const { activeFieldId } = useBuilderStore();
  const [tab, setTab] = useState<Tab>("block");

  useEffect(() => {
    if (activeFieldId) setTab("field");
  }, [activeFieldId]);

  return (
    <aside
      className="w-64 flex flex-col border-l"
      style={{
        background: "var(--payload-surface)",
        borderColor: "var(--payload-border)",
      }}
    >
      <div className="flex border-b flex-shrink-0" style={{ borderColor: "var(--payload-border)" }}>
        {(["block", "field"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2.5 text-xs font-medium capitalize transition-colors border-b-2"
            style={{
              color: tab === t ? "var(--payload-accent)" : "var(--payload-muted)",
              borderBottomColor: tab === t ? "var(--payload-accent)" : "transparent",
              background: tab === t ? "var(--payload-accent-dim)" : "transparent",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "block" ? <BlockConfig /> : <FieldConfig />}
      </div>
    </aside>
  );
}
