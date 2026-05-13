"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { useBuilderStore } from "@/block-builder/store/builder.store";
import { SortableFieldCard } from "./SortableFieldCard";
import { GripVertical, Layers } from "lucide-react";

export function BuilderCanvas() {
  const {
    blocks,
    activeBlockId,
    activeFieldId,
    reorderFields,
  } = useBuilderStore();

  const activeBlock = blocks.find((b) => b.id === activeBlockId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !activeBlock) return;

    const fromIdx = activeBlock.fields.findIndex((f) => f.id === active.id);
    const toIdx = activeBlock.fields.findIndex((f) => f.id === over.id);
    if (fromIdx >= 0 && toIdx >= 0) {
      reorderFields(activeBlock.id, fromIdx, toIdx);
    }
  }

  if (!activeBlock) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center gap-3"
        style={{ color: "var(--payload-muted)" }}
      >
        <Layers size={40} style={{ opacity: 0.2 }} />
        <p className="text-sm">Select a block from the left panel</p>
        <p className="text-xs opacity-60">or create a new one to get started</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Block header */}
      <div
        className="px-4 py-3 border-b flex-shrink-0"
        style={{
          background: "var(--payload-surface)",
          borderColor: "var(--payload-border)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: "var(--payload-accent)" }}
          />
          <h2
            className="text-sm font-semibold"
            style={{ color: "var(--payload-text)" }}
          >
            {activeBlock.slug || "unnamed"}
          </h2>
          {activeBlock.interfaceName && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: "var(--payload-surface-2)",
                color: "var(--payload-muted)",
              }}
            >
              {activeBlock.interfaceName}
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5" style={{ color: "var(--payload-muted)" }}>
          {activeBlock.fields.length} field
          {activeBlock.fields.length !== 1 ? "s" : ""} — drag to reorder
        </p>
      </div>

      {/* Field list */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeBlock.fields.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 border border-dashed rounded-lg gap-2"
            style={{
              borderColor: "var(--payload-border-hover)",
              color: "var(--payload-muted)",
            }}
          >
            <GripVertical size={24} style={{ opacity: 0.3 }} />
            <p className="text-sm">No fields yet</p>
            <p className="text-xs opacity-60">
              Click a field type in the left panel to add it
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <SortableContext
              items={activeBlock.fields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1.5">
                {activeBlock.fields.map((field) => (
                  <SortableFieldCard
                    key={field.id}
                    field={field}
                    blockId={activeBlock.id}
                    isActive={field.id === activeFieldId}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
