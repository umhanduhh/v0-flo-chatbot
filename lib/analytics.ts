import { sql } from "./db"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

// Categories for questions
const QUESTION_CATEGORIES = [
  "Getting Started",
  "Account Setup",
  "Finding Shifts",
  "Payment",
  "Cancellations",
  "Ratings & Feedback",
  "Technical Issues",
  "Credentials & Documentation",
  "Facility Policies",
  "Other",
]

// Function to track a user question
export async function trackQuestion(sessionId: string, question: string) {
  try {
    // Categorize the question
    const category = await categorizeQuestion(question)

    // Store in the database without embedding
    const result = await sql`
      INSERT INTO question_analytics (session_id, question, category)
      VALUES (${sessionId}, ${question}, ${category})
      RETURNING id
    `

    return result[0].id
  } catch (error) {
    console.error("Error tracking question:", error)
    // Don't throw - analytics errors shouldn't break the main flow
  }
}

// Function to categorize a question using AI
async function categorizeQuestion(question: string) {
  try {
    const { text } = await generateText({
      model: openai("gpt-3.5-turbo"),
      prompt: `
        Categorize the following question into exactly one of these categories:
        ${QUESTION_CATEGORIES.join(", ")}
        
        Question: "${question}"
        
        Category:
      `,
      temperature: 0.3,
      maxTokens: 10,
    })

    // Clean up the response and check if it's a valid category
    const category = text.trim()
    if (QUESTION_CATEGORIES.includes(category)) {
      return category
    }

    // Default to "Other" if the category isn't recognized
    return "Other"
  } catch (error) {
    console.error("Error categorizing question:", error)
    return "Other"
  }
}

// Function to record user feedback
export async function recordFeedback(sessionId: string, messageId: string, rating: number, feedbackText?: string) {
  try {
    await sql`
      INSERT INTO response_feedback (session_id, message_id, rating, feedback_text)
      VALUES (${sessionId}, ${messageId}, ${rating}, ${feedbackText || null})
    `
  } catch (error) {
    console.error("Error recording feedback:", error)
  }
}

// Function to update conversation metrics
export async function updateConversationMetrics(
  sessionId: string,
  {
    messageCount,
    responseTime,
    durationSeconds,
    completed,
  }: {
    messageCount?: number
    responseTime?: number
    durationSeconds?: number
    completed?: boolean
  },
) {
  try {
    // Check if metrics exist for this session
    const existingMetrics = await sql`
      SELECT id, message_count, average_response_time
      FROM conversation_metrics
      WHERE session_id = ${sessionId}
    `

    if (existingMetrics.length > 0) {
      // Update existing metrics
      const current = existingMetrics[0]

      // Calculate new average response time if provided
      let newAvgResponseTime = current.average_response_time
      if (responseTime !== undefined) {
        const totalTime = (current.average_response_time || 0) * current.message_count + responseTime
        newAvgResponseTime = totalTime / (current.message_count + 1)
      }

      await sql`
        UPDATE conversation_metrics
        SET 
          message_count = CASE WHEN ${messageCount !== undefined} THEN ${messageCount} ELSE message_count + 1 END,
          average_response_time = CASE WHEN ${responseTime !== undefined} THEN ${newAvgResponseTime} ELSE average_response_time END,
          duration_seconds = CASE WHEN ${durationSeconds !== undefined} THEN ${durationSeconds} ELSE duration_seconds END,
          completed = CASE WHEN ${completed !== undefined} THEN ${completed} ELSE completed END,
          updated_at = CURRENT_TIMESTAMP
        WHERE session_id = ${sessionId}
      `
    } else {
      // Create new metrics
      await sql`
        INSERT INTO conversation_metrics (
          session_id, 
          message_count, 
          average_response_time, 
          duration_seconds, 
          completed
        )
        VALUES (
          ${sessionId}, 
          ${messageCount || 1}, 
          ${responseTime || null}, 
          ${durationSeconds || null}, 
          ${completed || false}
        )
      `
    }
  } catch (error) {
    console.error("Error updating conversation metrics:", error)
  }
}

// Function to get similar questions
export async function getSimilarQuestions(question: string, limit = 5) {
  try {
    // Use text-based similarity instead of vector similarity
    const results = await sql`
      SELECT question, category, 
             0.5 as similarity
      FROM question_analytics
      WHERE question ILIKE ${"%" + question + "%"}
      LIMIT ${limit}
    `

    return results
  } catch (error) {
    console.error("Error finding similar questions:", error)
    return []
  }
}

// Function to get question analytics
export async function getQuestionAnalytics() {
  try {
    // Get category distribution
    const categoryDistribution = await sql`
      SELECT category, COUNT(*) as count
      FROM question_analytics
      GROUP BY category
      ORDER BY count DESC
    `

    // Get question volume over time
    const questionVolume = await sql`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as count
      FROM question_analytics
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date
    `

    // Get top questions
    const topQuestions = await sql`
      SELECT question, category, COUNT(*) as count
      FROM question_analytics
      GROUP BY question, category
      ORDER BY count DESC
      LIMIT 10
    `

    return {
      categoryDistribution,
      questionVolume,
      topQuestions,
    }
  } catch (error) {
    console.error("Error getting question analytics:", error)
    throw error
  }
}

// Function to get feedback analytics
export async function getFeedbackAnalytics() {
  try {
    // Get average rating
    const averageRating = await sql`
      SELECT AVG(rating) as average
      FROM response_feedback
    `

    // Get rating distribution
    const ratingDistribution = await sql`
      SELECT rating, COUNT(*) as count
      FROM response_feedback
      GROUP BY rating
      ORDER BY rating
    `

    // Get rating over time
    const ratingOverTime = await sql`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        AVG(rating) as average
      FROM response_feedback
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date
    `

    return {
      averageRating: averageRating[0]?.average || 0,
      ratingDistribution,
      ratingOverTime,
    }
  } catch (error) {
    console.error("Error getting feedback analytics:", error)
    throw error
  }
}

// Function to get conversation metrics
export async function getConversationMetrics() {
  try {
    // Get average metrics
    const averageMetrics = await sql`
      SELECT 
        AVG(message_count) as avg_message_count,
        AVG(average_response_time) as avg_response_time,
        AVG(duration_seconds) as avg_duration
      FROM conversation_metrics
      WHERE completed = true
    `

    // Get completion rate
    const completionRate = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE completed = true) as completed_count,
        COUNT(*) as total_count
      FROM conversation_metrics
    `

    return {
      averageMetrics: averageMetrics[0] || { avg_message_count: 0, avg_response_time: 0, avg_duration: 0 },
      completionRate: completionRate[0] || { completed_count: 0, total_count: 0 },
    }
  } catch (error) {
    console.error("Error getting conversation metrics:", error)
    throw error
  }
}
