/**
 * Exercise Service
 *
 * Implements the Service pattern - contains business logic
 * Acts as an intermediary between controllers (API routes) and repositories
 */

import { exerciseRepository } from "@/repositories/exercise.repository";
import type {
  ExerciseConfig,
  NormalRangeConfig,
  FixedValuesRangeConfig,
} from "@/types/exercise.types";

export class ExerciseService {
  /**
   * Get exercise configuration by ID with business validation
   * @param id - Exercise identifier
   * @returns Exercise configuration
   * @throws Error if exercise not found or invalid
   */
  async getExerciseConfig(id: string): Promise<ExerciseConfig> {
    if (!id || id.trim() === "") {
      throw new Error("Exercise ID is required");
    }

    const config = await exerciseRepository.getExerciseConfigById(id);

    if (!config) {
      throw new Error(`Exercise with ID ${id} not found`);
    }

    this.validateExerciseConfig(config);

    return config;
  }

  /**
   * Validate exercise configuration follows business rules
   * @param config - Exercise configuration to validate
   * @throws Error if validation fails
   */
  private validateExerciseConfig(config: ExerciseConfig): void {
    if ("min" in config && "max" in config) {
      // Validate normal range
      const normalConfig = config as NormalRangeConfig;
      if (normalConfig.min >= normalConfig.max) {
        throw new Error("Min value must be less than max value");
      }
      if (normalConfig.min < 0) {
        throw new Error("Min value cannot be negative");
      }
    } else if ("rangeValues" in config) {
      // Validate fixed values range
      const fixedConfig = config as FixedValuesRangeConfig;
      if (!Array.isArray(fixedConfig.rangeValues)) {
        throw new Error("Range values must be an array");
      }
      if (fixedConfig.rangeValues.length < 2) {
        throw new Error("Range values must contain at least 2 values");
      }
      // Ensure values are sorted
      const sorted = [...fixedConfig.rangeValues].sort((a, b) => a - b);
      const isSorted = fixedConfig.rangeValues.every(
        (val, idx) => val === sorted[idx]
      );
      if (!isSorted) {
        throw new Error("Range values must be sorted in ascending order");
      }
    } else {
      throw new Error("Invalid exercise configuration");
    }
  }
}

export const exerciseService = new ExerciseService();
