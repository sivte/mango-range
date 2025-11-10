"use client";

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
          defaultValue={[config.min, config.max]}
          step={1}
          showInputs={true}
          thumbGap={2}
        />
      ) : (
        "rangeValues" in config && (
          <Range
            fixedValues={config.rangeValues}
            formatLabel={formatCurrency}
            showInputs={true}
            disabledInputs={true}
          />
        )
      )}
    </>
  );
}
