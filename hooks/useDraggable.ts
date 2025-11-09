import { useState, useCallback, useEffect, useRef } from "react";

interface UseDraggableOptions<T extends string> {
  onDragMove: (handle: T, clientX: number) => void;
  onDragEnd?: () => void;
}

export function useDraggable<T extends string>({
  onDragMove,
  onDragEnd,
}: UseDraggableOptions<T>) {
  const [draggingHandles, setDraggingHandles] = useState<Set<T>>(new Set());
  const touchIdentifiers = useRef<Map<number, T>>(new Map());
  const handleTouchMap = useRef<Map<T, number>>(new Map());

  const handleMouseDown = useCallback(
    (handle: T) => (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if ("changedTouches" in e) {
        // Touch event - only consider the first touch point
        if (handleTouchMap.current.has(handle)) {
          return; // This handle is already being controlled by another finger
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
        e.preventDefault(); // Prevent scrolling while dragging
        // Multi-touch support
        for (let i = 0; i < e.touches.length; i++) {
          const touch = e.touches[i];
          const handle = touchIdentifiers.current.get(touch.identifier);
          if (handle && draggingHandles.has(handle)) {
            onDragMove(handle, touch.clientX);
          }
        }
      } else {
        // Mouse event - single handle
        const handle = Array.from(draggingHandles)[0];
        if (handle) {
          onDragMove(handle, e.clientX);
        }
      }
    },
    [draggingHandles, onDragMove]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if ("changedTouches" in e) {
        // Touch end - remove specific touch
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          const handle = touchIdentifiers.current.get(touch.identifier);
          if (handle) {
            touchIdentifiers.current.delete(touch.identifier);
            handleTouchMap.current.delete(handle); // Liberar el handle
            setDraggingHandles((prev) => {
              const next = new Set(prev);
              next.delete(handle);
              return next;
            });
          }
        }
      } else {
        // Mouse up - clear all
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

  // Return first dragging handle for backward compatibility
  const dragging =
    draggingHandles.size > 0 ? Array.from(draggingHandles)[0] : null;
  const isMultiTouch = draggingHandles.size > 1;

  return {
    dragging,
    draggingHandles,
    isMultiTouch,
    handleMouseDown,
  };
}
