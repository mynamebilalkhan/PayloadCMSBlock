"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useBuilderStore } from "@/block-builder/store/builder.store";
import { getFieldMeta } from "@/block-builder/lib/field-palette";
import { cn } from "@/block-builder/lib/utils";
import type { FieldDefinition } from "@/block-builder/types";
import {
  GripVertical, Trash2, AlertCircle,
  Type, Hash, Mail, AlignLeft, CheckSquare, ChevronDown, Circle,
  Upload, Link, FileText, List, Folder, Columns, Braces, Code,
  MapPin, Puzzle, Calendar,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Type, Hash, Mail, AlignLeft, CheckSquare, ChevronDown, Circle,
  Upload, Link, FileText, List, Folder, Columns, Braces, Code,
  MapPin, Puzzle, Calendar,
};

type Props = {
  field: FieldDefinition;
  blockId: string;
  isActive: boolean;
};

export function SortableFieldCard({ field, blockId, isActive }: Props) {
  const { setActiveField, removeField } = useBuilderStore();
  const meta = getFieldMeta(field.type);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const Icon = meta ? (ICON_MAP[meta.icon] ?? Type) : Type;
  const hasNameError = !field.name || field.name.trim() === "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "field-card group flex items-center gap-2 px-3 py-2.5 rounded border cursor-pointer select-none",
        isActive ? "active" : ""
      )}
      onClick={() => setActiveField(field.id)}
    >
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: "var(--payload-muted)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={12} />
      </button>

      <div
        className={cn(
          "flex-shrink-0 w-6 h-6 rounded border flex items-center justify-center",
          meta?.color ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"
        )}
      >
        <Icon size={11} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className="text-xs font-medium truncate"
            style={{ color: isActive ? "var(--payload-accent)" : "var(--payload-text)" }}
          >
            {field.name || <span style={{ color: "var(--payload-muted)" }}>unnamed</span>}
          </span>
          {field.required && (
            <span className="text-xs flex-shrink-0" style={{ color: "var(--payload-danger)" }} title="Required">
              *
            </span>
          )}
          {hasNameError && (
            <span title="Field name is required">
              <AlertCircle size={10} style={{ color: "var(--payload-danger)" }} />
            </span>
          )}
        </div>
        <span className="text-xs" style={{ color: "var(--payload-muted)" }}>
          {meta?.label ?? field.type}
          {field.label && field.label !== field.name ? ` — ${field.label}` : ""}
        </span>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); removeField(blockId, field.id); }}
        className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
        style={{ color: "var(--payload-muted)" }}
        title="Remove field"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}
