import type { TextObject } from "../types/overlay";

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
  fontSizeFallback: number
): TextObject {
  const [, , , , x, y] = item.transform;
  const fontSize = item.height || fontSizeFallback;
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
