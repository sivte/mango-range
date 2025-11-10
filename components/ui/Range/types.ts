// Orientation type
export type Orientation = "horizontal" | "vertical";

// Thumb handle types
export type ThumbHandle = "min" | "max";

export interface ThumbProps {
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
  minValue: number;
  maxValue: number;
  onChange?: (minValue: number, maxValue: number) => void;
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
