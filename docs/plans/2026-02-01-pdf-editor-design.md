# PDF Editor Design (Browser-Only, High-Fidelity)

## Summary
A client-only PDF editor that preserves the original look of text while enabling basic edits: text editing, copy/paste, undo/redo, and precise drag-and-drop with dotted line placement guides. The system renders PDF pages to canvas and layers an interactive overlay where edits are captured as a delta and replayed on export.

## Goals
- Preserve the original visual appearance as closely as possible.
- Support text editing, copy/paste, undo/redo, and precise placement.
- Provide dotted guide lines during drag for alignment and spatial accuracy.
- Keep the app fully client-side (no backend required).

## Non-Goals
- Full PDF object editing (editing vector paths or images).
- Rich layout reflow or full redesign workflows.
- Real-time collaboration.

## Recommended Approach
Render each page to a canvas and overlay interactive elements that map to the PDF coordinate system. Edits are stored as operations (delta) and reapplied to generate an exported PDF. This supports responsive UI interactions while preserving fidelity.

## Architecture
The system is split into five modules:
1) PDF Loader: loads PDF, extracts page sizes, fonts, and text runs with positions.
2) Renderer: rasterizes pages into canvases and manages zoom/tiling.
3) Overlay Editor: interactive text objects and drag handles in page coordinates.
4) Edit History: operations-based undo/redo stack.
5) Exporter: replays edits to draw updated text at precise coordinates.

Dotted guide lines are rendered by the overlay during drag events, extending from object edges to page bounds or nearby guides.

## Components & Interaction Flow
- PageViewport: container for canvas + OverlayLayer.
- OverlayLayer: stores TextObjects that mirror PDF text runs (bbox, baseline, font metadata).
- Inspector Panel: editable fields for font/size/position.
- Toolbar: text edit, select, copy/paste, undo/redo, zoom, snapping toggle.
- Guides & Rulers: optional rulers; dotted lines snap to edges and baselines.

Interaction flow:
- Select: click a text run to highlight and show handles.
- Edit: double-click to edit text inline; commits a replace op.
- Drag: move object; dotted guides appear with snap hints.
- Copy/Paste: serialize object metadata and insert a new object with offset.
- Undo/Redo: invert operations for reliable state reversal.

## Data Flow & State Model
State is split into a read-only base model and a mutable overlay view.

Base model includes page dimensions, embedded fonts, and text runs with coordinates.
Overlay view is derived from an ordered list of operations:
- replaceText(runId, newText)
- moveObject(objectId, dx, dy)
- insertObject(text, fontRef, x, y, box)
- deleteObject(objectId)

Undo/redo is implemented by reversing operations. Overlay objects map either to original runs (by runId) or inserted objects (new IDs).

## Error Handling & Fidelity Strategy
- Mark non-editable content as locked (paths, images, outlined text).
- Warn when font mapping fails; apply fallback with a visible indicator.
- Detect overflow: allow scale-to-fit, expand box, or clip.
- Allow off-page placement but warn to avoid accidental loss.
- Export with warning summary if fonts or glyphs are missing.

## Testing & Validation
Automated tests:
- Text extraction accuracy (run strings + bbox positions).
- Overlay alignment at different zoom levels.
- Drag/guide behavior and snapping thresholds.
- Undo/redo round-trip correctness.
- Export positional fidelity (visual or positional diff).

Manual checks:
- Multi-font PDFs render consistently.
- Overflow handling behaviors are correct.
- Exported PDFs render in multiple viewers.

## Next Steps
- Confirm the tech stack (e.g., pdf.js for rendering/extraction).
- Create implementation plan and milestone breakdown.
- Prototype overlay drag guides on the sample PDF.
