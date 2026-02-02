import { useRef, useState } from "react";
import type { TextObject } from "../types/overlay";
import { snapPosition } from "../utils/snap";

type Props = {
  object: TextObject;
  selected: boolean;
  onSelect: () => void;
  onCommit: (text: string) => void;
  onMove?: (id: string, x: number, y: number) => void;
  onDragGuides?: (guides: { x?: number; y?: number }[]) => void;
  snapX?: number[];
  snapY?: number[];
};

export default function TextObjectView({
  object,
  selected,
  onSelect,
  onCommit,
  onMove = () => {},
  onDragGuides = () => {},
  snapX = [],
  snapY = []
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(object.text);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  function commit() {
    onCommit(draft);
    setEditing(false);
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (editing) return;
    startRef.current = { x: event.clientX, y: event.clientY };
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!startRef.current) return;
    const dx = event.clientX - startRef.current.x;
    const dy = event.clientY - startRef.current.y;
    const nextX = snapPosition(object.box.x + dx, snapX, 4);
    const nextY = snapPosition(object.box.y + dy, snapY, 4);
    onDragGuides([{ x: nextX }, { y: nextY }]);
    onMove(object.id, nextX, nextY);
  }

  function onPointerUp() {
    startRef.current = null;
    onDragGuides([]);
  }

  return (
    <div
      className={`text-object ${selected ? "is-selected" : ""}`}
      style={{
        left: object.box.x,
        top: object.box.y,
        width: object.box.width,
        height: object.box.height,
        fontSize: object.fontSize,
        lineHeight: `${object.fontSize}px`
      }}
      onClick={onSelect}
      onDoubleClick={() => {
        setDraft(object.text);
        setEditing(true);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {editing ? (
        <input
          className="text-object__input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit();
          }}
          autoFocus
        />
      ) : (
        object.text
      )}
    </div>
  );
}
