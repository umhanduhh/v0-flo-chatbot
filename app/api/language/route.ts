import { NextResponse } from "next/server"
import { setUserLanguagePreference } from "@/lib/language"
import { cookies } from "next/headers"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { sessionId, languageCode } = await req.json()

    if (!sessionId || !languageCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Store language preference
    await setUserLanguagePreference(sessionId, languageCode)

    // Set a cookie for the language preference
    const cookieStore = cookies()
    cookieStore.set("preferred_language", languageCode, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error setting language preference:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const sessionId = url.searchParams.get("sessionId")

    if (!sessionId) {
      // Return default language if no session ID
      return NextResponse.json({ languageCode: "en" })
    }

    // Get language preference from database
    const cookieStore = cookies()
    const preferredLanguage = cookieStore.get("preferred_language")?.value || "en"

    return NextResponse.json({ languageCode: preferredLanguage })
  } catch (error) {
    console.error("Error getting language preference:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
