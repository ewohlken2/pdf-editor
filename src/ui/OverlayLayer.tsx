import type { TextObject } from "../types/overlay";
import TextObjectView from "./TextObjectView";
import Guides from "./Guides";
import { useState } from "react";

type Props = {
  objects: TextObject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCommitText: (id: string, text: string) => void;
  onMove: (id: string, x: number, y: number) => void;
};

export default function OverlayLayer({
  objects,
  selectedId,
  onSelect,
  onCommitText,
  onMove
}: Props) {
  const [guides, setGuides] = useState<{ x?: number; y?: number }[]>([]);
  const snapX = objects.map((obj) => obj.box.x);
  const snapY = objects.map((obj) => obj.box.y);

  return (
    <div className="overlay-layer">
      <Guides guides={guides} />
      {objects.map((obj) => (
        <TextObjectView
          key={obj.id}
          object={obj}
          selected={obj.id === selectedId}
          onSelect={() => onSelect(obj.id)}
          onCommit={(text) => onCommitText(obj.id, text)}
          onMove={onMove}
          onDragGuides={setGuides}
          snapX={snapX}
          snapY={snapY}
        />
      ))}
    </div>
  );
}
