import { useEffect, useRef } from "react";
import type { PDFPageProxy, ViewportParameters } from "pdfjs-dist";

type Props = {
  page: PDFPageProxy | null;
  width: number;
};

export default function PageViewport({ page, width }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!page || !canvasRef.current) return;
    const viewport = page.getViewport({ scale: 1 } as ViewportParameters);
    const scale = width / viewport.width;
    const scaled = page.getViewport({ scale } as ViewportParameters);

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = scaled.width;
    canvas.height = scaled.height;

    page.render({ canvasContext: context, viewport: scaled });
  }, [page, width]);

  return <canvas ref={canvasRef} />;
}
