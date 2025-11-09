"use server";

import { exerciseService } from "@/services/exercise.service";
import type { ExerciseConfig } from "@/types";

/**
 * Get exercise configuration by ID
 * @param id - Exercise identifier
 * @returns Exercise configuration
 * @throws Error if exercise not found
 */
export async function getExerciseConfig(id: string): Promise<ExerciseConfig> {
  try {
    const config = await exerciseService.getExerciseConfig(id);
    return config;
  } catch (error) {
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Failed to fetch exercise configuration");
  }
}
