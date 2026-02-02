import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PageViewport from "../PageViewport";

type RenderTask = {
  promise: Promise<void>;
  cancel: () => void;
};

type PageLike = {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => RenderTask;
};

describe("PageViewport", () => {
  it("swallows render cancellations to avoid unhandled rejections", () => {
    const cancel = vi.fn();
    const catchSpy = vi.fn().mockReturnThis();
    const finallySpy = vi.fn().mockReturnThis();
    const renderTask: RenderTask = {
      promise: { catch: catchSpy, finally: finallySpy } as unknown as Promise<void>,
      cancel
    };
    const page: PageLike = {
      getViewport: ({ scale }) => ({ width: 100 * scale, height: 200 * scale }),
      render: () => renderTask
    };

    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = () => ({}) as CanvasRenderingContext2D;

    const { unmount } = render(
      <PageViewport
        page={page as any}
        width={400}
        overlay={[]}
        selectedId={null}
        onSelect={() => {}}
        onCommitText={() => {}}
        onMove={() => {}}
      />
    );

    expect(catchSpy).toHaveBeenCalled();

    HTMLCanvasElement.prototype.getContext = originalGetContext;
    unmount();
  });

  it("cancels an in-flight render before starting a new one", () => {
    const cancel = vi.fn();
    const renderTask: RenderTask = {
      promise: new Promise(() => {}),
      cancel
    };
    const page: PageLike = {
      getViewport: ({ scale }) => ({ width: 100 * scale, height: 200 * scale }),
      render: () => renderTask
    };

    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = () => ({}) as CanvasRenderingContext2D;

    const { rerender, unmount } = render(
      <PageViewport
        page={page as any}
        width={400}
        overlay={[]}
        selectedId={null}
        onSelect={() => {}}
        onCommitText={() => {}}
        onMove={() => {}}
      />
    );

    rerender(
      <PageViewport
        page={page as any}
        width={500}
        overlay={[]}
        selectedId={null}
        onSelect={() => {}}
        onCommitText={() => {}}
        onMove={() => {}}
      />
    );

    expect(cancel).toHaveBeenCalled();

    HTMLCanvasElement.prototype.getContext = originalGetContext;
    unmount();
  });
});
