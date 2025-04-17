import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { sql } from "./db"

// Supported languages with their codes and display names
export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "tl", name: "Tagalog", flag: "🇵🇭" },
]

// Default language
export const DEFAULT_LANGUAGE = "en"

// Function to detect the language of a text
export async function detectLanguage(text: string): Promise<string> {
  try {
    const { text: detectedLanguage } = await generateText({
      model: openai("gpt-3.5-turbo"),
      prompt: `
        Detect the language of the following text and respond with only the ISO 639-1 language code (e.g., "en" for English, "es" for Spanish, etc.).
        If you're unsure, respond with "en".
        
        Text: "${text}"
        
        Language code:
      `,
      temperature: 0.3,
      maxTokens: 10,
    })

    // Clean up the response
    const languageCode = detectedLanguage.trim().toLowerCase()

    // Check if it's a supported language
    if (SUPPORTED_LANGUAGES.some((lang) => lang.code === languageCode)) {
      return languageCode
    }

    // Default to English if not supported
    return DEFAULT_LANGUAGE
  } catch (error) {
    console.error("Error detecting language:", error)
    return DEFAULT_LANGUAGE
  }
}

// Function to translate text to a target language
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  // If target language is English, no need to translate
  if (targetLanguage === "en") {
    return text
  }

  try {
    const { text: translatedText } = await generateText({
      model: openai("gpt-3.5-turbo"),
      prompt: `
        Translate the following text to ${getLanguageName(targetLanguage)}. 
        Maintain the same tone, formatting, and meaning.
        
        Text: "${text}"
        
        Translation:
      `,
      temperature: 0.3,
      maxTokens: 1000,
    })

    return translatedText.trim()
  } catch (error) {
    console.error("Error translating text:", error)
    return text // Return original text if translation fails
  }
}

// Function to get language name from code
export function getLanguageName(code: string): string {
  const language = SUPPORTED_LANGUAGES.find((lang) => lang.code === code)
  return language ? language.name : "English"
}

// Function to get language flag from code
export function getLanguageFlag(code: string): string {
  const language = SUPPORTED_LANGUAGES.find((lang) => lang.code === code)
  return language ? language.flag : "🇺🇸"
}

// Function to store user language preference
export async function setUserLanguagePreference(sessionId: string, languageCode: string): Promise<void> {
  try {
    // Check if session exists
    const session = await sql`
      SELECT id FROM chat_sessions
      WHERE id = ${sessionId}
    `

    if (session.length === 0) {
      throw new Error("Session not found")
    }

    // Update session with language preference
    await sql`
      UPDATE chat_sessions
      SET metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{language}',
        ${JSON.stringify(languageCode)}::jsonb
      )
      WHERE id = ${sessionId}
    `
  } catch (error) {
    console.error("Error setting language preference:", error)
    throw error
  }
}

// Function to get user language preference
export async function getUserLanguagePreference(sessionId: string): Promise<string> {
  try {
    const result = await sql`
      SELECT metadata->>'language' as language
      FROM chat_sessions
      WHERE id = ${sessionId}
    `

    if (result.length > 0 && result[0].language) {
      return result[0].language
    }

    return DEFAULT_LANGUAGE
  } catch (error) {
    console.error("Error getting language preference:", error)
    return DEFAULT_LANGUAGE
  }
}

// Function to localize the system prompt
export async function localizeSystemPrompt(systemPrompt: string, languageCode: string): Promise<string> {
  // If language is English, return the original prompt
  if (languageCode === "en") {
    return systemPrompt
  }

  try {
    const { text: localizedPrompt } = await generateText({
      model: openai("gpt-3.5-turbo"),
      prompt: `
        Translate the following system prompt to ${getLanguageName(languageCode)}. 
        This is a system prompt for an AI assistant named Flo who helps healthcare professionals using Clipboard Health.
        Maintain the same instructions, tone, and meaning.
        
        System Prompt: "${systemPrompt}"
        
        Translated System Prompt:
      `,
      temperature: 0.3,
      maxTokens: 2000,
    })

    return localizedPrompt.trim()
  } catch (error) {
    console.error("Error localizing system prompt:", error)
    return systemPrompt // Return original prompt if localization fails
  }
}
