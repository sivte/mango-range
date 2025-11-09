import { describe, it, expect } from "vitest";
import { exerciseRepository } from "./exercise.repository";

describe("ExerciseRepository", () => {
  describe("getExerciseById", () => {
    it("should return exercise 1", async () => {
      const exercise = await exerciseRepository.getExerciseById("1");

      expect(exercise).toBeDefined();
      expect(exercise?.id).toBe("1");
      expect(exercise?.type).toBe("normal");
    });

    it("should return exercise 2", async () => {
      const exercise = await exerciseRepository.getExerciseById("2");

      expect(exercise).toBeDefined();
      expect(exercise?.id).toBe("2");
      expect(exercise?.type).toBe("fixed");
    });

    it("should return null for non-existent exercise", async () => {
      const exercise = await exerciseRepository.getExerciseById("999");

      expect(exercise).toBeNull();
    });
  });

  describe("getExerciseConfigById", () => {
    it("should return config for exercise 1", async () => {
      const config = await exerciseRepository.getExerciseConfigById("1");

      expect(config).toBeDefined();
      if (config && "min" in config && "max" in config) {
        expect(config.min).toBe(1);
        expect(config.max).toBe(100);
      } else {
        throw new Error("Expected normal range config");
      }
    });

    it("should return config for exercise 2", async () => {
      const config = await exerciseRepository.getExerciseConfigById("2");

      expect(config).toBeDefined();
      if (config && "rangeValues" in config) {
        expect(config.rangeValues).toEqual([
          1.99, 5.99, 10.99, 30.99, 50.99, 70.99,
        ]);
      } else {
        throw new Error("Expected fixed values config");
      }
    });

    it("should return null for non-existent exercise", async () => {
      const config = await exerciseRepository.getExerciseConfigById("999");

      expect(config).toBeNull();
    });
  });
});
