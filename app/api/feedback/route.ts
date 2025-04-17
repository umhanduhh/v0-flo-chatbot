import { NextResponse } from "next/server"
import { recordFeedback } from "@/lib/analytics"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { sessionId, messageId, rating, feedback } = await req.json()

    if (!sessionId || !messageId || rating === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    // Record the feedback
    await recordFeedback(sessionId, messageId, rating, feedback)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error recording feedback:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
