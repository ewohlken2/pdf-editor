# PDF Editor (Phase 1)

Browser-only PDF editor focused on high-fidelity text edits. Phase 1 includes rendering, overlay text editing, drag with dotted guides, copy/paste, and undo/redo. Export is deferred to phase 2.

## Prerequisites
- Node.js 18+ (20+ recommended)

## Setup
```
npm install
```

## Run
```
npm run dev
```
Open `http://localhost:5173/`.

## Tests
```
npm test -- --run
```
To run a single test:
```
npm test -- --run src/path/to/test.ts
```

## Notes
- `ResizeObserver` is polyfilled for tests in `src/test/setup.ts`.
- pdf.js emits a warning in Node about using the legacy build; runtime behavior in the browser is unaffected.
