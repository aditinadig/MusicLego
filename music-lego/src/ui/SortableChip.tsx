import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function SortableChip({
  id,
  label,
  onAudition,
  onRemove,
}: {
  id: string;
  label: string;
  onAudition: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        padding: "10px 14px",
        borderRadius: 999,
        background: "#ff8c42",
        color: "white",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        opacity: isDragging ? 0.6 : 1,
        userSelect: "none",
        touchAction: "none",
      }}
      {...attributes}
      {...listeners}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onAudition(); }}
        style={{ all: "unset", cursor: "pointer", fontWeight: 800 }}
        title="Tap to audition"
      >
        {label}
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        style={{ all: "unset", cursor: "pointer", fontWeight: 900, opacity: 0.9 }}
        title="Remove"
      >
        ×
      </button>
    </div>
  );
}