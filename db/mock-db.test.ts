import { describe, it, expect } from "vitest";
import { db } from "./mock-db";

describe("MockDatabase", () => {
  describe("findExerciseById", () => {
    it("should return exercise 1 with correct config", async () => {
      const exercise = await db.findExerciseById("1");

      expect(exercise).toBeDefined();
      expect(exercise?.id).toBe("1");
      expect(exercise?.type).toBe("normal");
      if (exercise && exercise.type === "normal") {
        expect(exercise.config.min).toBe(1);
        expect(exercise.config.max).toBe(100);
      }
    });

    it("should return exercise 2 with correct config", async () => {
      const exercise = await db.findExerciseById("2");

      expect(exercise).toBeDefined();
      expect(exercise?.id).toBe("2");
      expect(exercise?.type).toBe("fixed");
      if (exercise && exercise.type === "fixed") {
        expect(exercise.config.rangeValues).toEqual([
          1.99, 5.99, 10.99, 30.99, 50.99, 70.99,
        ]);
      }
    });

    it("should return null for non-existent exercise", async () => {
      const exercise = await db.findExerciseById("999");
      expect(exercise).toBeNull();
    });
  });
});
