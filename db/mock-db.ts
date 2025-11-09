import type { Exercise } from "@/types/exercise.types";

/**
 * In-memory database store
 * Simulates persistent data that would normally be in a database
 */
const exercises: Map<string, Exercise> = new Map([
  [
    "1",
    {
      id: "1",
      type: "normal",
      config: {
        min: 1,
        max: 100,
      },
    },
  ],
  [
    "2",
    {
      id: "2",
      type: "fixed",
      config: {
        rangeValues: [1.99, 5.99, 10.99, 30.99, 50.99, 70.99],
      },
    },
  ],
]);

/**
 * Simulates database query delay
 * In production, this would be actual network/database latency
 */
const simulateDelay = async (ms: number = 10): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Database interface - Simulates database operations
 */
export const db = {
  async findExerciseById(id: string): Promise<Exercise | null> {
    await simulateDelay();
    return exercises.get(id) || null;
  },
};
