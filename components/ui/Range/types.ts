// Orientation type
export type Orientation = "horizontal" | "vertical";

// Thumb handle types
export type ThumbHandle = "min" | "max";

export interface ThumbProps {
  ref: React.RefObject<HTMLButtonElement | null>;
  id: string;
  percentageX: number;
  percentageY: number;
  isDragging: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
}

export interface RangeBarProps {
  minPercentage: number;
  maxPercentage: number;
  orientation?: Orientation;
}

export interface RangeProps {
  min?: number;
  max?: number;
  value?: [number, number]; // Controlled mode - [minValue, maxValue]
  defaultValue?: [number, number]; // Uncontrolled mode - [defaultMin, defaultMax]
  onChange?: (value: [number, number]) => void;
  orientation?: Orientation;
  step?: number;
  disabled?: boolean;
  className?: string;
  allowPush?: boolean;
  thumbGap?: number;
  showInputs?: boolean;
  disabledInputs?: boolean;
  fixedValues?: number[];
  formatLabel?: (value: number) => string;
}
