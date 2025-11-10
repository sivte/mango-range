import { renderHook } from "@testing-library/react";
import { useRef } from "react";
import { useKeyboardNavigation, KeyMapping } from "./useKeyboardNavigation";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("useKeyboardNavigation", () => {
  let element1: HTMLButtonElement;
  let element2: HTMLButtonElement;
  let mockAction: (elementIndex: number, event: KeyboardEvent) => void;

  beforeEach(() => {
    element1 = document.createElement("button");
    element2 = document.createElement("button");
    document.body.appendChild(element1);
    document.body.appendChild(element2);

    mockAction = vi.fn<(elementIndex: number, event: KeyboardEvent) => void>();
  });

  afterEach(() => {
    document.body.removeChild(element1);
    document.body.removeChild(element2);
    vi.clearAllMocks();
  });

  it("should call key action when mapped key is pressed", () => {
    const { result } = renderHook(() => {
      const ref1 = useRef<HTMLButtonElement>(element1);
      const ref2 = useRef<HTMLButtonElement>(element2);

      const keyMappings: KeyMapping = {
        ArrowUp: mockAction,
      };

      useKeyboardNavigation({
        elementRefs: [ref1, ref2],
        keyMappings,
        disabled: false,
        enableTabNavigation: true,
      });

      return { ref1, ref2 };
    });

    const event = new KeyboardEvent("keydown", { key: "ArrowUp" });
    element1.dispatchEvent(event);

    expect(mockAction).toHaveBeenCalledTimes(1);
    expect(mockAction).toHaveBeenCalledWith(0, expect.any(KeyboardEvent));
  });

  it("should pass correct element index to action", () => {
    const { result } = renderHook(() => {
      const ref1 = useRef<HTMLButtonElement>(element1);
      const ref2 = useRef<HTMLButtonElement>(element2);

      const keyMappings: KeyMapping = {
        ArrowDown: mockAction,
      };

      useKeyboardNavigation({
        elementRefs: [ref1, ref2],
        keyMappings,
      });

      return { ref1, ref2 };
    });

    const event = new KeyboardEvent("keydown", { key: "ArrowDown" });
    element2.dispatchEvent(event);

    expect(mockAction).toHaveBeenCalledWith(1, expect.any(KeyboardEvent));
  });

  it("should focus next element on Tab", () => {
    const { result } = renderHook(() => {
      const ref1 = useRef<HTMLButtonElement>(element1);
      const ref2 = useRef<HTMLButtonElement>(element2);

      useKeyboardNavigation({
        elementRefs: [ref1, ref2],
        keyMappings: {},
        enableTabNavigation: true,
      });

      return { ref1, ref2 };
    });

    element1.focus();
    expect(document.activeElement).toBe(element1);

    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
    Object.defineProperty(event, "shiftKey", { value: false });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    element1.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(document.activeElement).toBe(element2);
  });

  it("should focus previous element on Shift+Tab", () => {
    const { result } = renderHook(() => {
      const ref1 = useRef<HTMLButtonElement>(element1);
      const ref2 = useRef<HTMLButtonElement>(element2);

      useKeyboardNavigation({
        elementRefs: [ref1, ref2],
        keyMappings: {},
        enableTabNavigation: true,
      });

      return { ref1, ref2 };
    });

    element2.focus();
    expect(document.activeElement).toBe(element2);

    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
    Object.defineProperty(event, "shiftKey", { value: true });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    element2.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(document.activeElement).toBe(element1);
  });

  it("should not focus next element when Tab is pressed on last element", () => {
    const { result } = renderHook(() => {
      const ref1 = useRef<HTMLButtonElement>(element1);
      const ref2 = useRef<HTMLButtonElement>(element2);

      useKeyboardNavigation({
        elementRefs: [ref1, ref2],
        keyMappings: {},
        enableTabNavigation: true,
      });

      return { ref1, ref2 };
    });

    element2.focus();

    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
    Object.defineProperty(event, "shiftKey", { value: false });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    element2.dispatchEvent(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it("should not focus previous element when Shift+Tab is pressed on first element", () => {
    const { result } = renderHook(() => {
      const ref1 = useRef<HTMLButtonElement>(element1);
      const ref2 = useRef<HTMLButtonElement>(element2);

      useKeyboardNavigation({
        elementRefs: [ref1, ref2],
        keyMappings: {},
        enableTabNavigation: true,
      });

      return { ref1, ref2 };
    });

    element1.focus();

    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
    Object.defineProperty(event, "shiftKey", { value: true });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    element1.dispatchEvent(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it("should not handle Tab navigation when enableTabNavigation is false", () => {
    const { result } = renderHook(() => {
      const ref1 = useRef<HTMLButtonElement>(element1);
      const ref2 = useRef<HTMLButtonElement>(element2);

      useKeyboardNavigation({
        elementRefs: [ref1, ref2],
        keyMappings: {},
        enableTabNavigation: false,
      });

      return { ref1, ref2 };
    });

    element1.focus();

    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    element1.dispatchEvent(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it("should not attach event listeners when disabled", () => {
    const { result } = renderHook(() => {
      const ref1 = useRef<HTMLButtonElement>(element1);
      const ref2 = useRef<HTMLButtonElement>(element2);

      const keyMappings: KeyMapping = {
        ArrowUp: mockAction,
      };

      useKeyboardNavigation({
        elementRefs: [ref1, ref2],
        keyMappings,
        disabled: true,
      });

      return { ref1, ref2 };
    });

    const event = new KeyboardEvent("keydown", { key: "ArrowUp" });
    element1.dispatchEvent(event);

    expect(mockAction).not.toHaveBeenCalled();
  });

  it("should handle multiple key mappings", () => {
    const mockAction1 = vi.fn();
    const mockAction2 = vi.fn();

    const { result } = renderHook(() => {
      const ref1 = useRef<HTMLButtonElement>(element1);
      const ref2 = useRef<HTMLButtonElement>(element2);

      const keyMappings: KeyMapping = {
        ArrowUp: mockAction1,
        ArrowDown: mockAction2,
      };

      useKeyboardNavigation({
        elementRefs: [ref1, ref2],
        keyMappings,
      });

      return { ref1, ref2 };
    });

    element1.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    expect(mockAction1).toHaveBeenCalledTimes(1);
    expect(mockAction2).not.toHaveBeenCalled();

    element1.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    expect(mockAction1).toHaveBeenCalledTimes(1);
    expect(mockAction2).toHaveBeenCalledTimes(1);
  });

  it("should not call action for unmapped keys", () => {
    const { result } = renderHook(() => {
      const ref1 = useRef<HTMLButtonElement>(element1);
      const ref2 = useRef<HTMLButtonElement>(element2);

      const keyMappings: KeyMapping = {
        ArrowUp: mockAction,
      };

      useKeyboardNavigation({
        elementRefs: [ref1, ref2],
        keyMappings,
      });

      return { ref1, ref2 };
    });

    const event = new KeyboardEvent("keydown", { key: "Enter" });
    element1.dispatchEvent(event);

    expect(mockAction).not.toHaveBeenCalled();
  });

  it("should cleanup event listeners on unmount", () => {
    const { unmount } = renderHook(() => {
      const ref1 = useRef<HTMLButtonElement>(element1);
      const ref2 = useRef<HTMLButtonElement>(element2);

      const keyMappings: KeyMapping = {
        ArrowUp: mockAction,
      };

      useKeyboardNavigation({
        elementRefs: [ref1, ref2],
        keyMappings,
      });

      return { ref1, ref2 };
    });

    unmount();

    const event = new KeyboardEvent("keydown", { key: "ArrowUp" });
    element1.dispatchEvent(event);

    expect(mockAction).not.toHaveBeenCalled();
  });

  it("should handle null refs gracefully", () => {
    const { result } = renderHook(() => {
      const ref1 = useRef<HTMLButtonElement>(null);
      const ref2 = useRef<HTMLButtonElement>(element2);

      const keyMappings: KeyMapping = {
        ArrowUp: mockAction,
      };

      useKeyboardNavigation({
        elementRefs: [ref1, ref2] as React.RefObject<HTMLElement>[],
        keyMappings,
      });

      return { ref1, ref2 };
    });

    expect(() => {
      const event = new KeyboardEvent("keydown", { key: "ArrowUp" });
      element2.dispatchEvent(event);
    }).not.toThrow();

    expect(mockAction).toHaveBeenCalledWith(1, expect.any(KeyboardEvent));
  });
});
