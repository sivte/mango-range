export interface NumericInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClick?: () => void;
  onFocus?: () => void;
  id?: string;
  disabled?: boolean;
  readOnly?: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
}
