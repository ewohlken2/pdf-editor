import { useEffect, useReducer, useRef, useState } from "react";
import "./pdf/pdfWorker";
import { loadPdf, loadPage } from "./pdf/pdfLoader";
import PageViewport from "./ui/PageViewport";
import { overlayReducer, initialOverlayState } from "./state/overlayStore";
import { toTextObject } from "./pdf/textExtraction";

export default function App() {
  const [page, setPage] = useState<import("pdfjs-dist").PDFPageProxy | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [overlayState, dispatch] = useReducer(
    overlayReducer,
    undefined,
    initialOverlayState
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      setContainerWidth(containerRef.current!.clientWidth);
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
    const text = await firstPage.getTextContent();
    const objects = text.items
      .filter((item) => "str" in item)
      .map((item, index) =>
        toTextObject(`r${index}`, item as any, 12)
      );

    dispatch({ type: "setObjects", objects });
    setPage(firstPage);
  }

  return (
    <div className="app">
      <header className="app__header">PDF Editor</header>
      <main className="app__main" ref={containerRef}>
        <input type="file" accept="application/pdf" onChange={onFileChange} />
        <div className="page">
          <PageViewport
            page={page}
            width={containerWidth}
            overlay={overlayState.objects}
            selectedId={overlayState.selectedId}
            onSelect={(id) => dispatch({ type: "select", id })}
            onCommitText={(id, text) =>
              dispatch({ type: "replaceText", id, text })
            }
          />
        </div>
      </main>
    </div>
  );
}
