import { RangeProps } from "./types";
import { RangeBar } from "./RangeBar";
import { Thumb } from "./Thumb";
import { NumericInput } from "@/components/ui/NumericInput/NumericInput";
import { useDraggable } from "@/hooks/useDraggable";
import {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  RefObject,
} from "react";
import styles from "./Range.module.css";
import {
  KeyMapping,
  useKeyboardNavigation,
} from "@/hooks/useKeyboardNavigation";

/**
 * Calculate the final value based on fixedValues or min/max/step
 */
const calculateValue = (
  numValue: number,
  sortedFixedValues: number[] | null,
  min: number,
  max: number,
  step: number,
  decimals: number
): number => {
  if (sortedFixedValues) {
    // Clamp to array boundaries first
    const clampedValue = Math.max(
      sortedFixedValues[0],
      Math.min(sortedFixedValues[sortedFixedValues.length - 1], numValue)
    );

    // Find the closest value
    return sortedFixedValues.reduce((prev, curr) => {
      return Math.abs(curr - clampedValue) < Math.abs(prev - clampedValue)
        ? curr
        : prev;
    });
  } else {
    const clampedValue = Math.max(min, Math.min(max, numValue));
    const steppedValue = Math.round(clampedValue / step) * step;
    return parseFloat(steppedValue.toFixed(decimals));
  }
};

/**
 * Apply push/boundary logic to calculated values
 */
const applyPushLogic = (
  handle: "min" | "max",
  calculatedValue: number,
  currentMinValue: number,
  currentMaxValue: number,
  allowPush: boolean
): { finalMinValue: number; finalMaxValue: number } => {
  let finalMinValue = currentMinValue;
  let finalMaxValue = currentMaxValue;

  if (handle === "min") {
    finalMinValue = calculatedValue;

    if (allowPush) {
      if (finalMinValue > finalMaxValue) {
        finalMaxValue = finalMinValue;
      }
    } else {
      if (finalMinValue > finalMaxValue) {
        finalMinValue = finalMaxValue;
      }
    }
  } else {
    finalMaxValue = calculatedValue;

    if (allowPush) {
      if (finalMaxValue < finalMinValue) {
        finalMinValue = finalMaxValue;
      }
    } else {
      if (finalMaxValue < finalMinValue) {
        finalMaxValue = finalMinValue;
      }
    }
  }

  return { finalMinValue, finalMaxValue };
};

/**
 * Get adjacent value (next or previous) in the sequence
 */
const getAdjacentValue = (
  currentValue: number,
  direction: "next" | "prev",
  sortedFixedValues: number[] | null,
  step: number,
  min: number,
  max: number
): number => {
  if (sortedFixedValues) {
    const currentIndex = sortedFixedValues.indexOf(currentValue);
    if (currentIndex === -1) return currentValue;

    if (direction === "next") {
      const nextIndex = Math.min(
        currentIndex + 1,
        sortedFixedValues.length - 1
      );
      return sortedFixedValues[nextIndex];
    } else {
      const prevIndex = Math.max(currentIndex - 1, 0);
      return sortedFixedValues[prevIndex];
    }
  } else {
    if (direction === "next") {
      return Math.min(currentValue + step, max);
    } else {
      return Math.max(currentValue - step, min);
    }
  }
};

const handleKeyboardAction = (
  action: "moveToMin" | "moveToMax" | "increment" | "decrement",
  elementIndex: number,
  params: {
    minValue: number;
    maxValue: number;
    sortedFixedValues: number[] | null;
    min: number;
    max: number;
    step: number;
    allowPush: boolean;
  }
): { minValue: number; maxValue: number } | null => {
  const { minValue, maxValue, sortedFixedValues, min, max, step, allowPush } =
    params;
  const handle = elementIndex === 0 ? "min" : "max";

  switch (action) {
    case "moveToMin": {
      const minLimit = sortedFixedValues ? sortedFixedValues[0] : min;
      if (handle === "min") {
        // Don't return if already at min
        if (minValue === minLimit) return null;
        return { minValue: minLimit, maxValue };
      } else {
        if (allowPush) {
          return { minValue: minLimit, maxValue: minLimit };
        } else {
          const newMaxValue = Math.max(minLimit, minValue);
          if (maxValue === newMaxValue) return null;
          return { minValue, maxValue: newMaxValue };
        }
      }
    }

    case "moveToMax": {
      const maxLimit = sortedFixedValues
        ? sortedFixedValues[sortedFixedValues.length - 1]
        : max;
      if (handle === "min") {
        if (allowPush) {
          return { minValue: maxLimit, maxValue: maxLimit };
        } else {
          const newMinValue = Math.min(maxLimit, maxValue);
          if (minValue === newMinValue) return null;
          return { minValue: newMinValue, maxValue };
        }
      } else {
        // Don't return if already at max
        if (maxValue === maxLimit) return null;
        return { minValue, maxValue: maxLimit };
      }
    }

    case "increment": {
      const currentValue = handle === "min" ? minValue : maxValue;
      const newValue = getAdjacentValue(
        currentValue,
        "next",
        sortedFixedValues,
        step,
        min,
        max
      );

      // Don't return if value didn't change
      if (newValue === currentValue) return null;

      if (handle === "min") {
        if (allowPush && newValue > maxValue) {
          return { minValue: newValue, maxValue: newValue };
        } else {
          return { minValue: Math.min(newValue, maxValue), maxValue };
        }
      } else {
        return { minValue, maxValue: Math.max(newValue, minValue) };
      }
    }

    case "decrement": {
      const currentValue = handle === "min" ? minValue : maxValue;
      const newValue = getAdjacentValue(
        currentValue,
        "prev",
        sortedFixedValues,
        step,
        min,
        max
      );

      // Don't return if value didn't change
      if (newValue === currentValue) return null;

      if (handle === "min") {
        return { minValue: Math.min(newValue, maxValue), maxValue };
      } else {
        if (allowPush && newValue < minValue) {
          return { minValue: newValue, maxValue: newValue };
        } else {
          return { minValue, maxValue: Math.max(newValue, minValue) };
        }
      }
    }

    default:
      return null;
  }
};

/**
 * Range component - A slider with two thumbs to select a range of values
 *
 * Range is a customizable dual-thumb range slider component for selecting a numeric interval.
 *
 * Supports both horizontal and vertical orientations, optional numeric input fields,
 * fixed value steps, and pushable thumbs (where one thumb can push the other).
 *
 * @component
 * @param {number} minProp - The minimum allowed value (if not using fixedValues).
 * @param {number} maxProp - The maximum allowed value (if not using fixedValues).
 * @param {[number, number]} value - The current [min, max] values (controlled mode).
 * @param {[number, number]} defaultValue - The default [min, max] values (uncontrolled mode).
 * @param {(value: [number, number]) => void} onChange - Callback fired when the range values change.
 * @param {"horizontal" | "vertical"} [orientation="horizontal"] - Orientation of the slider.
 * @param {number} [step=1] - Step size for value increments (ignored if fixedValues is provided).
 * @param {boolean} [disabled=false] - Whether the slider and inputs are disabled.
 * @param {string} [className] - Additional CSS class names for the container.
 * @param {boolean} [allowPush=true] - If true, thumbs can push each other when overlapped.
 * @param {number} [thumbGap=0] - Minimum gap between thumbs (in value units).
 * @param {boolean} [showInputs=false] - Whether to show numeric input fields for min/max values.
 * @param {boolean} [disabledInputs=false] - Whether the numeric input fields are disabled.
 * @param {number[]} [fixedValues] - Optional array of allowed values (slider will snap to these).
 * @param {(value: number) => string} [formatLabel] - Optional function to format input labels.
 *
 * @remarks
 * - If `fixedValues` is provided, the slider will only allow selecting values from this array.
 * - The component can be controlled (via `value` prop) or uncontrolled (via `defaultValue` prop).
 * - The `onChange` callback is called with the new values whenever the user interacts with the slider or inputs.
 * - The component supports keyboard, mouse, and touch interactions.
 */
export const Range: React.FC<RangeProps> = ({
  min: minProp,
  max: maxProp,
  value: valueProp,
  defaultValue,
  onChange,
  orientation = "horizontal",
  step: stepProp = 1,
  disabled = false,
  className,
  allowPush = true,
  thumbGap = 0,
  showInputs = false,
  disabledInputs = false,
  fixedValues,
  formatLabel,
}) => {
  // Determine if component is controlled
  const isControlled = valueProp !== undefined;
  // Memoize sorted fixed values to avoid sorting on every render
  const sortedFixedValues = useMemo(() => {
    if (!fixedValues || fixedValues.length === 0) return null;
    return [...fixedValues].sort((a, b) => a - b);
  }, [fixedValues]);

  // Calculate min/max from fixed values or props
  const min = useMemo(() => {
    return sortedFixedValues ? Math.min(...sortedFixedValues) : minProp ?? 0;
  }, [sortedFixedValues, minProp]);

  const max = useMemo(() => {
    return sortedFixedValues ? Math.max(...sortedFixedValues) : maxProp ?? 100;
  }, [sortedFixedValues, maxProp]);

  const step = sortedFixedValues ? 1 : stepProp;

  // Memoize decimal calculation
  const decimals = useMemo(() => {
    return step.toString().split(".")[1]?.length || 0;
  }, [step]);

  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = useState<[number, number]>(() => {
    if (defaultValue !== undefined) return defaultValue;
    return [min, max];
  });

  // Use controlled or uncontrolled values
  const [minValue, maxValue] = isControlled ? valueProp : internalValue;

  // Update function that handles both controlled and uncontrolled modes
  const updateValues = useCallback(
    (newMin: number, newMax: number) => {
      const newValue: [number, number] = [newMin, newMax];
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    },
    [isControlled, onChange]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const minInputRef = useRef<HTMLInputElement | null>(null);
  const maxInputRef = useRef<HTMLInputElement | null>(null);
  const minThumbRef = useRef<HTMLButtonElement | null>(null);
  const maxThumbRef = useRef<HTMLButtonElement | null>(null);

  // Use editing state instead of duplicating value state
  const [isEditingMin, setIsEditingMin] = useState(false);
  const [isEditingMax, setIsEditingMax] = useState(false);
  const [editingMinValue, setEditingMinValue] = useState("");
  const [editingMaxValue, setEditingMaxValue] = useState("");

  const minInputValue = isEditingMin ? editingMinValue : minValue.toString();
  const maxInputValue = isEditingMax ? editingMaxValue : maxValue.toString();

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsEditingMin(true);
    setEditingMinValue(e.target.value);
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsEditingMax(true);
    setEditingMaxValue(e.target.value);
  };

  // Memoize value conversion functions
  const valueToPercentage = useCallback(
    (value: number) => {
      return ((value - min) / (max - min)) * 100;
    },
    [min, max]
  );

  const percentageToValue = useCallback(
    (percentage: number) => {
      const rawValue = min + (percentage / 100) * (max - min);

      if (sortedFixedValues) {
        return sortedFixedValues.reduce((prev, curr) => {
          return Math.abs(curr - rawValue) < Math.abs(prev - rawValue)
            ? curr
            : prev;
        });
      }

      const steppedValue = Math.round(rawValue / step) * step;
      const roundedValue = parseFloat(steppedValue.toFixed(decimals));
      return Math.max(min, Math.min(max, roundedValue));
    },
    [min, max, step, decimals, sortedFixedValues]
  );

  const applyMinValue = useCallback(() => {
    const inputValue = isEditingMin ? editingMinValue : minValue.toString();
    const numValue = parseFloat(inputValue);

    if (!isNaN(numValue)) {
      const calculatedValue = calculateValue(
        numValue,
        sortedFixedValues,
        min,
        max,
        step,
        decimals
      );

      const { finalMinValue, finalMaxValue } = applyPushLogic(
        "min",
        calculatedValue,
        minValue,
        maxValue,
        allowPush
      );

      setIsEditingMin(false);
      updateValues(finalMinValue, finalMaxValue);
    } else {
      setIsEditingMin(false);
    }
  }, [
    isEditingMin,
    editingMinValue,
    minValue,
    maxValue,
    sortedFixedValues,
    min,
    max,
    step,
    decimals,
    allowPush,
    updateValues,
  ]);

  const applyMaxValue = useCallback(() => {
    const inputValue = isEditingMax ? editingMaxValue : maxValue.toString();
    const numValue = parseFloat(inputValue);

    if (!isNaN(numValue)) {
      const calculatedValue = calculateValue(
        numValue,
        sortedFixedValues,
        min,
        max,
        step,
        decimals
      );

      const { finalMinValue, finalMaxValue } = applyPushLogic(
        "max",
        calculatedValue,
        minValue,
        maxValue,
        allowPush
      );

      setIsEditingMax(false);
      updateValues(finalMinValue, finalMaxValue);
    } else {
      setIsEditingMax(false);
    }
  }, [
    isEditingMax,
    editingMaxValue,
    maxValue,
    minValue,
    sortedFixedValues,
    min,
    max,
    step,
    decimals,
    allowPush,
    updateValues,
  ]);

  const handleMinInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applyMinValue();
      minInputRef.current?.blur();
    }
  };

  const handleMaxInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applyMaxValue();
      maxInputRef.current?.blur();
    }
  };

  // Memoize percentage calculations
  const minPercentage = valueToPercentage(minValue);
  const maxPercentage = valueToPercentage(maxValue);

  const percentageDiff = maxPercentage - minPercentage;
  const thumbGapPercentage = (thumbGap / (max - min)) * 100;

  // Memoize visual percentages calculation
  const { minVisualPercentage, maxVisualPercentage } = useMemo(() => {
    let minVis = minPercentage;
    let maxVis = maxPercentage;

    if (thumbGap > 0 && percentageDiff < thumbGapPercentage) {
      const midPoint = (minPercentage + maxPercentage) / 2;
      const halfGap = thumbGapPercentage / 2;

      minVis = midPoint - halfGap;
      maxVis = midPoint + halfGap;

      if (minVis < 0) {
        minVis = 0;
        maxVis = thumbGapPercentage;
      } else if (maxVis > 100) {
        maxVis = 100;
        minVis = 100 - thumbGapPercentage;
      }
    }

    return { minVisualPercentage: minVis, maxVisualPercentage: maxVis };
  }, [
    minPercentage,
    maxPercentage,
    thumbGap,
    percentageDiff,
    thumbGapPercentage,
  ]);

  const handleDragMove = (
    handle: "min" | "max",
    clientX: number,
    clientY: number
  ) => {
    if (!containerRef.current || disabled) return;

    const rect = containerRef.current.getBoundingClientRect();

    let newPercentage: number;

    if (orientation === "horizontal") {
      newPercentage = Math.max(
        0,
        Math.min(100, ((clientX - rect.left) / rect.width) * 100)
      );
    } else {
      newPercentage = Math.max(
        0,
        Math.min(100, 100 - ((clientY - rect.top) / rect.height) * 100)
      );
    }

    const newValue = percentageToValue(newPercentage);

    const bothDragging = draggingHandles.size === 2;
    const isMinDragging = draggingHandles.has("min");
    const isMaxDragging = draggingHandles.has("max");

    if (handle === "min") {
      if (bothDragging && newValue > maxValue) {
        return;
      }

      if (!allowPush && !isMaxDragging && newValue >= maxValue) {
        if (maxValue !== minValue) {
          updateValues(maxValue, maxValue);
        }
        return;
      }

      if (allowPush && !isMaxDragging && newValue > maxValue) {
        const pushedMaxValue = newValue;
        if (pushedMaxValue !== maxValue || newValue !== minValue) {
          updateValues(newValue, pushedMaxValue);
        }
      } else {
        const adjustedValue = Math.min(newValue, maxValue);
        if (adjustedValue !== minValue) {
          updateValues(adjustedValue, maxValue);
        }
      }
    } else {
      if (bothDragging && newValue < minValue) {
        return;
      }

      if (!allowPush && !isMinDragging && newValue <= minValue) {
        if (minValue !== maxValue) {
          updateValues(minValue, minValue);
        }
        return;
      }

      if (allowPush && !isMinDragging && newValue < minValue) {
        const pushedMinValue = newValue;
        if (pushedMinValue !== minValue || newValue !== maxValue) {
          updateValues(pushedMinValue, newValue);
        }
      } else {
        const adjustedValue = Math.max(newValue, minValue);
        if (adjustedValue !== maxValue) {
          updateValues(minValue, adjustedValue);
        }
      }
    }
  };

  const { dragging, handleMouseDown, draggingHandles } = useDraggable<
    "min" | "max"
  >({
    onDragMove: handleDragMove,
  });

  useEffect(() => {
    if (dragging !== null || draggingHandles.size > 0) {
      // Blur thumbs to remove keyboard focus visual
      minThumbRef.current?.blur();
      maxThumbRef.current?.blur();
    }
  }, [dragging, draggingHandles.size]);

  useEffect(() => {
    if (showInputs && (dragging !== null || draggingHandles.size > 0)) {
      minInputRef.current?.blur();
      maxInputRef.current?.blur();
    }
  }, [dragging, draggingHandles.size, showInputs]);

  // Helper function to execute keyboard action and call onChange
  const executeKeyboardAction = useCallback(
    (
      action: "moveToMin" | "moveToMax" | "increment" | "decrement",
      elementIndex: number,
      e: KeyboardEvent
    ) => {
      e.preventDefault();
      const result = handleKeyboardAction(action, elementIndex, {
        minValue,
        maxValue,
        sortedFixedValues,
        min,
        max,
        step,
        allowPush,
      });
      if (result) {
        updateValues(result.minValue, result.maxValue);
      }
    },
    [
      minValue,
      maxValue,
      sortedFixedValues,
      min,
      max,
      step,
      allowPush,
      updateValues,
    ]
  );

  // Define key mappings
  const keyMappings: KeyMapping = useMemo(
    () => ({
      Home: (elementIndex, e) =>
        executeKeyboardAction("moveToMin", elementIndex, e),
      End: (elementIndex, e) =>
        executeKeyboardAction("moveToMax", elementIndex, e),
      ArrowUp: (elementIndex, e) =>
        executeKeyboardAction("increment", elementIndex, e),
      ArrowRight: (elementIndex, e) =>
        executeKeyboardAction("increment", elementIndex, e),
      ArrowDown: (elementIndex, e) =>
        executeKeyboardAction("decrement", elementIndex, e),
      ArrowLeft: (elementIndex, e) =>
        executeKeyboardAction("decrement", elementIndex, e),
    }),
    [executeKeyboardAction]
  );

  // Use keyboard navigation hook
  useKeyboardNavigation({
    elementRefs: [
      minThumbRef as RefObject<HTMLButtonElement>,
      maxThumbRef as RefObject<HTMLButtonElement>,
    ],
    keyMappings,
    disabled,
    enableTabNavigation: true,
  });
  return (
    <div
      className={`${showInputs ? styles.wrapper : ""} ${
        orientation === "vertical"
          ? styles.wrapperVertical
          : styles.wrapperHorizontal
      }`}
    >
      {showInputs && (
        <div
          className={`${styles.inputsContainer} ${
            orientation === "vertical"
              ? styles.inputsContainerVertical
              : styles.inputsContainerHorizontal
          }`}
        >
          {[
            orientation === "vertical" ? "max" : "min",
            orientation === "vertical" ? "min" : "max",
          ].map((type) => {
            const isMin = type === "min";
            return (
              <div
                key={type}
                className={`${styles.inputWrapper} ${
                  isMin ? styles.inputWrapperLeft : styles.inputWrapperRight
                }`}
              >
                <NumericInput
                  inputRef={isMin ? minInputRef : maxInputRef}
                  value={isMin ? minInputValue : maxInputValue}
                  onChange={isMin ? handleMinInputChange : handleMaxInputChange}
                  onBlur={isMin ? applyMinValue : applyMaxValue}
                  onKeyDown={
                    isMin ? handleMinInputKeyDown : handleMaxInputKeyDown
                  }
                  disabled={disabled || disabledInputs}
                  id={isMin ? "range-min-input" : "range-max-input"}
                  formatLabel={formatLabel}
                />
              </div>
            );
          })}
        </div>
      )}

      <div
        ref={containerRef}
        className={`${styles.container} ${
          orientation === "vertical" ? styles.vertical : styles.horizontal
        } ${disabled ? styles.disabled : ""} ${className || ""}`}
        data-testid="range-container"
      >
        <RangeBar
          minPercentage={minVisualPercentage}
          maxPercentage={maxVisualPercentage}
          orientation={orientation}
        />

        <Thumb
          ref={minThumbRef}
          id="range-thumb-min"
          percentageX={orientation === "horizontal" ? minVisualPercentage : 50}
          percentageY={
            orientation === "horizontal" ? 50 : 100 - minVisualPercentage
          }
          isDragging={dragging === "min"}
          onMouseDown={disabled ? undefined : handleMouseDown("min")}
          onTouchStart={disabled ? undefined : handleMouseDown("min")}
        />

        <Thumb
          ref={maxThumbRef}
          id="range-thumb-max"
          percentageX={orientation === "horizontal" ? maxVisualPercentage : 50}
          percentageY={
            orientation === "horizontal" ? 50 : 100 - maxVisualPercentage
          }
          isDragging={dragging === "max"}
          onMouseDown={disabled ? undefined : handleMouseDown("max")}
          onTouchStart={disabled ? undefined : handleMouseDown("max")}
        />
      </div>
    </div>
  );
};
