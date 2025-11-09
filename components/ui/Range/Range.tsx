"use client";

import React, {
  useRef,
  useCallback,
  useMemo,
  useState,
  useEffect,
  startTransition,
} from "react";
import styles from "./Range.module.css";
import { useDraggable } from "@/hooks/useDraggable";
import { NumericInput } from "@sivte/ui";
import type { RangeProps, RangeThumbProps, RangeState } from "./types";
import { RangeThumbType } from "./types";

/**
 * RangeThumb component renders a draggable slider handle
 */
const RangeThumb = React.memo<RangeThumbProps>(
  ({ id, type, percentage, isDragging, onMouseDown, onTouchStart }) => {
    return (
      <button
        type="button"
        id={id}
        className={`${styles.handle} ${isDragging ? styles.dragging : ""}`}
        style={{ left: `${percentage}%` }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        data-testid={`${type}-handle`}
      />
    );
  }
);

RangeThumb.displayName = "RangeThumb";

/**
 * Calculate decimal precision from a step value
 * @param step - The step value to analyze
 * @returns Number of decimal places in the step
 */
function getDecimalPrecision(step: number): number {
  const stepStr = step.toString();
  const decimalPart = stepStr.split(".")[1];
  return decimalPart ? decimalPart.length : 0;
}

/**
 * Tolerance factor for floating point comparisons
 * Used to determine if values are "close enough" to be considered equal
 */
const FLOATING_POINT_EPSILON_FACTOR = 1000;

/**
 * Hook to manage range value calculations and conversions.
 *
 * Handles both fixed value arrays and step-based continuous ranges.
 *
 * @param params - Configuration object
 * @param params.min - Minimum value of the range
 * @param params.max - Maximum value of the range
 * @param params.step - Step increment for continuous ranges
 * @param params.fixedValues - Optional array of fixed values (overrides step-based behavior)
 * @returns Object with calculation functions and metadata
 */
function useRangeCalculations({
  min,
  max,
  step,
  fixedValues,
}: {
  min: number;
  max: number;
  step: number;
  fixedValues?: number[];
}) {
  // Calculate decimal precision based on step value
  const decimalPrecision = useMemo(() => getDecimalPrecision(step), [step]);

  const getValueAtIndex = useCallback(
    (index: number): number => {
      if (fixedValues) return fixedValues[index];

      const rawValue = min + index * step;

      // Clamp to max if exceeded
      if (rawValue > max) return max;

      // Round using scale factor to avoid floating point precision issues
      const scale = Math.pow(10, decimalPrecision);
      return Math.round(rawValue * scale) / scale;
    },
    [fixedValues, min, max, step, decimalPrecision]
  );

  // Calculate total number of available positions
  const totalSteps = useMemo(() => {
    if (fixedValues) return fixedValues.length;

    // Calculate how many complete steps fit in the range
    const range = max - min;
    const completeSteps = Math.floor(range / step);

    // Always include the starting position (min)
    // Add 1 for each complete step
    // Add 1 more if max is exactly on a step boundary
    const epsilon = step / FLOATING_POINT_EPSILON_FACTOR;
    const maxIsOnStep = Math.abs(min + completeSteps * step - max) < epsilon;

    return maxIsOnStep ? completeSteps + 1 : completeSteps + 2;
  }, [fixedValues, min, max, step]);

  // Convert value to index (find closest position)
  const getClosestIndex = useCallback(
    (value: number): number => {
      if (fixedValues) {
        // For fixed values, search for closest match
        let closestIndex = 0;
        let minDiff = Math.abs(fixedValues[0] - value);

        for (let i = 1; i < fixedValues.length; i++) {
          const diff = Math.abs(fixedValues[i] - value);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
          }
        }
        return closestIndex;
      }

      // For step-based ranges, calculate directly
      const stepsFromMin = Math.round((value - min) / step);
      return Math.max(0, Math.min(totalSteps - 1, stepsFromMin));
    },
    [fixedValues, min, step, totalSteps]
  );

  // Create lookup map for fixed values
  const fixedValuesMap = useMemo(() => {
    if (!fixedValues) return null;

    const map = new Map<number, number>();
    fixedValues.forEach((value, index) => {
      map.set(value, index);
    });
    return map;
  }, [fixedValues]);

  const getClosestValue = useCallback(
    (value: number): number => {
      const index = getClosestIndex(value);
      return getValueAtIndex(index);
    },
    [getClosestIndex, getValueAtIndex]
  );

  const getPercentage = useCallback(
    (value: number): number => {
      return ((value - min) / (max - min)) * 100;
    },
    [min, max]
  );

  return {
    getValueAtIndex,
    totalSteps,
    getClosestIndex,
    fixedValuesMap,
    getClosestValue,
    getPercentage,
  };
}

/**
 * Hook to manage the range state and value updates.
 *
 * Implements push behavior: when thumbs get too close, the other thumb
 * is automatically pushed to maintain minimum separation.
 *
 * @param params - Configuration object
 * @param params.initialMinValue - Initial minimum value (defaults to range min)
 * @param params.initialMaxValue - Initial maximum value (defaults to range max)
 * @param params.onChange - Callback fired when values change
 * @param params.getValueAtIndex - Function to convert index to value
 * @param params.getClosestIndex - Function to convert value to index
 * @param params.totalSteps - Total number of discrete positions
 * @returns State object and update functions
 */
function useRangeState({
  initialMinValue,
  initialMaxValue,
  onChange,
  getValueAtIndex,
  getClosestIndex,
  totalSteps,
}: {
  initialMinValue?: number;
  initialMaxValue?: number;
  onChange?: (min: number, max: number) => void;
  getValueAtIndex: (index: number) => number;
  getClosestIndex: (value: number) => number;
  totalSteps: number;
}) {
  const minIndexGap = 1; // Minimum separation between thumbs

  // Initialize state with indices
  const [state, setState] = useState<RangeState>(() => {
    const minIdx =
      initialMinValue !== undefined ? getClosestIndex(initialMinValue) : 0;
    const maxIdx =
      initialMaxValue !== undefined
        ? getClosestIndex(initialMaxValue)
        : totalSteps - 1;

    return { minIndex: minIdx, maxIndex: maxIdx };
  });

  // Store onChange in ref to avoid recreating updateValue
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Core update logic with push behavior
  const updateValue = useCallback(
    (type: RangeThumbType, value: number) => {
      setState((current) => {
        const isMin = type === RangeThumbType.Min;
        const targetIndex = getClosestIndex(value);
        const clampedIndex = Math.max(0, Math.min(totalSteps - 1, targetIndex));

        let newMinIndex = isMin ? clampedIndex : current.minIndex;
        let newMaxIndex = isMin ? current.maxIndex : clampedIndex;

        const indexDiff = newMaxIndex - newMinIndex;

        // Push logic: maintain minimum gap between thumbs
        if (indexDiff < minIndexGap) {
          if (isMin) {
            const desiredMaxIndex = newMinIndex + minIndexGap;
            if (desiredMaxIndex < totalSteps) {
              newMaxIndex = desiredMaxIndex;
            } else {
              newMinIndex = Math.max(0, totalSteps - 1 - minIndexGap);
              newMaxIndex = totalSteps - 1;
            }
          } else {
            const desiredMinIndex = newMaxIndex - minIndexGap;
            if (desiredMinIndex >= 0) {
              newMinIndex = desiredMinIndex;
            } else {
              newMinIndex = 0;
              newMaxIndex = Math.min(totalSteps - 1, minIndexGap);
            }
          }
        }

        if (
          newMinIndex === current.minIndex &&
          newMaxIndex === current.maxIndex
        ) {
          return current;
        }

        const newMinValue = getValueAtIndex(newMinIndex);
        const newMaxValue = getValueAtIndex(newMaxIndex);
        onChangeRef.current?.(newMinValue, newMaxValue);

        return { minIndex: newMinIndex, maxIndex: newMaxIndex };
      });
    },
    [getClosestIndex, getValueAtIndex, totalSteps]
  );

  const updateMinValue = useCallback(
    (value: number) => updateValue(RangeThumbType.Min, value),
    [updateValue]
  );

  const updateMaxValue = useCallback(
    (value: number) => updateValue(RangeThumbType.Max, value),
    [updateValue]
  );

  return {
    state,
    updateMinValue,
    updateMaxValue,
  };
}

/**
 * Hook to manage editable label state and interactions.
 *
 * Handles clicking labels to edit values, input validation,
 * and cancelling edits when dragging starts.
 *
 * @param params - Configuration object
 * @param params.editable - Whether labels are editable
 * @param params.fixedValues - Fixed values array (disables editing if present)
 * @param params.updateMinValue - Function to update minimum value
 * @param params.updateMaxValue - Function to update maximum value
 * @param params.dragging - Current dragging state (cancels editing when drag starts)
 * @returns State and handlers for editable inputs
 */
function useEditableLabel({
  editable,
  fixedValues,
  updateMinValue,
  updateMaxValue,
  dragging,
}: {
  editable: boolean;
  fixedValues?: number[];
  updateMinValue: (value: number) => void;
  updateMaxValue: (value: number) => void;
  dragging: RangeThumbType | null;
}) {
  const [editingLabel, setEditingLabel] = useState<RangeThumbType | null>(null);
  const [tempValue, setTempValue] = useState("");
  const minInputRef = useRef<HTMLInputElement>(null);
  const maxInputRef = useRef<HTMLInputElement>(null);
  const previousDraggingRef = useRef<typeof dragging>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    const targetRef =
      editingLabel === RangeThumbType.Min
        ? minInputRef
        : editingLabel === RangeThumbType.Max
        ? maxInputRef
        : null;
    if (targetRef?.current) {
      targetRef.current.focus();
      targetRef.current.select();
    }
  }, [editingLabel]);

  // Cancel editing when dragging starts
  useEffect(() => {
    if (dragging && !previousDraggingRef.current) {
      const activeElement = document.activeElement;
      if (
        activeElement === minInputRef.current ||
        activeElement === maxInputRef.current
      ) {
        (activeElement as HTMLElement).blur();
      }

      startTransition(() => {
        setEditingLabel(null);
        setTempValue("");
      });
    }
    previousDraggingRef.current = dragging;
  }, [dragging]);

  const handleLabelClick = useCallback(
    (type: RangeThumbType) => {
      if (!editable || fixedValues) return;
      setEditingLabel(type);
    },
    [editable, fixedValues]
  );

  const commitEdit = useCallback(() => {
    if (!tempValue || tempValue === "-" || tempValue === ".") {
      setEditingLabel(null);
      setTempValue("");
      return;
    }

    const numValue = parseFloat(tempValue);

    if (!isNaN(numValue) && isFinite(numValue)) {
      if (editingLabel === RangeThumbType.Min) {
        updateMinValue(numValue);
      } else if (editingLabel === RangeThumbType.Max) {
        updateMaxValue(numValue);
      }
    }

    setEditingLabel(null);
    setTempValue("");
  }, [tempValue, editingLabel, updateMinValue, updateMaxValue]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      if (inputValue === "" || /^-?\d*\.?\d*$/.test(inputValue)) {
        setTempValue(inputValue);
      }
    },
    []
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        commitEdit();
        e.currentTarget.blur();
      } else if (e.key === "Escape") {
        setEditingLabel(null);
        setTempValue("");
      }
    },
    [commitEdit]
  );

  return {
    editingLabel,
    tempValue,
    minInputRef,
    maxInputRef,
    handleLabelClick,
    commitEdit,
    handleInputChange,
    handleInputKeyDown,
  };
}

/**
 * Range component - A dual-thumb slider with support for:
 * - Fixed values or step-based ranges
 * - Editable numeric inputs
 * - Drag and touch interactions
 * - Push behavior when thumbs get close
 *
 * @example
 * ```tsx
 * <Range min={0} max={100} step={1} onChange={(min, max) => console.log(min, max)} />
 * <Range fixedValues={[1.99, 5.99, 15.99, 30.99]} editable={false} />
 * ```
 */
export const Range: React.FC<RangeProps> = ({
  min,
  max,
  initialMinValue,
  initialMaxValue,
  fixedValues,
  editable = true,
  onChange,
  formatLabel,
  step = 1,
}) => {
  const rangeRef = useRef<HTMLDivElement>(null);

  // Validate props in development
  if (process.env.NODE_ENV !== "production") {
    if (min >= max) {
      console.error("[Range] Invalid props: min must be less than max", {
        min,
        max,
      });
    }
    if (step <= 0) {
      console.error("[Range] Invalid props: step must be positive", { step });
    }
    if (fixedValues && fixedValues.length > 0) {
      const isSorted = fixedValues.every(
        (val, i, arr) => i === 0 || arr[i - 1] <= val
      );
      if (!isSorted) {
        console.error(
          "[Range] Invalid props: fixedValues must be sorted in ascending order",
          { fixedValues }
        );
      }
      if (fixedValues[0] < min || fixedValues[fixedValues.length - 1] > max) {
        console.error(
          "[Range] Invalid props: fixedValues must be within [min, max] range",
          { min, max, fixedValues }
        );
      }
    }
  }

  // Format label function with decimal handling
  const defaultFormatLabel = useCallback(
    (val: number) => {
      const decimals = getDecimalPrecision(step);
      if (decimals > 0) {
        return val.toFixed(decimals);
      }
      const rounded = Math.round(val);
      return Number.isInteger(rounded)
        ? rounded.toString()
        : rounded.toFixed(2);
    },
    [step]
  );

  const labelFormatter = formatLabel || defaultFormatLabel;

  // Initialize range calculations (handles both fixed and step-based modes)
  const {
    getValueAtIndex,
    totalSteps,
    getClosestIndex,
    fixedValuesMap,
    getClosestValue,
    getPercentage,
  } = useRangeCalculations({ min, max, step, fixedValues });

  // Initialize range state management
  const { state, updateMinValue, updateMaxValue } = useRangeState({
    initialMinValue,
    initialMaxValue,
    onChange,
    getValueAtIndex,
    getClosestIndex,
    totalSteps,
  });

  // Derive current values from indices
  const minValue = getValueAtIndex(state.minIndex);
  const maxValue = getValueAtIndex(state.maxIndex);

  // Convert mouse/touch position to value
  const getValueFromPosition = useCallback(
    (clientX: number): number => {
      if (!rangeRef.current) return min;

      const rect = rangeRef.current.getBoundingClientRect();
      const percentage = Math.max(
        0,
        Math.min(100, ((clientX - rect.left) / rect.width) * 100)
      );
      const value = min + (percentage / 100) * (max - min);

      return fixedValues ? getClosestValue(value) : value;
    },
    [min, max, fixedValues, getClosestValue]
  );

  // Track multi-touch state and current values
  const isMultiTouchRef = useRef(false);
  const currentValuesRef = useRef({ min: minValue, max: maxValue });

  useEffect(() => {
    currentValuesRef.current = { min: minValue, max: maxValue };
  }, [minValue, maxValue]);

  // Handle drag movement with multi-touch prevention logic
  const handleDragMove = useCallback(
    (handle: RangeThumbType, clientX: number) => {
      const newValue = getValueFromPosition(clientX);
      const { min: currentMin, max: currentMax } = currentValuesRef.current;

      let clampedValue = newValue;
      const isMin = handle === RangeThumbType.Min;

      // Prevent thumbs from crossing during multi-touch
      if (isMultiTouchRef.current && fixedValues && fixedValuesMap) {
        const otherValue = isMin ? currentMax : currentMin;
        const otherIndex = fixedValuesMap.get(otherValue) ?? 0;
        const allowedIndex = isMin
          ? Math.max(0, otherIndex - 1)
          : Math.min(fixedValues.length - 1, otherIndex + 1);
        const allowedValue = fixedValues[allowedIndex];
        clampedValue = isMin
          ? Math.min(newValue, allowedValue)
          : Math.max(newValue, allowedValue);
      } else if (isMultiTouchRef.current) {
        clampedValue = isMin
          ? Math.min(newValue, currentMax)
          : Math.max(newValue, currentMin);
      }

      if (isMin) {
        updateMinValue(clampedValue);
      } else {
        updateMaxValue(clampedValue);
      }
    },
    [
      getValueFromPosition,
      updateMinValue,
      updateMaxValue,
      fixedValues,
      fixedValuesMap,
    ]
  );

  // Initialize draggable behavior
  const { dragging, isMultiTouch, handleMouseDown } =
    useDraggable<RangeThumbType>({
      onDragMove: handleDragMove,
    });

  useEffect(() => {
    isMultiTouchRef.current = isMultiTouch;
  }, [isMultiTouch]);

  // Initialize editable label behavior
  const {
    editingLabel,
    tempValue,
    minInputRef,
    maxInputRef,
    handleLabelClick,
    commitEdit,
    handleInputChange,
    handleInputKeyDown,
  } = useEditableLabel({
    editable,
    fixedValues,
    updateMinValue,
    updateMaxValue,
    dragging,
  });

  // Calculate visual percentages for thumbs
  const minPercentage = getPercentage(minValue);
  const maxPercentage = getPercentage(maxValue);

  // Adjust thumb positions to prevent visual overlap
  const minVisualSeparation = 3;
  const { min: adjustedMin, max: adjustedMax } = useMemo(() => {
    const diff = maxPercentage - minPercentage;

    if (diff >= minVisualSeparation || diff <= 0) {
      return { min: minPercentage, max: maxPercentage };
    }

    return {
      min: Math.max(0, maxPercentage - minVisualSeparation),
      max: Math.min(100, minPercentage + minVisualSeparation),
    };
  }, [minPercentage, maxPercentage]);

  // Empty handler for non-editing state (prevents hydration issues)
  const emptyHandler = useCallback(() => {}, []);

  // Render component
  return (
    <div className={styles.container}>
      <div className={styles.labelsContainer}>
        {([RangeThumbType.Min, RangeThumbType.Max] as const).map((type) => {
          const value = type === RangeThumbType.Min ? minValue : maxValue;
          const inputRef =
            type === RangeThumbType.Min ? minInputRef : maxInputRef;
          const isEditing = editingLabel === type;
          const isInputEditable = editable && !fixedValues;

          return (
            <NumericInput
              key={type}
              id={`range-${type}-input`}
              value={isEditing ? tempValue : labelFormatter(value)}
              onChange={isEditing ? handleInputChange : emptyHandler}
              onBlur={isEditing ? commitEdit : undefined}
              onKeyDown={isEditing ? handleInputKeyDown : undefined}
              onFocus={
                isInputEditable && !isEditing
                  ? () => handleLabelClick(type)
                  : undefined
              }
              onClick={
                isInputEditable ? () => handleLabelClick(type) : undefined
              }
              inputRef={inputRef}
              readOnly={!editable || !!fixedValues}
            />
          );
        })}
      </div>

      <div className={styles.rangeContainer} ref={rangeRef}>
        <span className={styles.track} />
        <span
          className={styles.activeTrack}
          style={{
            left: `${adjustedMin}%`,
            width: `${adjustedMax - adjustedMin}%`,
          }}
        />

        {(
          [
            { type: RangeThumbType.Min, percentage: adjustedMin },
            { type: RangeThumbType.Max, percentage: adjustedMax },
          ] as const
        ).map(({ type, percentage }) => (
          <RangeThumb
            key={type}
            id={`range-${type}-handle`}
            type={type}
            percentage={percentage}
            isDragging={dragging === type}
            onMouseDown={handleMouseDown(type)}
            onTouchStart={handleMouseDown(type)}
          />
        ))}
      </div>
    </div>
  );
};
