import { useState, useCallback, useEffect, useRef } from "react";

interface UseDraggableOptions<T extends string> {
  onDragMove: (handle: T, clientX: number, clientY: number) => void;
  onDragEnd?: () => void;
}

export function useDraggable<T extends string>({
  onDragMove,
  onDragEnd,
}: UseDraggableOptions<T>) {
  const [draggingHandles, setDraggingHandles] = useState<Set<T>>(new Set());
  const touchIdentifiers = useRef<Map<number, T>>(new Map());
  const handleTouchMap = useRef<Map<T, number>>(new Map());

  // Computed state
  const dragging =
    draggingHandles.size === 1 ? Array.from(draggingHandles)[0] : null;
  const isMultiTouch = draggingHandles.size > 1;

  const handleMouseDown = useCallback(
    (handle: T) => (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if ("changedTouches" in e) {
        if (handleTouchMap.current.has(handle)) {
          return;
        }

        const touch = e.changedTouches[0];
        touchIdentifiers.current.set(touch.identifier, handle);
        handleTouchMap.current.set(handle, touch.identifier);
      }

      setDraggingHandles((prev) => new Set(prev).add(handle));
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (draggingHandles.size === 0) return;

      if ("touches" in e) {
        e.preventDefault();

        for (let i = 0; i < e.touches.length; i++) {
          const touch = e.touches[i];
          const handle = touchIdentifiers.current.get(touch.identifier);
          if (handle && draggingHandles.has(handle)) {
            onDragMove(handle, touch.clientX, touch.clientY);
          }
        }
      } else {
        const handle = Array.from(draggingHandles)[0];
        if (handle) {
          onDragMove(handle, e.clientX, e.clientY);
        }
      }
    },
    [draggingHandles, onDragMove]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if ("changedTouches" in e) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          const handle = touchIdentifiers.current.get(touch.identifier);

          if (handle) {
            touchIdentifiers.current.delete(touch.identifier);
            handleTouchMap.current.delete(handle);

            setDraggingHandles((prev) => {
              const next = new Set(prev);
              next.delete(handle);
              return next;
            });
          }
        }
      } else {
        setDraggingHandles(new Set());
        touchIdentifiers.current.clear();
        handleTouchMap.current.clear();
      }

      if (draggingHandles.size <= 1) {
        onDragEnd?.();
      }
    },
    [draggingHandles.size, onDragEnd]
  );

  useEffect(() => {
    if (draggingHandles.size > 0) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleMouseMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleMouseUp, { passive: false });

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleMouseMove);
        document.removeEventListener("touchend", handleMouseUp);
      };
    }
  }, [draggingHandles.size, handleMouseMove, handleMouseUp]);

  return {
    dragging,
    draggingHandles,
    isMultiTouch,
    handleMouseDown,
  };
}
