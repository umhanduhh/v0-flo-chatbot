"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2, AlertCircle } from "lucide-react"
import { SessionSelector } from "@/components/session-selector"
import { FeedbackButtons } from "@/components/feedback-buttons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<"loading" | "success" | "error">("loading")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [inputRows, setInputRows] = useState(1)

  // Check if API is working
  useEffect(() => {
    async function checkApiStatus() {
      try {
        setApiStatus("loading")
        const response = await fetch("/api/debug-claude")
        const data = await response.json()
        setApiStatus(data.success ? "success" : "error")
      } catch (error) {
        console.error("Error checking API status:", error)
        setApiStatus("error")
      }
    }

    checkApiStatus()
  }, [])

  // Load chat history when session changes
  useEffect(() => {
    async function loadChatHistory() {
      if (!sessionId) {
        setMessages([
          {
            id: "welcome-message",
            role: "assistant",
            content:
              "Hi there! I'm Flo, your personal guide to Clipboard Health. Whether you have questions about shifts, the app, or just need some encouragement, I'm here to help. How can I support you today?",
          },
        ])
        setIsHistoryLoaded(true)
        return
      }

      setIsHistoryLoaded(false)
      try {
        const response = await fetch(`/api/history?sessionId=${sessionId}`)
        const data = await response.json()

        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages)
        } else {
          setMessages([
            {
              id: "welcome-message",
              role: "assistant",
              content:
                "Hi there! I'm Flo, your personal guide to Clipboard Health. Whether you have questions about shifts, the app, or just need some encouragement, I'm here to help. How can I support you today?",
            },
          ])
        }
        setIsHistoryLoaded(true)
      } catch (error) {
        console.error("Failed to load chat history:", error)
        setIsHistoryLoaded(true)
        setError("Failed to load chat history. Please try again.")
      }
    }

    loadChatHistory()
  }, [sessionId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSessionChange = (newSessionId: string) => {
    setSessionId(newSessionId)
  }

  // Handle textarea height adjustment
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const rows = e.target.value.split("\n").length
    setInputRows(Math.min(5, Math.max(1, rows)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setInputRows(1)
    setIsLoading(true)
    setError(null)

    try {
      // Send request to chat API
      const response = await fetch("/api/chat-direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          sessionId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get response")
      }

      const data = await response.json()

      // Add assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: data.id || Date.now().toString(),
          role: "assistant",
          content: data.content,
        },
      ])
    } catch (error) {
      console.error("Error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "I'm sorry, I encountered an error while processing your request. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  if (apiStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-silver-light">
        <Card className="w-96 p-6 text-center">
          <div className="flex justify-center mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-plum" />
          </div>
          <p>Checking API connection...</p>
        </Card>
      </div>
    )
  }

  if (apiStatus === "error") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-silver-light p-4">
        <Card className="w-full max-w-md p-6">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>API Connection Error</AlertTitle>
            <AlertDescription>
              There was a problem connecting to the Claude API. Please check your API key and try again.
            </AlertDescription>
          </Alert>
          <p className="mb-4">To fix this issue:</p>
          <ol className="list-decimal pl-5 mb-4 space-y-2">
            <li>Verify that your ANTHROPIC_API_KEY environment variable is set correctly</li>
            <li>Check that your API key is valid and has not expired</li>
            <li>Ensure you have sufficient quota remaining on your Anthropic account</li>
          </ol>
          <Button onClick={() => (window.location.href = "/debug")} className="w-full bg-plum hover:bg-plum-dark">
            Go to Debug Page
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-silver-light p-4">
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col shadow-lg border-plum-light">
        <CardHeader className="bg-gradient-to-r from-plum to-yinmn text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8 bg-magenta">
                <span className="text-sm font-bold">F</span>
              </Avatar>
              Flo - Your Clipboard Health Assistant
            </CardTitle>
            <SessionSelector onSessionChange={handleSessionChange} />
          </div>
        </CardHeader>

        <CardContent className="flex-grow p-0 overflow-hidden bg-silver-light bg-opacity-20">
          {!isHistoryLoaded ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-plum" />
              <p className="ml-2 text-gray-500">Loading conversation...</p>
            </div>
          ) : (
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[80%]">
                      <div
                        className={`rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-plum to-magenta text-white"
                            : "bg-gradient-to-r from-moonstone-light to-yinmn-light text-white"
                        }`}
                      >
                        {message.content}
                      </div>
                      {message.role === "assistant" && sessionId && (
                        <FeedbackButtons sessionId={sessionId} messageId={message.id} />
                      )}
                    </div>
                  </div>
                ))}
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                    <Button
                      onClick={() => (window.location.href = "/debug")}
                      variant="outline"
                      size="sm"
                      className="mt-2 text-red-700 border-red-400 hover:bg-red-50"
                    >
                      Go to Debug Page
                    </Button>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}
        </CardContent>

        <CardFooter className="border-t p-4 bg-silver-light">
          <form onSubmit={handleSubmit} className="flex w-full gap-2">
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message here..."
              className="flex-grow resize-none border-plum-light focus:border-plum focus:ring-plum"
              rows={inputRows}
              disabled={isLoading || !isHistoryLoaded}
            />
            <Button
              type="submit"
              size="icon"
              className="bg-plum hover:bg-plum-dark"
              disabled={isLoading || !input.trim() || !isHistoryLoaded}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
