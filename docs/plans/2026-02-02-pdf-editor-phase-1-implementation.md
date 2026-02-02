# PDF Editor Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a client-only PDF editor that renders pages and allows text selection, inline editing, copy/paste, undo/redo, and drag with dotted alignment guides; exporter deferred to phase 2.

**Architecture:** Use pdf.js to render pages to canvas and extract text runs. Maintain an overlay model derived from operations (replace/move/insert/delete), render overlay text objects in a positioned layer, and track edits with an undo/redo history stack. Guides are computed during drag by comparing edges/baselines to nearby objects and page bounds.

**Tech Stack:** Vite + React + TypeScript, pdfjs-dist, Vitest + @testing-library/react for unit/UI tests.

---

### Task 1: Scaffold the app and wire pdf.js worker

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

**Step 1: Write the failing test**

```ts
// src/__tests__/smoke.test.tsx
import { render, screen } from "@testing-library/react";
import App from "../App";

test("renders PDF Editor header", () => {
  render(<App />);
  expect(screen.getByText("PDF Editor")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --runTestsByPath src/__tests__/smoke.test.tsx`
Expected: FAIL (missing App/module setup)

**Step 3: Write minimal implementation**

```json
// package.json
{
  "name": "pdf-editor",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "pdfjs-dist": "^4.10.38",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.1",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^24.1.0",
    "typescript": "^5.6.2",
    "vite": "^5.4.2",
    "vitest": "^2.1.1"
  }
}
```

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: [],
    globals: true
  }
});
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

```tsx
// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

```tsx
// src/App.tsx
export default function App() {
  return (
    <div className="app">
      <header className="app__header">PDF Editor</header>
      <main className="app__main">
        <p>Phase 1: loader + overlay editing + history</p>
      </main>
    </div>
  );
}
```

```css
/* src/styles.css */
:root {
  color: #111;
  background: #f7f4ef;
  font-family: "IBM Plex Sans", system-ui, sans-serif;
}

.app {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr;
}

.app__header {
  padding: 16px 24px;
  font-size: 20px;
  border-bottom: 1px solid #e0d8cc;
}

.app__main {
  padding: 24px;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --runTestsByPath src/__tests__/smoke.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add package.json vite.config.ts tsconfig.json src/main.tsx src/App.tsx src/styles.css src/__tests__/smoke.test.tsx
git commit -m "chore: scaffold app and vitest"
```

---

### Task 2: PDF loading + canvas rendering for a single page

**Files:**
- Create: `src/pdf/pdfWorker.ts`
- Create: `src/pdf/pdfLoader.ts`
- Create: `src/ui/PageViewport.tsx`
- Modify: `src/App.tsx`
- Test: `src/pdf/__tests__/pdfLoader.test.ts`

**Step 1: Write the failing test**

```ts
// src/pdf/__tests__/pdfLoader.test.ts
import { describe, expect, it } from "vitest";
import { toViewportScale } from "../pdfLoader";

describe("toViewportScale", () => {
  it("scales to fit width", () => {
    expect(toViewportScale(612, 800, 306)).toBeCloseTo(0.5, 5);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --runTestsByPath src/pdf/__tests__/pdfLoader.test.ts`
Expected: FAIL (missing module)

**Step 3: Write minimal implementation**

```ts
// src/pdf/pdfWorker.ts
import { GlobalWorkerOptions } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerSrc;
```

```ts
// src/pdf/pdfLoader.ts
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
  minScale: number
) {
  const scale = containerWidth / pageWidth;
  return Math.max(scale, minScale);
}
```

```tsx
// src/ui/PageViewport.tsx
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
```

```tsx
// src/App.tsx
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
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --runTestsByPath src/pdf/__tests__/pdfLoader.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pdf/pdfWorker.ts src/pdf/pdfLoader.ts src/ui/PageViewport.tsx src/App.tsx src/pdf/__tests__/pdfLoader.test.ts
git commit -m "feat: load pdf and render first page"
```

---

### Task 3: Extract text runs into overlay objects

**Files:**
- Create: `src/pdf/textExtraction.ts`
- Create: `src/types/overlay.ts`
- Test: `src/pdf/__tests__/textExtraction.test.ts`

**Step 1: Write the failing test**

```ts
// src/pdf/__tests__/textExtraction.test.ts
import { describe, expect, it } from "vitest";
import { toTextObject } from "../textExtraction";

it("builds a text object with bbox", () => {
  const item = {
    str: "Hello",
    transform: [1, 0, 0, 1, 100, 200],
    width: 50,
    height: 12
  } as const;
  const obj = toTextObject("r1", item, 1);
  expect(obj.text).toBe("Hello");
  expect(obj.box.x).toBe(100);
  expect(obj.box.y).toBe(200 - 12);
  expect(obj.box.width).toBe(50);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --runTestsByPath src/pdf/__tests__/textExtraction.test.ts`
Expected: FAIL (missing module)

**Step 3: Write minimal implementation**

```ts
// src/types/overlay.ts
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
```

```ts
// src/pdf/textExtraction.ts
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
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --runTestsByPath src/pdf/__tests__/textExtraction.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types/overlay.ts src/pdf/textExtraction.ts src/pdf/__tests__/textExtraction.test.ts
git commit -m "feat: extract pdf text into overlay objects"
```

---

### Task 4: Render overlay layer with selection and inline edit

**Files:**
- Create: `src/state/overlayStore.ts`
- Create: `src/ui/OverlayLayer.tsx`
- Create: `src/ui/TextObjectView.tsx`
- Modify: `src/ui/PageViewport.tsx`
- Modify: `src/App.tsx`
- Test: `src/state/__tests__/overlayStore.test.ts`

**Step 1: Write the failing test**

```ts
// src/state/__tests__/overlayStore.test.ts
import { describe, expect, it } from "vitest";
import { overlayReducer, initialOverlayState } from "../overlayStore";

it("replaces text", () => {
  const state = initialOverlayState();
  const next = overlayReducer(state, {
    type: "replaceText",
    id: "t1",
    text: "Updated"
  });
  expect(next.objects[0]?.text).toBe("Updated");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --runTestsByPath src/state/__tests__/overlayStore.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// src/state/overlayStore.ts
import type { TextObject } from "../types/overlay";

export type OverlayAction =
  | { type: "setObjects"; objects: TextObject[] }
  | { type: "select"; id: string | null }
  | { type: "replaceText"; id: string; text: string };

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
    default:
      return state;
  }
}
```

```tsx
// src/ui/TextObjectView.tsx
import { useState } from "react";
import type { TextObject } from "../types/overlay";

type Props = {
  object: TextObject;
  selected: boolean;
  onSelect: () => void;
  onCommit: (text: string) => void;
};

export default function TextObjectView({
  object,
  selected,
  onSelect,
  onCommit
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(object.text);

  function commit() {
    onCommit(draft);
    setEditing(false);
  }

  return (
    <div
      className={`text-object ${selected ? "is-selected" : ""}`}
      style={{
        left: object.box.x,
        top: object.box.y,
        width: object.box.width,
        height: object.box.height,
        fontSize: object.fontSize,
        lineHeight: `${object.fontSize}px`
      }}
      onClick={onSelect}
      onDoubleClick={() => {
        setDraft(object.text);
        setEditing(true);
      }}
    >
      {editing ? (
        <input
          className="text-object__input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit();
          }}
          autoFocus
        />
      ) : (
        object.text
      )}
    </div>
  );
}
```

```tsx
// src/ui/OverlayLayer.tsx
import type { TextObject } from "../types/overlay";
import TextObjectView from "./TextObjectView";

type Props = {
  objects: TextObject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCommitText: (id: string, text: string) => void;
};

export default function OverlayLayer({
  objects,
  selectedId,
  onSelect,
  onCommitText
}: Props) {
  return (
    <div className="overlay-layer">
      {objects.map((obj) => (
        <TextObjectView
          key={obj.id}
          object={obj}
          selected={obj.id === selectedId}
          onSelect={() => onSelect(obj.id)}
          onCommit={(text) => onCommitText(obj.id, text)}
        />
      ))}
    </div>
  );
}
```

```tsx
// src/ui/PageViewport.tsx
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
};

export default function PageViewport({
  page,
  width,
  overlay,
  selectedId,
  onSelect,
  onCommitText
}: Props) {
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

  return (
    <div className="page-viewport">
      <canvas ref={canvasRef} />
      <OverlayLayer
        objects={overlay}
        selectedId={selectedId}
        onSelect={onSelect}
        onCommitText={onCommitText}
      />
    </div>
  );
}
```

```tsx
// src/App.tsx
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
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --runTestsByPath src/state/__tests__/overlayStore.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/state/overlayStore.ts src/ui/OverlayLayer.tsx src/ui/TextObjectView.tsx src/ui/PageViewport.tsx src/App.tsx src/state/__tests__/overlayStore.test.ts
git commit -m "feat: overlay selection and inline text editing"
```

---

### Task 5: Dragging with dotted alignment guides + snapping

**Files:**
- Create: `src/utils/snap.ts`
- Create: `src/ui/Guides.tsx`
- Modify: `src/ui/TextObjectView.tsx`
- Modify: `src/styles.css`
- Test: `src/utils/__tests__/snap.test.ts`

**Step 1: Write the failing test**

```ts
// src/utils/__tests__/snap.test.ts
import { describe, expect, it } from "vitest";
import { snapPosition } from "../snap";

it("snaps to nearby x edge", () => {
  const result = snapPosition(100, [98, 200], 4);
  expect(result).toBe(98);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --runTestsByPath src/utils/__tests__/snap.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// src/utils/snap.ts
export function snapPosition(
  value: number,
  candidates: number[],
  threshold: number
) {
  for (const candidate of candidates) {
    if (Math.abs(value - candidate) <= threshold) return candidate;
  }
  return value;
}
```

```tsx
// src/ui/Guides.tsx
type Guide = { x?: number; y?: number };

type Props = {
  guides: Guide[];
};

export default function Guides({ guides }: Props) {
  return (
    <div className="guides">
      {guides.map((guide, index) => (
        <div
          key={index}
          className="guide"
          style={{
            left: guide.x,
            top: guide.y
          }}
        />
      ))}
    </div>
  );
}
```

```tsx
// src/ui/TextObjectView.tsx
import { useRef, useState } from "react";
import type { TextObject } from "../types/overlay";
import { snapPosition } from "../utils/snap";

type Props = {
  object: TextObject;
  selected: boolean;
  onSelect: () => void;
  onCommit: (text: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onDragGuides: (guides: { x?: number; y?: number }[]) => void;
  snapX: number[];
  snapY: number[];
};

export default function TextObjectView({
  object,
  selected,
  onSelect,
  onCommit,
  onMove,
  onDragGuides,
  snapX,
  snapY
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(object.text);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  function commit() {
    onCommit(draft);
    setEditing(false);
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (editing) return;
    startRef.current = { x: event.clientX, y: event.clientY };
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!startRef.current) return;
    const dx = event.clientX - startRef.current.x;
    const dy = event.clientY - startRef.current.y;
    const nextX = snapPosition(object.box.x + dx, snapX, 4);
    const nextY = snapPosition(object.box.y + dy, snapY, 4);
    onDragGuides([{ x: nextX }, { y: nextY }]);
    onMove(object.id, nextX, nextY);
  }

  function onPointerUp() {
    startRef.current = null;
    onDragGuides([]);
  }

  return (
    <div
      className={`text-object ${selected ? "is-selected" : ""}`}
      style={{
        left: object.box.x,
        top: object.box.y,
        width: object.box.width,
        height: object.box.height,
        fontSize: object.fontSize,
        lineHeight: `${object.fontSize}px`
      }}
      onClick={onSelect}
      onDoubleClick={() => {
        setDraft(object.text);
        setEditing(true);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {editing ? (
        <input
          className="text-object__input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit();
          }}
          autoFocus
        />
      ) : (
        object.text
      )}
    </div>
  );
}
```

```css
/* src/styles.css */
.page-viewport {
  position: relative;
  display: inline-block;
}

.overlay-layer {
  position: absolute;
  inset: 0;
}

.text-object {
  position: absolute;
  cursor: move;
}

.text-object.is-selected {
  outline: 1px dashed #444;
}

.text-object__input {
  width: 100%;
  height: 100%;
  border: 1px solid #444;
  background: #fff;
  font: inherit;
}

.guides {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.guide {
  position: absolute;
  width: 1px;
  height: 100%;
  border-left: 1px dotted #222;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --runTestsByPath src/utils/__tests__/snap.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/snap.ts src/ui/Guides.tsx src/ui/TextObjectView.tsx src/styles.css src/utils/__tests__/snap.test.ts
git commit -m "feat: drag snapping and dotted guides"
```

---

### Task 6: Undo/redo history for replace and move operations

**Files:**
- Create: `src/state/history.ts`
- Modify: `src/state/overlayStore.ts`
- Modify: `src/ui/OverlayLayer.tsx`
- Modify: `src/App.tsx`
- Test: `src/state/__tests__/history.test.ts`

**Step 1: Write the failing test**

```ts
// src/state/__tests__/history.test.ts
import { describe, expect, it } from "vitest";
import { History } from "../history";

it("undoes last action", () => {
  const history = new History<number>(0);
  history.push(1);
  history.push(2);
  expect(history.undo()).toBe(1);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --runTestsByPath src/state/__tests__/history.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// src/state/history.ts
export class History<T> {
  private past: T[] = [];
  private present: T;
  private future: T[] = [];

  constructor(initial: T) {
    this.present = initial;
  }

  current() {
    return this.present;
  }

  push(next: T) {
    this.past.push(this.present);
    this.present = next;
    this.future = [];
  }

  undo() {
    const previous = this.past.pop();
    if (previous === undefined) return this.present;
    this.future.unshift(this.present);
    this.present = previous;
    return this.present;
  }

  redo() {
    const next = this.future.shift();
    if (next === undefined) return this.present;
    this.past.push(this.present);
    this.present = next;
    return this.present;
  }
}
```

```ts
// src/state/overlayStore.ts
import type { TextObject } from "../types/overlay";

export type OverlayAction =
  | { type: "setObjects"; objects: TextObject[] }
  | { type: "select"; id: string | null }
  | { type: "replaceText"; id: string; text: string }
  | { type: "move"; id: string; x: number; y: number };

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
    default:
      return state;
  }
}
```

```tsx
// src/ui/OverlayLayer.tsx
import type { TextObject } from "../types/overlay";
import TextObjectView from "./TextObjectView";
import Guides from "./Guides";
import { useState } from "react";

type Props = {
  objects: TextObject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCommitText: (id: string, text: string) => void;
  onMove: (id: string, x: number, y: number) => void;
};

export default function OverlayLayer({
  objects,
  selectedId,
  onSelect,
  onCommitText,
  onMove
}: Props) {
  const [guides, setGuides] = useState<{ x?: number; y?: number }[]>([]);
  const snapX = objects.map((obj) => obj.box.x);
  const snapY = objects.map((obj) => obj.box.y);

  return (
    <div className="overlay-layer">
      <Guides guides={guides} />
      {objects.map((obj) => (
        <TextObjectView
          key={obj.id}
          object={obj}
          selected={obj.id === selectedId}
          onSelect={() => onSelect(obj.id)}
          onCommit={(text) => onCommitText(obj.id, text)}
          onMove={onMove}
          onDragGuides={setGuides}
          snapX={snapX}
          snapY={snapY}
        />
      ))}
    </div>
  );
}
```

```tsx
// src/App.tsx
import { useEffect, useReducer, useRef, useState } from "react";
import "./pdf/pdfWorker";
import { loadPdf, loadPage } from "./pdf/pdfLoader";
import PageViewport from "./ui/PageViewport";
import { overlayReducer, initialOverlayState } from "./state/overlayStore";
import { toTextObject } from "./pdf/textExtraction";
import { History } from "./state/history";

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

    const nextState = { objects, selectedId: null };
    history.push(nextState);
    dispatch({ type: "setObjects", objects });
    setPage(firstPage);
  }

  function handleReplace(id: string, text: string) {
    dispatch({ type: "replaceText", id, text });
    history.push({ ...overlayState, objects: overlayState.objects.map((obj) =>
      obj.id === id ? { ...obj, text } : obj
    )});
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
          />
        </div>
      </main>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --runTestsByPath src/state/__tests__/history.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/state/history.ts src/state/overlayStore.ts src/ui/OverlayLayer.tsx src/App.tsx src/state/__tests__/history.test.ts
git commit -m "feat: undo redo history"
```

---

### Task 7: Basic copy/paste for text objects

**Files:**
- Modify: `src/state/overlayStore.ts`
- Modify: `src/App.tsx`
- Test: `src/state/__tests__/overlayStore.test.ts`

**Step 1: Write the failing test**

```ts
// src/state/__tests__/overlayStore.test.ts
import { describe, expect, it } from "vitest";
import { overlayReducer } from "../overlayStore";

it("inserts a new object", () => {
  const next = overlayReducer(
    { objects: [], selectedId: null },
    {
      type: "insert",
      object: {
        id: "new",
        text: "Paste",
        fontSize: 12,
        box: { x: 10, y: 10, width: 50, height: 12 },
        baseline: 22
      }
    }
  );
  expect(next.objects).toHaveLength(1);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --runTestsByPath src/state/__tests__/overlayStore.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
// src/state/overlayStore.ts
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
```

```tsx
// src/App.tsx
import { useEffect, useReducer, useRef, useState } from "react";
import "./pdf/pdfWorker";
import { loadPdf, loadPage } from "./pdf/pdfLoader";
import PageViewport from "./ui/PageViewport";
import { overlayReducer, initialOverlayState } from "./state/overlayStore";
import { toTextObject } from "./pdf/textExtraction";
import { History } from "./state/history";
import type { TextObject } from "./types/overlay";

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
          />
        </div>
      </main>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --runTestsByPath src/state/__tests__/overlayStore.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/state/overlayStore.ts src/App.tsx src/state/__tests__/overlayStore.test.ts
git commit -m "feat: copy paste overlay objects"
```

---

### Task 8: UI polish for overlay visibility and selection

**Files:**
- Modify: `src/styles.css`

**Step 1: Write the failing test**

```ts
// src/__tests__/style.test.ts
import { describe, expect, it } from "vitest";
import fs from "node:fs";

it("includes selection style", () => {
  const css = fs.readFileSync("src/styles.css", "utf-8");
  expect(css).toContain(".text-object.is-selected");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --runTestsByPath src/__tests__/style.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```css
/* src/styles.css */
.page {
  margin-top: 16px;
  border: 1px solid #e0d8cc;
  background: #fff;
  padding: 12px;
}

.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --runTestsByPath src/__tests__/style.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/styles.css src/__tests__/style.test.ts
git commit -m "style: basic page chrome"
```

---

### Phase 2 (Deferred): Exporter
- Not included in this plan per request.

