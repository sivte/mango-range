"use client";

import React, { useState } from "react";
import styles from "./NumericInput.module.css";
import type { NumericInputProps } from "./types";

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  onBlur,
  onKeyDown,
  onClick,
  onFocus,
  id,
  disabled = false,
  readOnly = false,
  inputRef,
  formatLabel,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Calcular el valor a mostrar
  const displayValue = isFocused
    ? value
    : formatLabel
    ? (() => {
        const numValue = parseFloat(value);
        return isNaN(numValue) ? value : formatLabel(numValue);
      })()
    : value;

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={onChange}
      onBlur={handleBlur}
      onKeyDown={onKeyDown}
      onClick={onClick}
      onFocus={handleFocus}
      className={styles.input}
      disabled={disabled}
      readOnly={readOnly}
    />
  );
};
