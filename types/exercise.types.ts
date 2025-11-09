export interface NormalRangeConfig {
  min: number;
  max: number;
}

export interface FixedValuesRangeConfig {
  rangeValues: number[];
}

export type ExerciseConfig = NormalRangeConfig | FixedValuesRangeConfig;

export type Exercise =
  | {
      id: string;
      type: "normal";
      config: NormalRangeConfig;
    }
  | {
      id: string;
      type: "fixed";
      config: FixedValuesRangeConfig;
    };
