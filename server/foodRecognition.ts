import { invokeLLM } from "./_core/llm";
import { transcribeAudio, TranscriptionError } from "./_core/voiceTranscription";

interface FoodItem {
  name: string;
  portionSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodRecognitionResult {
  foods: FoodItem[];
  analysis: string;
}

/**
 * Recognize foods from photo using Gemini Vision API
 */
export async function recognizeFoodFromPhoto(imageUrl: string): Promise<FoodRecognitionResult> {
  const prompt = `Analyze this food image and identify all visible food items. For each item, provide:
1. Food name
2. Estimated portion size (e.g., "1 cup", "100g", "3 oz")
3. Estimated macros per serving:
   - Calories
   - Protein (grams)
   - Carbohydrates (grams)
   - Fat (grams)

Format response as JSON with this structure:
{
  "foods": [
    {
      "name": "grilled chicken breast",
      "portionSize": "3 oz",
      "calories": 140,
      "protein": 26,
      "carbs": 0,
      "fat": 3
    }
  ],
  "analysis": "Brief description of what you see in the image"
}

Be conservative with calorie estimates. If unsure, estimate on the lower side.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("No response from AI");
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response");
    }

    const result = JSON.parse(jsonMatch[0]) as FoodRecognitionResult;
    return result;
  } catch (error) {
    console.error("[FoodRecognition] Photo analysis error:", error);
    throw error;
  }
}

/**
 * Recognize foods from voice description
 */
export async function recognizeFoodFromVoice(audioUrl: string): Promise<FoodRecognitionResult> {
  try {
    // Transcribe audio to text
    const transcription = await transcribeAudio({
      audioUrl,
      language: "en",
      prompt: "Transcribe food description",
    });

    // Check if transcription was successful
    if ('error' in transcription) {
      throw new Error(`Transcription failed: ${transcription.error}`);
    }

    const text = transcription.text || "";

    // Use Gemini to analyze food description
    const prompt = `The user described their food as: "${text}"

Based on this description, identify the food items and estimate their macros. Provide:
1. Food name
2. Estimated portion size
3. Estimated macros per serving:
   - Calories
   - Protein (grams)
   - Carbohydrates (grams)
   - Fat (grams)

Format response as JSON with this structure:
{
  "foods": [
    {
      "name": "food name",
      "portionSize": "portion",
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0
    }
  ],
  "analysis": "Brief summary of the food description"
}

Be conservative with estimates. If unsure, estimate on the lower side.`;

    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("No response from AI");
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response");
    }

    const result = JSON.parse(jsonMatch[0]) as FoodRecognitionResult;
    return result;
  } catch (error) {
    console.error("[FoodRecognition] Voice analysis error:", error);
    throw error;
  }
}

/**
 * Recognize foods from photo + voice description
 */
export async function recognizeFoodFromPhotoAndVoice(
  imageUrl: string,
  audioUrl: string
): Promise<FoodRecognitionResult> {
  try {
    // Transcribe audio
    const transcription = await transcribeAudio({
      audioUrl,
      language: "en",
      prompt: "Transcribe food description",
    });

    // Check if transcription was successful
    if ('error' in transcription) {
      throw new Error(`Transcription failed: ${transcription.error}`);
    }

    const voiceDescription = transcription.text || "";

    // Use Gemini with both image and voice context
    const prompt = `Analyze this food image. The user also described it as: "${voiceDescription}"

Based on the image and description, identify all food items and estimate their macros. Provide:
1. Food name
2. Estimated portion size
3. Estimated macros per serving:
   - Calories
   - Protein (grams)
   - Carbohydrates (grams)
   - Fat (grams)

Format response as JSON with this structure:
{
  "foods": [
    {
      "name": "food name",
      "portionSize": "portion",
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0
    }
  ],
  "analysis": "Brief description combining image and voice input"
}

Use the voice description to clarify portion sizes and ingredients. Be conservative with estimates.`;

    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("No response from AI");
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response");
    }

    const result = JSON.parse(jsonMatch[0]) as FoodRecognitionResult;
    return result;
  } catch (error) {
    console.error("[FoodRecognition] Photo+voice analysis error:", error);
    throw error;
  }
}
