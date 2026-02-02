import { useState } from "react";
import type { TextObject } from "../types/overlay";

type Props = {
  object: TextObject;
  selected: boolean;
  onSelect: () => void;
  onCommit: (text: string) => void;
};

export default function TextObjectView({
  object,
  selected,
  onSelect,
  onCommit
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(object.text);

  function commit() {
    onCommit(draft);
    setEditing(false);
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
