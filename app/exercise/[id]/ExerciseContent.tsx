"use client";

import { useState } from "react";
import { Range } from "@/components/ui/Range/Range";
import type { ExerciseConfig } from "@/types";

interface ExerciseContentProps {
  exerciseId: string;
  config: ExerciseConfig;
}

export function ExerciseContent({ exerciseId, config }: ExerciseContentProps) {
  const formatCurrency = (value: number): string => {
    return `${value.toFixed(2)}€`;
  };

  const sortedRangeValues =
    "rangeValues" in config
      ? [...config.rangeValues].sort((a, b) => a - b)
      : null;

  const [minValue, setMinValue] = useState(() => {
    if ("min" in config && "max" in config) {
      return config.min;
    }
    if (sortedRangeValues) {
      return sortedRangeValues[0];
    }
    return 0;
  });

  const [maxValue, setMaxValue] = useState(() => {
    if ("min" in config && "max" in config) {
      return config.max;
    }
    if (sortedRangeValues) {
      return sortedRangeValues[sortedRangeValues.length - 1];
    }
    return 100;
  });

  const handleChange = (newMin: number, newMax: number) => {
    setMinValue(newMin);
    setMaxValue(newMax);
  };

  return (
    <>
      <p
        className="text-sm mb-15 text-center"
        style={{ color: "var(--text-secondary)" }}
      >
        {exerciseId === "1" && "min" in config && "max" in config && (
          <>
            Normal range
            <br />
            {config.min} - {config.max}
          </>
        )}
        {exerciseId === "2" && "rangeValues" in config && (
          <>
            Fixed values range
            <br />[{config.rangeValues.map((v) => formatCurrency(v)).join(", ")}
            ]
          </>
        )}
      </p>

      {"min" in config && "max" in config ? (
        <Range
          min={config.min}
          max={config.max}
          minValue={minValue}
          maxValue={maxValue}
          step={1}
          showInputs={true}
          onChange={handleChange}
          thumbGap={2}
        />
      ) : (
        "rangeValues" in config && (
          <Range
            fixedValues={config.rangeValues}
            minValue={minValue}
            maxValue={maxValue}
            onChange={handleChange}
            formatLabel={formatCurrency}
            showInputs={true}
            disabledInputs={true}
          />
        )
      )}
    </>
  );
}
