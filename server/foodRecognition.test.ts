import { describe, it, expect, vi, beforeEach } from "vitest";
import { recognizeFoodFromPhoto, recognizeFoodFromVoice, recognizeFoodFromPhotoAndVoice } from "./foodRecognition";

// Mock the LLM and transcription functions
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

vi.mock("./_core/voiceTranscription", () => ({
  transcribeAudio: vi.fn(),
}));

import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";

describe("Food Recognition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("recognizeFoodFromPhoto", () => {
    it("should recognize food from photo and return structured data", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                foods: [
                  {
                    name: "grilled chicken breast",
                    portionSize: "3 oz",
                    calories: 140,
                    protein: 26,
                    carbs: 0,
                    fat: 3,
                  },
                ],
                analysis: "Grilled chicken breast with minimal seasoning",
              }),
            },
          },
        ],
      };

      vi.mocked(invokeLLM).mockResolvedValue(mockResponse);

      const result = await recognizeFoodFromPhoto("https://example.com/food.jpg");

      expect(result.foods).toHaveLength(1);
      expect(result.foods[0].name).toBe("grilled chicken breast");
      expect(result.foods[0].calories).toBe(140);
      expect(result.foods[0].protein).toBe(26);
      expect(result.analysis).toBeDefined();
    });

    it("should handle multiple foods in one image", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                foods: [
                  {
                    name: "rice",
                    portionSize: "1 cup",
                    calories: 206,
                    protein: 4,
                    carbs: 45,
                    fat: 0,
                  },
                  {
                    name: "broccoli",
                    portionSize: "1 cup",
                    calories: 55,
                    protein: 4,
                    carbs: 11,
                    fat: 1,
                  },
                ],
                analysis: "Rice and steamed broccoli",
              }),
            },
          },
        ],
      };

      vi.mocked(invokeLLM).mockResolvedValue(mockResponse);

      const result = await recognizeFoodFromPhoto("https://example.com/food.jpg");

      expect(result.foods).toHaveLength(2);
      expect(result.foods[0].name).toBe("rice");
      expect(result.foods[1].name).toBe("broccoli");
    });

    it("should throw error if LLM returns invalid JSON", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: "This is not JSON",
            },
          },
        ],
      };

      vi.mocked(invokeLLM).mockResolvedValue(mockResponse);

      await expect(recognizeFoodFromPhoto("https://example.com/food.jpg")).rejects.toThrow();
    });
  });

  describe("recognizeFoodFromVoice", () => {
    it("should recognize food from voice description", async () => {
      const mockTranscription = {
        text: "I had a bowl of pasta with marinara sauce",
        language: "en",
        segments: [],
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                foods: [
                  {
                    name: "pasta with marinara sauce",
                    portionSize: "1 bowl",
                    calories: 350,
                    protein: 12,
                    carbs: 60,
                    fat: 8,
                  },
                ],
                analysis: "Pasta with marinara sauce",
              }),
            },
          },
        ],
      };

      vi.mocked(transcribeAudio).mockResolvedValue(mockTranscription);
      vi.mocked(invokeLLM).mockResolvedValue(mockResponse);

      const result = await recognizeFoodFromVoice("https://example.com/audio.webm");

      expect(result.foods).toHaveLength(1);
      expect(result.foods[0].name).toContain("pasta");
      expect(result.foods[0].calories).toBe(350);
    });

    it("should handle transcription errors gracefully", async () => {
      const mockError = {
        error: "Transcription failed",
        code: "TRANSCRIPTION_FAILED" as const,
      };

      vi.mocked(transcribeAudio).mockResolvedValue(mockError);

      await expect(recognizeFoodFromVoice("https://example.com/audio.webm")).rejects.toThrow();
    });
  });

  describe("recognizeFoodFromPhotoAndVoice", () => {
    it("should combine photo and voice for better recognition", async () => {
      const mockTranscription = {
        text: "This is grilled salmon with lemon",
        language: "en",
        segments: [],
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                foods: [
                  {
                    name: "grilled salmon",
                    portionSize: "6 oz",
                    calories: 280,
                    protein: 34,
                    carbs: 0,
                    fat: 15,
                  },
                ],
                analysis: "Grilled salmon with lemon garnish",
              }),
            },
          },
        ],
      };

      vi.mocked(transcribeAudio).mockResolvedValue(mockTranscription);
      vi.mocked(invokeLLM).mockResolvedValue(mockResponse);

      const result = await recognizeFoodFromPhotoAndVoice(
        "https://example.com/food.jpg",
        "https://example.com/audio.webm"
      );

      expect(result.foods).toHaveLength(1);
      expect(result.foods[0].name).toBe("grilled salmon");
      expect(result.foods[0].protein).toBe(34);
    });

    it("should use voice description to clarify portion sizes", async () => {
      const mockTranscription = {
        text: "A large serving of chicken, about 8 ounces",
        language: "en",
        segments: [],
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                foods: [
                  {
                    name: "grilled chicken",
                    portionSize: "8 oz",
                    calories: 280,
                    protein: 52,
                    carbs: 0,
                    fat: 6,
                  },
                ],
                analysis: "Large grilled chicken portion",
              }),
            },
          },
        ],
      };

      vi.mocked(transcribeAudio).mockResolvedValue(mockTranscription);
      vi.mocked(invokeLLM).mockResolvedValue(mockResponse);

      const result = await recognizeFoodFromPhotoAndVoice(
        "https://example.com/food.jpg",
        "https://example.com/audio.webm"
      );

      expect(result.foods[0].portionSize).toBe("8 oz");
      expect(result.foods[0].protein).toBe(52);
    });
  });

  describe("Macro calculation accuracy", () => {
    it("should provide conservative macro estimates", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                foods: [
                  {
                    name: "pizza slice",
                    portionSize: "1 slice",
                    calories: 285,
                    protein: 12,
                    carbs: 36,
                    fat: 10,
                  },
                ],
                analysis: "Single slice of pepperoni pizza",
              }),
            },
          },
        ],
      };

      vi.mocked(invokeLLM).mockResolvedValue(mockResponse);

      const result = await recognizeFoodFromPhoto("https://example.com/pizza.jpg");

      // Verify macros are reasonable
      expect(result.foods[0].calories).toBeGreaterThan(0);
      expect(result.foods[0].protein).toBeGreaterThan(0);
      expect(result.foods[0].carbs).toBeGreaterThan(0);
      expect(result.foods[0].fat).toBeGreaterThan(0);

      // Verify macro ratios are plausible (rough check)
      const caloriesFromMacros =
        result.foods[0].protein * 4 +
        result.foods[0].carbs * 4 +
        result.foods[0].fat * 9;
      expect(Math.abs(caloriesFromMacros - result.foods[0].calories)).toBeLessThan(50);
    });
  });
});
