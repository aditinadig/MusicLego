import { DndContext, closestCenter } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import type { Chord } from "../types/music";
import { SortableChip } from "./SortableChip";

export function ProgressionLane({
  progression,
  onDragEnd,
  onAudition,
  onRemove,
}: {
  progression: Chord[];
  onDragEnd: (event: DragEndEvent) => void;
  onAudition: (ch: Chord) => void;
  onRemove: (id: string) => void;
}) {
  if (progression.length === 0) {
    return (
      <div style={{ padding: 14, borderRadius: 14, background: "#1f1f1f", opacity: 0.85 }}>
        Add chords from the left panel to start.
      </div>
    );
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={progression.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            padding: 12,
            borderRadius: 14,
            background: "#1f1f1f",
            minHeight: 64,
          }}
        >
          {progression.map((ch) => (
            <SortableChip
              key={ch.id}
              id={ch.id}
              label={ch.label}
              onAudition={() => onAudition(ch)}
              onRemove={() => onRemove(ch.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}