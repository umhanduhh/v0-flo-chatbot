import { NextResponse } from "next/server"
import { getQuestionAnalytics, getFeedbackAnalytics, getConversationMetrics } from "@/lib/analytics"

export const runtime = "nodejs"

export async function GET() {
  try {
    // Get all analytics data
    const [questionAnalytics, feedbackAnalytics, conversationMetrics] = await Promise.all([
      getQuestionAnalytics(),
      getFeedbackAnalytics(),
      getConversationMetrics(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        questionAnalytics,
        feedbackAnalytics,
        conversationMetrics,
      },
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
