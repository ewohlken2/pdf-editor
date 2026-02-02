import { getDocument } from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

export async function loadPdf(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  const task = getDocument({ data });
  return task.promise;
}

export async function loadPage(
  doc: PDFDocumentProxy,
  pageIndex: number
): Promise<PDFPageProxy> {
  return doc.getPage(pageIndex + 1);
}

export function toViewportScale(
  pageWidth: number,
  containerWidth: number,
  minWidth: number
) {
  const scale = containerWidth / pageWidth;
  const minScale = minWidth / pageWidth;
  return Math.min(scale, minScale);
}
