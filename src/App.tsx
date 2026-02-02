import { useEffect, useReducer, useRef, useState } from "react";
import "./pdf/pdfWorker";
import { loadPdf, loadPage } from "./pdf/pdfLoader";
import PageViewport from "./ui/PageViewport";
import { overlayReducer, initialOverlayState } from "./state/overlayStore";
import { toTextObject } from "./pdf/textExtraction";
import { History } from "./state/history";
import type { TextObject } from "./types/overlay";
import { clampWidthToViewport } from "./utils/layout";

export default function App() {
  const [page, setPage] = useState<import("pdfjs-dist").PDFPageProxy | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [overlayState, dispatch] = useReducer(
    overlayReducer,
    undefined,
    initialOverlayState
  );
  const [history] = useState(() => new History(initialOverlayState()));
  const [clipboard, setClipboard] = useState<TextObject | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      setContainerWidth(clampWidthToViewport(containerRef.current!.clientWidth));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const doc = await loadPdf(buffer);
    const firstPage = await loadPage(doc, 0);
    const baseViewport = firstPage.getViewport({ scale: 1 });
    const scale = containerWidth / baseViewport.width;
    const scaledViewport = firstPage.getViewport({ scale });
    const text = await firstPage.getTextContent();
    const objects = text.items
      .filter((item) => "str" in item)
      .map((item, index) =>
        toTextObject(`r${index}`, item as any, 12, scaledViewport)
      );

    const nextState = { objects, selectedId: null };
    history.push(nextState);
    dispatch({ type: "setObjects", objects });
    setPage(firstPage);
  }

  function handleReplace(id: string, text: string) {
    dispatch({ type: "replaceText", id, text });
    history.push({
      ...overlayState,
      objects: overlayState.objects.map((obj) =>
        obj.id === id ? { ...obj, text } : obj
      )
    });
  }

  function handleMove(id: string, x: number, y: number) {
    dispatch({ type: "move", id, x, y });
    history.push({
      ...overlayState,
      objects: overlayState.objects.map((obj) =>
        obj.id === id ? { ...obj, box: { ...obj.box, x, y } } : obj
      )
    });
  }

  function handleCopy() {
    const selected = overlayState.objects.find(
      (obj) => obj.id === overlayState.selectedId
    );
    if (selected) setClipboard({ ...selected });
  }

  function handlePaste() {
    if (!clipboard) return;
    const id = `ins-${Date.now()}`;
    const offset = 10;
    const next = {
      ...clipboard,
      id,
      box: {
        ...clipboard.box,
        x: clipboard.box.x + offset,
        y: clipboard.box.y + offset
      }
    };
    dispatch({ type: "insert", object: next });
    history.push({
      ...overlayState,
      objects: [...overlayState.objects, next]
    });
  }

  function undo() {
    const previous = history.undo();
    dispatch({ type: "setObjects", objects: previous.objects });
  }

  function redo() {
    const next = history.redo();
    dispatch({ type: "setObjects", objects: next.objects });
  }

  return (
    <div className="app">
      <header className="app__header">PDF Editor</header>
      <main className="app__main" ref={containerRef}>
        <div className="toolbar">
          <input type="file" accept="application/pdf" onChange={onFileChange} />
          <button onClick={handleCopy}>Copy</button>
          <button onClick={handlePaste}>Paste</button>
          <button onClick={undo}>Undo</button>
          <button onClick={redo}>Redo</button>
        </div>
        <div className="page">
          <PageViewport
            page={page}
            width={containerWidth}
            overlay={overlayState.objects}
            selectedId={overlayState.selectedId}
            onSelect={(id) => dispatch({ type: "select", id })}
            onCommitText={handleReplace}
            onMove={handleMove}
          />
        </div>
      </main>
    </div>
  );
}
