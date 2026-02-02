import type { TextObject } from "../types/overlay";
import TextObjectView from "./TextObjectView";

type Props = {
  objects: TextObject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCommitText: (id: string, text: string) => void;
};

export default function OverlayLayer({
  objects,
  selectedId,
  onSelect,
  onCommitText
}: Props) {
  return (
    <div className="overlay-layer">
      {objects.map((obj) => (
        <TextObjectView
          key={obj.id}
          object={obj}
          selected={obj.id === selectedId}
          onSelect={() => onSelect(obj.id)}
          onCommit={(text) => onCommitText(obj.id, text)}
        />
      ))}
    </div>
  );
}
