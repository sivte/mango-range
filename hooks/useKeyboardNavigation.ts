import { useEffect, RefObject } from "react";

export type KeyAction = (elementIndex: number, event: KeyboardEvent) => void;

export interface KeyMapping {
  [key: string]: KeyAction;
}

interface UseKeyboardNavigationOptions {
  elementRefs: RefObject<HTMLElement>[];
  keyMappings: KeyMapping;
  disabled?: boolean;
  enableTabNavigation?: boolean;
}

export function useKeyboardNavigation({
  elementRefs,
  keyMappings,
  disabled = false,
  enableTabNavigation = true,
}: UseKeyboardNavigationOptions) {
  useEffect(() => {
    if (disabled) return;

    const handlers: Map<HTMLElement, (e: KeyboardEvent) => void> = new Map();

    elementRefs.forEach((ref, index) => {
      const element = ref.current;
      if (!element) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        // Handle Tab navigation between elements
        if (enableTabNavigation && e.key === "Tab") {
          if (e.shiftKey) {
            // Shift+Tab - go to previous element
            const prevIndex = index - 1;
            if (prevIndex >= 0) {
              e.preventDefault();
              elementRefs[prevIndex].current?.focus();
              return;
            }
          } else {
            // Tab - go to next element
            const nextIndex = index + 1;
            if (nextIndex < elementRefs.length) {
              e.preventDefault();
              elementRefs[nextIndex].current?.focus();
              return;
            }
          }
        }

        // Check if there's a mapping for this key
        const action = keyMappings[e.key];
        if (action) {
          action(index, e);
        }
      };

      handlers.set(element, handleKeyDown);
      element.addEventListener("keydown", handleKeyDown);
    });

    return () => {
      handlers.forEach((handler, element) => {
        element.removeEventListener("keydown", handler);
      });
    };
  }, [elementRefs, keyMappings, disabled, enableTabNavigation]);
}
