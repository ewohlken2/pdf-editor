import type { TextObject } from "../types/overlay";

export type OverlayAction =
  | { type: "setObjects"; objects: TextObject[] }
  | { type: "select"; id: string | null }
  | { type: "replaceText"; id: string; text: string }
  | { type: "move"; id: string; x: number; y: number }
  | { type: "insert"; object: TextObject };

export type OverlayState = {
  objects: TextObject[];
  selectedId: string | null;
};

export function initialOverlayState(): OverlayState {
  return { objects: [], selectedId: null };
}

export function overlayReducer(
  state: OverlayState,
  action: OverlayAction
): OverlayState {
  switch (action.type) {
    case "setObjects":
      return { ...state, objects: action.objects };
    case "select":
      return { ...state, selectedId: action.id };
    case "replaceText":
      return {
        ...state,
        objects: state.objects.map((obj) =>
          obj.id === action.id ? { ...obj, text: action.text } : obj
        )
      };
    case "move":
      return {
        ...state,
        objects: state.objects.map((obj) =>
          obj.id === action.id
            ? { ...obj, box: { ...obj.box, x: action.x, y: action.y } }
            : obj
        )
      };
    case "insert":
      return { ...state, objects: [...state.objects, action.object] };
    default:
      return state;
  }
}
