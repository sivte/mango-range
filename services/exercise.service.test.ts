import { describe, it, expect } from "vitest";
import { exerciseService } from "./exercise.service";

describe("ExerciseService", () => {
  describe("getExerciseConfig", () => {
    it("should return config for exercise 1", async () => {
      const config = await exerciseService.getExerciseConfig("1");

      expect(config).toBeDefined();
      if ("min" in config && "max" in config) {
        expect(config.min).toBe(1);
        expect(config.max).toBe(100);
      } else {
        throw new Error("Expected normal range config");
      }
    });

    it("should return config for exercise 2", async () => {
      const config = await exerciseService.getExerciseConfig("2");

      expect(config).toBeDefined();
      if ("rangeValues" in config) {
        expect(config.rangeValues).toEqual([
          1.99, 5.99, 10.99, 30.99, 50.99, 70.99,
        ]);
      } else {
        throw new Error("Expected fixed values config");
      }
    });

    it("should throw error for non-existent exercise", async () => {
      await expect(exerciseService.getExerciseConfig("999")).rejects.toThrow(
        "not found"
      );
    });

    it("should throw error for empty ID", async () => {
      await expect(exerciseService.getExerciseConfig("")).rejects.toThrow(
        "Exercise ID is required"
      );
    });

    it("should throw error for whitespace-only ID", async () => {
      await expect(exerciseService.getExerciseConfig("   ")).rejects.toThrow(
        "Exercise ID is required"
      );
    });
  });
});
