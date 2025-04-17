"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ThumbsUp, ThumbsDown, Star } from "lucide-react"

type FeedbackButtonsProps = {
  sessionId: string
  messageId: string
  onFeedbackSubmitted?: () => void
}

export function FeedbackButtons({ sessionId, messageId, onFeedbackSubmitted }: FeedbackButtonsProps) {
  const [showFeedback, setShowFeedback] = useState(false)
  const [rating, setRating] = useState<number | null>(null)
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleRating = (value: number) => {
    setRating(value)
    setShowFeedback(true)
  }

  const handleSubmit = async () => {
    if (rating === null) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          messageId,
          rating,
          feedback: feedback.trim() || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit feedback")
      }

      setSubmitted(true)
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted()
      }
    } catch (error) {
      console.error("Error submitting feedback:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return <div className="text-xs text-white mt-1 opacity-70">Thank you for your feedback!</div>
  }

  return (
    <div className="mt-1">
      {!showFeedback ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-white opacity-70">Was this helpful?</span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white" onClick={() => handleRating(5)}>
            <ThumbsUp className="h-3 w-3" />
            <span className="sr-only">Yes</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white" onClick={() => handleRating(1)}>
            <ThumbsDown className="h-3 w-3" />
            <span className="sr-only">No</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <Button
                key={value}
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${rating === value ? "text-magenta" : "text-white opacity-50"}`}
                onClick={() => setRating(value)}
              >
                <Star className="h-3 w-3" fill={rating !== null && rating >= value ? "currentColor" : "none"} />
                <span className="sr-only">{value} stars</span>
              </Button>
            ))}
          </div>
          <Textarea
            placeholder="Additional feedback (optional)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="text-xs min-h-[60px] bg-white bg-opacity-10 text-white border-white border-opacity-30"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs bg-transparent text-white border-white border-opacity-50 hover:bg-white hover:bg-opacity-10"
              onClick={() => setShowFeedback(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-7 text-xs bg-magenta hover:bg-magenta-dark"
              onClick={handleSubmit}
              disabled={isSubmitting || rating === null}
            >
              Submit
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
