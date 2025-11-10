import { RangeProps } from "./types";
import { RangeBar } from "./RangeBar";
import { Thumb } from "./Thumb";
import { NumericInput } from "@/components/ui/NumericInput/NumericInput";
import { useDraggable } from "@/hooks/useDraggable";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import styles from "./Range.module.css";

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
 * @param {number} minValue - The current minimum value selected.
 * @param {number} maxValue - The current maximum value selected.
 * @param {(min: number, max: number) => void} onChange - Callback fired when the range values change.
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
 * - The component is fully controlled; you must manage `minValue` and `maxValue` state externally.
 * - The `onChange` callback is called with the new values whenever the user interacts with the slider or inputs.
 * - The component supports keyboard, mouse, and touch interactions.
 */
export const Range: React.FC<RangeProps> = ({
  min: minProp,
  max: maxProp,
  minValue,
  maxValue,
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

  const containerRef = useRef<HTMLDivElement>(null);
  const minInputRef = useRef<HTMLInputElement | null>(null);
  const maxInputRef = useRef<HTMLInputElement | null>(null);

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
      let finalMinValue: number;
      let finalMaxValue = maxValue;

      if (sortedFixedValues) {
        // Clamp to array boundaries first
        const clampedValue = Math.max(
          sortedFixedValues[0],
          Math.min(sortedFixedValues[sortedFixedValues.length - 1], numValue)
        );

        // Find the closest value
        finalMinValue = sortedFixedValues.reduce((prev, curr) => {
          return Math.abs(curr - clampedValue) < Math.abs(prev - clampedValue)
            ? curr
            : prev;
        });
      } else {
        const clampedValue = Math.max(min, Math.min(max, numValue));
        const steppedValue = Math.round(clampedValue / step) * step;
        finalMinValue = parseFloat(steppedValue.toFixed(decimals));
      }

      // Apply push/boundary logic
      if (allowPush) {
        if (finalMinValue > finalMaxValue) {
          finalMaxValue = finalMinValue;
        }
      } else {
        if (finalMinValue > finalMaxValue) {
          finalMinValue = finalMaxValue;
        }
      }

      setIsEditingMin(false);

      onChange?.(finalMinValue, finalMaxValue);
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
    onChange,
  ]);

  const applyMaxValue = useCallback(() => {
    const inputValue = isEditingMax ? editingMaxValue : maxValue.toString();
    const numValue = parseFloat(inputValue);

    if (!isNaN(numValue)) {
      let finalMaxValue: number;
      let finalMinValue = minValue;

      if (sortedFixedValues) {
        // Clamp to array boundaries first
        const clampedValue = Math.max(
          sortedFixedValues[0],
          Math.min(sortedFixedValues[sortedFixedValues.length - 1], numValue)
        );

        // Find the closest value
        finalMaxValue = sortedFixedValues.reduce((prev, curr) => {
          return Math.abs(curr - clampedValue) < Math.abs(prev - clampedValue)
            ? curr
            : prev;
        });
      } else {
        const clampedValue = Math.max(min, Math.min(max, numValue));
        const steppedValue = Math.round(clampedValue / step) * step;
        finalMaxValue = parseFloat(steppedValue.toFixed(decimals));
      }

      // Apply push/boundary logic
      if (allowPush) {
        if (finalMaxValue < finalMinValue) {
          finalMinValue = finalMaxValue;
        }
      } else {
        if (finalMaxValue < finalMinValue) {
          finalMaxValue = finalMinValue;
        }
      }

      setIsEditingMax(false);
      onChange?.(finalMinValue, finalMaxValue);
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
    onChange,
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
          onChange?.(maxValue, maxValue);
        }
        return;
      }

      if (allowPush && !isMaxDragging && newValue > maxValue) {
        const pushedMaxValue = newValue;
        if (pushedMaxValue !== maxValue || newValue !== minValue) {
          onChange?.(newValue, pushedMaxValue);
        }
      } else {
        const adjustedValue = Math.min(newValue, maxValue);
        if (adjustedValue !== minValue) {
          onChange?.(adjustedValue, maxValue);
        }
      }
    } else {
      if (bothDragging && newValue < minValue) {
        return;
      }

      if (!allowPush && !isMinDragging && newValue <= minValue) {
        if (minValue !== maxValue) {
          onChange?.(minValue, minValue);
        }
        return;
      }

      if (allowPush && !isMinDragging && newValue < minValue) {
        const pushedMinValue = newValue;
        if (pushedMinValue !== minValue || newValue !== maxValue) {
          onChange?.(pushedMinValue, newValue);
        }
      } else {
        const adjustedValue = Math.max(newValue, minValue);
        if (adjustedValue !== maxValue) {
          onChange?.(minValue, adjustedValue);
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
    if (showInputs && (dragging !== null || draggingHandles.size > 0)) {
      minInputRef.current?.blur();
      maxInputRef.current?.blur();
    }
  }, [dragging, draggingHandles.size, showInputs]);

  if (!showInputs) {
    return (
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
    );
  }

  return (
    <div
      className={`${styles.wrapper} ${
        orientation === "vertical"
          ? styles.wrapperVertical
          : styles.wrapperHorizontal
      }`}
    >
      <div
        className={`${styles.inputsContainer} ${
          orientation === "vertical"
            ? styles.inputsContainerVertical
            : styles.inputsContainerHorizontal
        }`}
      >
        <div className={`${styles.inputWrapper} ${styles.inputWrapperLeft}`}>
          <NumericInput
            inputRef={minInputRef}
            value={minInputValue}
            onChange={handleMinInputChange}
            onBlur={applyMinValue}
            onKeyDown={handleMinInputKeyDown}
            disabled={disabled || disabledInputs}
            id="range-min-input"
            formatLabel={formatLabel}
          />
        </div>

        <div className={`${styles.inputWrapper} ${styles.inputWrapperRight}`}>
          <NumericInput
            inputRef={maxInputRef}
            value={maxInputValue}
            onChange={handleMaxInputChange}
            onBlur={applyMaxValue}
            onKeyDown={handleMaxInputKeyDown}
            disabled={disabled || disabledInputs}
            id="range-max-input"
            formatLabel={formatLabel}
          />
        </div>
      </div>

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
