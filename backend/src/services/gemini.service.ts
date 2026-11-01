import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';
import {
  GenerateIdeasInput,
  GeminiCelebrationIdeasResponse,
  geminiCelebrationIdeasResponseSchema,
} from '../validators/idea.validator.js';

export interface EventPromptContext {
  id: string;
  name: string;
  type: string;
  date: Date | string;
  location: string;
  guestCount: number;
  budget: number;
  currency: string;
  theme?: string | null;
  description?: string | null;
}

export class GeminiService {
  private client: GoogleGenAI | null = null;

  constructor() {
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '') {
      this.client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    }
  }

  /**
   * Constructs the structured prompt adhering strictly to prompt engineering guidelines.
   */
  public buildCelebrationPrompt(
    event: EventPromptContext,
    input: GenerateIdeasInput
  ): string {
    const categoriesList = input.categories.join(', ');
    const prefs = input.preferences || {};

    return `
You are the elite EventPilot AI Celebration Concept Engine.
Generate highly personalized, practical, and culturally authentic celebration ideas strictly tailored to the verified event information below.

VERIFIED EVENT CONTEXT:
- Event Name: ${event.name}
- Event Type: ${event.type}
- Event Date: ${new Date(event.date).toISOString().split('T')[0]}
- Location: ${event.location}
- Total Estimated Budget: ${event.budget > 0 ? `${event.currency} ${Number(event.budget).toLocaleString()}` : 'Budget not specified (do not invent fixed budgets)'}
- Guest Count: ${event.guestCount > 0 ? `${event.guestCount} guests` : 'Guest count not specified'}
- Existing Theme/Style: ${event.theme || 'Not specified'}
- Celebration Description: ${event.description || 'Not specified'}

USER-SPECIFIED PREFERENCES:
- Requested Categories: ${categoriesList}
- Preferred Colors: ${prefs.preferredColors && prefs.preferredColors.length > 0 ? prefs.preferredColors.join(', ') : 'Not specified'}
- Preferred Atmosphere: ${prefs.atmosphere || 'Tailored to event type'}
- Venue Setting Preference: ${prefs.venuePreference || 'flexible'}
- Style Preference: ${prefs.style || 'Not specified'}
- Dietary / Food Preferences: ${prefs.dietaryPreferences || 'None specified (do not make dietary assumptions)'}
- Cultural Elements / Preferences: ${prefs.culturalPreferences || 'Respect regional traditions appropriate for location'}
- Additional Planner Notes: ${prefs.additionalNotes || 'None'}

STRICT GENERATION RULES:
1. Generate concepts ONLY for the requested categories: [${categoriesList}].
2. For each requested category, generate 1 to 2 distinct, highly tailored concepts.
3. Every idea MUST include:
   - "title": Compelling, descriptive concept name.
   - "description": Practical 2-3 sentence overview of the idea.
   - "reason": Clear rationale explaining why it directly fits the user's event type, guest count, location, and atmosphere.
   - "colorPalette": Array of 2 to 4 suggested color names matching the mood.
   - "estimatedCost": Object with "min" (number or null), "max" (number or null), "currency" (e.g. "${event.currency}"), and "basis" (e.g. "Estimated local market range for ${event.guestCount || 100} guests"). Never invent guaranteed quotations; always clarify it is an estimate.
   - "budgetSuitability": Brief note on how it fits the specified budget.
   - "implementationTips": Array of 2 to 3 actionable, real-world execution steps.
   - "alternatives": Array of 1 to 2 cost-effective alternatives preserving the aesthetic.
4. Do NOT fabricate vendor business names or claim venue availability.
5. Return ONLY a valid JSON object matching the schema below. Do not wrap in markdown code blocks (\`\`\`json). Output pure JSON.

REQUIRED JSON OUTPUT FORMAT:
{
  "eventContext": {
    "eventType": "${event.type}",
    "budget": ${Number(event.budget) || 0},
    "guestCount": ${event.guestCount || 0}
  },
  "categories": [
    {
      "category": "category_name",
      "ideas": [
        {
          "title": "Title Here",
          "description": "Description Here",
          "reason": "Why it fits",
          "colorPalette": ["Color 1", "Color 2"],
          "estimatedCost": {
            "min": 25000,
            "max": 40000,
            "currency": "${event.currency}",
            "basis": "Local market estimate"
          },
          "budgetSuitability": "Fits budget comfortably",
          "implementationTips": ["Step 1", "Step 2"],
          "alternatives": ["Budget alternative 1"]
        }
      ]
    }
  ]
}
`.trim();
  }

  /**
   * Calls Google Gemini to generate celebration ideas and validates the output.
   */
  public async generateCelebrationIdeas(
    event: EventPromptContext,
    input: GenerateIdeasInput
  ): Promise<GeminiCelebrationIdeasResponse> {
    const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY' || apiKey.includes('placeholder')) {
      logger.warn('Gemini API key is not configured or is a placeholder.');
      throw ApiError.badRequest(
        'Gemini API key is not configured. Please configure GEMINI_API_KEY in backend environment.'
      );
    }

    if (!this.client) {
      this.client = new GoogleGenAI({ apiKey });
    }

    const configuredModel = env.GEMINI_MODEL || 'gemini-3.5-flash';
    const candidateModels = [...new Set([
      configuredModel,
      'gemini-3-flash-preview',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.8-flash',
    ])];

    const prompt = this.buildCelebrationPrompt(event, input);

    try {
      let response: any = null;
      let lastModelError: any = null;

      for (const modelName of candidateModels) {
        try {
          logger.info({ eventId: event.id, model: modelName }, 'Calling Gemini API for celebration ideas');

          response = await this.client.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.7,
            },
          });

          if (response) {
            logger.info({ eventId: event.id, successfulModel: modelName }, 'Gemini generation successful');
            break;
          }
        } catch (callErr: any) {
          lastModelError = callErr;
          const errMsg = callErr?.message || '';
          const isFallbackError =
            errMsg.includes('404') ||
            errMsg.includes('NOT_FOUND') ||
            errMsg.includes('no longer available') ||
            errMsg.includes('not found') ||
            errMsg.includes('503') ||
            errMsg.includes('UNAVAILABLE') ||
            errMsg.includes('high demand') ||
            errMsg.includes('overloaded') ||
            errMsg.includes('RESOURCE_EXHAUSTED') ||
            errMsg.includes('429');

          if (isFallbackError) {
            logger.warn(
              { modelName, error: errMsg },
              'Gemini model unavailable or experiencing temporary high demand, falling back to next candidate model'
            );
            continue;
          }
          throw callErr;
        }
      }

      if (!response) {
        throw lastModelError || new Error('No candidate Gemini model could fulfill the request');
      }

      // Safely access response text through SDK getter or candidate parts fallback
      let responseText = response.text;
      if (!responseText || responseText.trim() === '') {
        const firstCandidate = response.candidates?.[0];
        if (firstCandidate?.content?.parts && firstCandidate.content.parts.length > 0) {
          responseText = firstCandidate.content.parts
            .map((p: any) => p.text || '')
            .join('')
            .trim();
        }
      }

      if (!responseText || responseText.trim() === '') {
        logger.error('Gemini API returned empty text response');
        throw ApiError.internal('Gemini returned an empty response. Please retry.');
      }

      // Safely extract pure JSON even if wrapped in markdown code blocks or commentary
      let cleanedText = responseText.trim();
      const codeBlockMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (codeBlockMatch) {
        cleanedText = codeBlockMatch[1].trim();
      } else {
        const firstBrace = cleanedText.indexOf('{');
        const lastBrace = cleanedText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleanedText = cleanedText.substring(firstBrace, lastBrace + 1).trim();
        }
      }

      let parsedJson: any;
      try {
        parsedJson = JSON.parse(cleanedText);
      } catch (parseError: any) {
        logger.error({ error: parseError.message, responseText }, 'Failed to parse Gemini JSON response');
        throw ApiError.internal('Gemini returned a malformed response format. Please try again.');
      }

      // Normalize common LLM output variations (e.g. key-per-category vs categories array)
      if (parsedJson && !Array.isArray(parsedJson.categories) && typeof parsedJson === 'object') {
        const normalizedCategories: any[] = [];
        for (const [key, val] of Object.entries(parsedJson)) {
          if (key !== 'eventContext' && Array.isArray(val)) {
            normalizedCategories.push({
              category: key,
              ideas: val,
            });
          }
        }
        if (normalizedCategories.length > 0) {
          parsedJson = {
            eventContext: parsedJson.eventContext,
            categories: normalizedCategories,
          };
        }
      }

      // Validate with strict Zod schema
      const validationResult = geminiCelebrationIdeasResponseSchema.safeParse(parsedJson);
      if (!validationResult.success) {
        logger.error(
          { zodErrors: validationResult.error.format(), parsedJson },
          'Gemini response failed strict schema validation'
        );
        throw ApiError.internal('Gemini generated an invalid ideas structure. Please retry.');
      }

      return validationResult.data;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }

      const errorMessage = error?.message || 'Unknown error during Gemini generation';
      logger.error({ error: errorMessage }, 'Gemini API call failed');

      if (errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        throw ApiError.badRequest('Gemini API rate limit or quota exceeded. Please try again shortly.');
      }

      if (errorMessage.includes('timeout') || errorMessage.includes('DEADLINE_EXCEEDED')) {
        throw ApiError.internal('Gemini request timed out. Please try again.');
      }

      throw ApiError.internal(`AI Ideas generation failed: ${errorMessage}`);
    }
  }
}

export const geminiService = new GeminiService();
