import { useEffect, useRef, useState } from "react";
import "./pdf/pdfWorker";
import { loadPdf, loadPage } from "./pdf/pdfLoader";
import PageViewport from "./ui/PageViewport";

export default function App() {
  const [page, setPage] = useState<import("pdfjs-dist").PDFPageProxy | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(600);

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
    setPage(firstPage);
  }

  return (
    <div className="app">
      <header className="app__header">PDF Editor</header>
      <main className="app__main" ref={containerRef}>
        <input type="file" accept="application/pdf" onChange={onFileChange} />
        <div className="page">
          <PageViewport page={page} width={containerWidth} />
        </div>
      </main>
    </div>
  );
}
