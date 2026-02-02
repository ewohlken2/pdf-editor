import type { TextObject } from "../types/overlay";
import type { PageViewport } from "pdfjs-dist";

export type PdfTextItem = {
  str: string;
  transform: [number, number, number, number, number, number];
  width: number;
  height: number;
  fontName?: string;
};

export function toTextObject(
  id: string,
  item: PdfTextItem,
  fontSizeFallback: number,
  viewport?: PageViewport
): TextObject {
  const [, , , , x, y] = item.transform;
  const fontSize = item.height || fontSizeFallback;
  if (viewport) {
    const { pageHeight, pageX, pageY } = viewport.rawDims;
    const scale = viewport.scale ?? 1;
    const flippedY = pageY + pageHeight - y;
    return {
      id,
      text: item.str,
      fontName: item.fontName,
      fontSize: fontSize * scale,
      box: {
        x: (x - pageX) * scale,
        y: (flippedY - fontSize) * scale,
        width: item.width * scale,
        height: fontSize * scale
      },
      baseline: flippedY * scale
    };
  }
  return {
    id,
    text: item.str,
    fontName: item.fontName,
    fontSize,
    box: {
      x,
      y: y - fontSize,
      width: item.width,
      height: fontSize
    },
    baseline: y
  };
}
