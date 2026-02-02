import { useEffect, useRef } from "react";
import type { PDFPageProxy, ViewportParameters } from "pdfjs-dist";
import OverlayLayer from "./OverlayLayer";
import type { TextObject } from "../types/overlay";

type Props = {
  page: PDFPageProxy | null;
  width: number;
  overlay: TextObject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCommitText: (id: string, text: string) => void;
  onMove: (id: string, x: number, y: number) => void;
};

export default function PageViewport({
  page,
  width,
  overlay,
  selectedId,
  onSelect,
  onCommitText,
  onMove
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void; promise: Promise<unknown> } | null>(null);

  useEffect(() => {
    if (!page || !canvasRef.current) return;
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }
    const viewport = page.getViewport({ scale: 1 } as ViewportParameters);
    const scale = width / viewport.width;
    const scaled = page.getViewport({ scale } as ViewportParameters);

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = scaled.width;
    canvas.height = scaled.height;

    const renderTask = page.render({ canvasContext: context, viewport: scaled });
    renderTaskRef.current = renderTask;
    renderTask.promise
      .catch((error) => {
        const name = (error as { name?: string } | null)?.name;
        if (name !== "RenderingCancelledException") {
          console.error(error);
        }
      })
      .finally(() => {
        if (renderTaskRef.current === renderTask) {
          renderTaskRef.current = null;
        }
      });

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [page, width]);

  return (
    <div className="page-viewport">
      <canvas ref={canvasRef} />
      <OverlayLayer
        objects={overlay}
        selectedId={selectedId}
        onSelect={onSelect}
        onCommitText={onCommitText}
        onMove={onMove}
      />
    </div>
  );
}
