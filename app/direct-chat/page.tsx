"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DirectChatPage() {
  const [messages, setMessages] = useState<any[]>([
    {
      id: "welcome-message",
      role: "assistant",
      content: "Hi there! I'm Flo, your personal guide to Clipboard Health. How can I help you today?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading || !apiKey) return

    if (!apiKey) {
      setError("Please enter an API key")
      return
    }

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      // Send request to direct chat API
      const response = await fetch("/api/chat-direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          apiKey,
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-silver-light p-4">
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col shadow-lg border-plum-light">
        <CardHeader className="bg-gradient-to-r from-plum to-yinmn text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Avatar className="h-8 w-8 bg-magenta">
              <span className="text-sm font-bold">F</span>
            </Avatar>
            Flo - Direct Chat (No Streaming)
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-grow p-0 overflow-hidden bg-silver-light bg-opacity-20">
          <div className="p-4 bg-white">
            <Alert variant="warning" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>API Key Required</AlertTitle>
              <AlertDescription>Please enter your Anthropic API key below to use the chat.</AlertDescription>
            </Alert>

            <div className="mb-4">
              <Label htmlFor="api-key">Anthropic API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Anthropic API key"
                className="mb-2"
              />
              <p className="text-xs text-gray-500">This key will only be used for this session and won't be stored.</p>
            </div>
          </div>

          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
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
                  </div>
                </div>
              ))}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  <p className="font-bold">Error</p>
                  <p>{error}</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="border-t p-4 bg-silver-light">
          <form onSubmit={handleSubmit} className="flex w-full gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              className="flex-grow resize-none border-plum-light focus:border-plum focus:ring-plum"
              disabled={isLoading || !apiKey}
            />
            <Button
              type="submit"
              size="icon"
              className="bg-plum hover:bg-plum-dark"
              disabled={isLoading || !input.trim() || !apiKey}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
