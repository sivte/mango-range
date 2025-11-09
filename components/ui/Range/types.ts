/**
 * Enum for range thumb types
 */
export enum RangeThumbType {
  Min = "min",
  Max = "max",
}

export interface RangeProps {
  min: number;
  max: number;
  initialMinValue?: number;
  initialMaxValue?: number;
  fixedValues?: number[];
  editable?: boolean;
  onChange?: (min: number, max: number) => void;
  formatLabel?: (value: number) => string;
  step?: number;
}

export interface RangeThumbProps {
  id: string;
  type: RangeThumbType;
  percentage: number;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onTouchStart: (e: React.TouchEvent<HTMLButtonElement>) => void;
}

export interface RangeState {
  minIndex: number;
  maxIndex: number;
}
