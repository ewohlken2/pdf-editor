export type Box = { x: number; y: number; width: number; height: number };

export type TextObject = {
  id: string;
  text: string;
  fontName?: string;
  fontSize: number;
  box: Box;
  baseline: number;
  sourceRunId?: string;
};
