"use client";

import { useBuilderStore } from "@/block-builder/store/builder.store";
import { getFieldMeta } from "@/block-builder/lib/field-palette";
import type { FieldDefinition, SelectOption } from "@/block-builder/types";
import { Plus, Trash2, X } from "lucide-react";
import { cn } from "@/block-builder/lib/utils";

function Row({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs font-medium" style={{ color: "var(--payload-muted)" }}>
        {children}
      </label>
      {hint && (
        <span className="text-xs" style={{ color: "var(--payload-muted)", opacity: 0.6 }}>
          {hint}
        </span>
      )}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-2 py-1.5 text-xs rounded border outline-none focus:border-[var(--payload-accent)] transition-colors"
      style={{
        background: "var(--payload-bg)",
        borderColor: "var(--payload-border)",
        color: "var(--payload-text)",
      }}
    />
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div
        className={cn("w-8 h-4 rounded-full transition-colors relative", checked ? "bg-[var(--payload-accent)]" : "bg-[var(--payload-border-hover)]")}
        onClick={() => onChange(!checked)}
      >
        <div className={cn("absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform", checked ? "translate-x-4" : "translate-x-0.5")} />
      </div>
      <span className="text-xs" style={{ color: "var(--payload-text)" }}>{label}</span>
    </label>
  );
}

function OptionsEditor({ options, onChange }: { options: SelectOption[]; onChange: (opts: SelectOption[]) => void }) {
  function addOption() {
    const n = options.length + 1;
    onChange([...options, { label: `Option ${n}`, value: `option_${n}` }]);
  }

  function updateOption(i: number, key: keyof SelectOption, val: string) {
    const next = options.map((o, idx) => (idx === i ? { ...o, [key]: val } : o));
    onChange(next);
  }

  function removeOption(i: number) {
    onChange(options.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-1.5">
      <Label>Options</Label>
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-1">
          <input
            value={opt.label}
            onChange={(e) => updateOption(i, "label", e.target.value)}
            placeholder="Label"
            className="flex-1 px-2 py-1 text-xs rounded border outline-none focus:border-[var(--payload-accent)]"
            style={{ background: "var(--payload-bg)", borderColor: "var(--payload-border)", color: "var(--payload-text)" }}
          />
          <input
            value={opt.value}
            onChange={(e) => updateOption(i, "value", e.target.value)}
            placeholder="value"
            className="flex-1 px-2 py-1 text-xs rounded border outline-none focus:border-[var(--payload-accent)] font-mono"
            style={{ background: "var(--payload-bg)", borderColor: "var(--payload-border)", color: "var(--payload-muted)" }}
          />
          <button
            onClick={() => removeOption(i)}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/20"
            style={{ color: "var(--payload-muted)" }}
          >
            <X size={10} />
          </button>
        </div>
      ))}
      <button onClick={addOption} className="flex items-center gap-1 text-xs transition-colors" style={{ color: "var(--payload-accent)" }}>
        <Plus size={10} />
        Add option
      </button>
    </div>
  );
}

export function FieldConfig() {
  const { blocks, activeBlockId, activeFieldId, updateField } = useBuilderStore();

  const block = blocks.find((b) => b.id === activeBlockId);
  const field = block?.fields.find((f) => f.id === activeFieldId);

  if (!field || !block) {
    return (
      <div className="p-4 text-xs text-center" style={{ color: "var(--payload-muted)" }}>
        Select a field to configure
      </div>
    );
  }

  const meta = getFieldMeta(field.type);

  function update(updates: Partial<FieldDefinition>) {
    updateField(block!.id, field!.id, updates);
  }

  return (
    <div className="p-3 space-y-3 panel-enter">
      <div className="flex items-center gap-2 pb-1 border-b" style={{ borderColor: "var(--payload-border)" }}>
        <div className={cn("w-5 h-5 rounded border flex items-center justify-center text-xs", meta?.color)}>
          {field.type.slice(0, 1).toUpperCase()}
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--payload-muted)" }}>
          {meta?.label ?? field.type} Field
        </p>
      </div>

      <Row>
        <Label>Name *</Label>
        <TextInput
          value={field.name}
          onChange={(v) => update({ name: v.replace(/\s/g, "_") })}
          placeholder="fieldName"
        />
        <p className="text-xs" style={{ color: "var(--payload-muted)" }}>camelCase, used as database key</p>
      </Row>

      <Row>
        <Label>Label</Label>
        <TextInput value={field.label ?? ""} onChange={(v) => update({ label: v })} placeholder="Field Label" />
      </Row>

      <div className="space-y-2 py-1">
        <Toggle checked={field.required ?? false} onChange={(v) => update({ required: v })} label="Required" />
        <Toggle checked={field.unique ?? false} onChange={(v) => update({ unique: v })} label="Unique" />
        <Toggle checked={field.localized ?? false} onChange={(v) => update({ localized: v })} label="Localized" />
      </div>

      {(field.type === "select" || field.type === "radio") && (
        <OptionsEditor options={field.options ?? []} onChange={(opts) => update({ options: opts })} />
      )}

      {field.type === "relationship" && (
        <>
          <Row>
            <Label>Relates To (collection slug)</Label>
            <TextInput value={field.relationTo ?? ""} onChange={(v) => update({ relationTo: v })} placeholder="posts" />
          </Row>
          <Toggle checked={field.hasMany ?? false} onChange={(v) => update({ hasMany: v })} label="Has Many" />
        </>
      )}

      {field.type === "array" && (
        <div className="flex gap-2">
          <Row>
            <Label>Min Rows</Label>
            <TextInput type="number" value={field.minRows ?? ""} onChange={(v) => update({ minRows: Number(v) || undefined })} placeholder="0" />
          </Row>
          <Row>
            <Label>Max Rows</Label>
            <TextInput type="number" value={field.maxRows ?? ""} onChange={(v) => update({ maxRows: Number(v) || undefined })} placeholder="∞" />
          </Row>
        </div>
      )}

      <div className="space-y-2 pt-1 border-t" style={{ borderColor: "var(--payload-border)" }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--payload-muted)" }}>Admin UI</p>
        <Row>
          <Label>Description</Label>
          <TextInput value={field.admin?.description ?? ""} onChange={(v) => update({ admin: { ...field.admin, description: v } })} placeholder="Help text shown below field" />
        </Row>
        <Row>
          <Label>Placeholder</Label>
          <TextInput value={field.admin?.placeholder ?? ""} onChange={(v) => update({ admin: { ...field.admin, placeholder: v } })} placeholder="Input placeholder..." />
        </Row>
        <Toggle checked={field.admin?.readOnly ?? false} onChange={(v) => update({ admin: { ...field.admin, readOnly: v } })} label="Read Only" />
        <Toggle checked={field.admin?.hidden ?? false} onChange={(v) => update({ admin: { ...field.admin, hidden: v } })} label="Hidden" />
      </div>
    </div>
  );
}
