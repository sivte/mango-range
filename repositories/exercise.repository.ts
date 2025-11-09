import { db } from "@/db/mock-db";
import type { Exercise, ExerciseConfig } from "@/types/exercise.types";

/**
 * Exercise Repository
 *
 * Implements the Repository pattern - responsible for data access logic
 */

export class ExerciseRepository {
  /**
   * Get exercise configuration by ID
   * @param id - Exercise identifier
   * @returns Exercise configuration or null if not found
   */
  async getExerciseById(id: string): Promise<Exercise | null> {
    try {
      const exercise = await db.findExerciseById(id);
      return exercise;
    } catch (error) {
      console.error(`Error fetching exercise ${id}:`, error);
      throw new Error("Failed to fetch exercise data");
    }
  }

  /**
   * Get only the config for a specific exercise
   * @param id - Exercise identifier
   * @returns Exercise configuration or null
   */
  async getExerciseConfigById(id: string): Promise<ExerciseConfig | null> {
    const exercise = await this.getExerciseById(id);
    return exercise ? exercise.config : null;
  }
}

// Singleton instance - reuse across the application
export const exerciseRepository = new ExerciseRepository();
