# Handoff

Date: 2026-02-02

## Status
Phase 1 implementation merged to `master`. Core features are in place:
- pdf.js single-page render to canvas
- overlay text objects with selection + inline editing
- drag + dotted guide snapping
- undo/redo history
- copy/paste
- basic styling
- tests via Vitest

Exporter remains deferred (Phase 2).

## Recent Changes
- Added Vite + React + TS scaffold with pdf.js and tests.
- Added README and `.gitignore` for node artifacts.
- `npm run dev` now uses `vite --host`.
- Added `index.html` at repo root to fix Vite 404 on `/`.
- Updated Vitest config to ignore `.worktrees/**` to avoid duplicate React test failures.
- Added AGENTS note about Vitest CLI usage (in `AGENTS.md`).

## How to Run
```
npm install
npm run dev
```
Open:
- Windows: `http://localhost:5173/`
- WSL: `http://10.255.255.254:5173/`

## Tests
```
npm test -- --run
```
Note: pdf.js emits a Node warning about using the legacy build; browser runtime is unaffected.

## Open Items / Next Steps
- Phase 2: PDF exporter (replay operations to PDF output)
- Multi-page rendering / navigation
- Improve snapping (baselines/edges) and guide heuristics
- Font fallback warnings and overflow handling

## Files of Interest
- `src/App.tsx`
- `src/ui/PageViewport.tsx`
- `src/ui/OverlayLayer.tsx`
- `src/ui/TextObjectView.tsx`
- `src/state/overlayStore.ts`
- `src/state/history.ts`
- `src/pdf/pdfLoader.ts`
- `src/pdf/textExtraction.ts`
- `docs/plans/2026-02-02-pdf-editor-phase-1-implementation.md`
