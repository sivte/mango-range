"use client";

import React from "react";
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
}) => {
  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="numeric"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onClick={onClick}
      onFocus={onFocus}
      className={styles.input}
      disabled={disabled}
      readOnly={readOnly}
    />
  );
};
