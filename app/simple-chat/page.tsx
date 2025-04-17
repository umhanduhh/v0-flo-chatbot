"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { useChat } from "ai/react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SimpleChatPage() {
  const [apiKey, setApiKey] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [envKeyAvailable, setEnvKeyAvailable] = useState<boolean | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Check if environment variable is set
  useEffect(() => {
    async function checkEnvKey() {
      try {
        setChecking(true)
        const response = await fetch("/api/debug-claude")
        const data = await response.json()

        setEnvKeyAvailable(data.success)
      } catch (error) {
        console.error("Error checking environment variable:", error)
        setEnvKeyAvailable(false)
      } finally {
        setChecking(false)
      }
    }

    checkEnvKey()
  }, [])

  // Use the useChat hook from ai/react which handles streaming properly
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error: chatError,
    setMessages,
  } = useChat({
    api: "/api/chat",
    body: {
      apiKey: !envKeyAvailable ? apiKey : undefined,
    },
    onError: (error) => {
      console.error("Chat error:", error)
      setError(error.message || "An error occurred during the chat")
    },
  })

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Add a welcome message if there are no messages
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome-message",
          role: "assistant",
          content: "Hi there! I'm Flo, your personal guide to Clipboard Health. How can I help you today?",
        },
      ])
    }
  }, [messages, setMessages])

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!envKeyAvailable && !apiKey) {
      setError("Please enter an API key")
      return
    }
    handleSubmit(e)
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-silver-light">
        <Card className="w-96 p-6 text-center">
          <div className="flex justify-center mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-plum" />
          </div>
          <p>Checking for Anthropic API key...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-silver-light p-4">
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col shadow-lg border-plum-light">
        <CardHeader className="bg-gradient-to-r from-plum to-yinmn text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Avatar className="h-8 w-8 bg-magenta">
              <span className="text-sm font-bold">F</span>
            </Avatar>
            Flo - Simple Chat (Debug Version)
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-grow p-0 overflow-hidden bg-silver-light bg-opacity-20">
          {!envKeyAvailable && (
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
                <p className="text-xs text-gray-500">
                  This key will only be used for this session and won't be stored.
                </p>
              </div>
            </div>
          )}

          {envKeyAvailable && (
            <div className="p-4 bg-white">
              <Alert className="mb-4 bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">API Key Available</AlertTitle>
                <AlertDescription className="text-green-700">
                  The Anthropic API key is properly set in your environment variables.
                </AlertDescription>
              </Alert>
            </div>
          )}

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
                  </div>
                </div>
              ))}
              {(error || chatError) && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  <p className="font-bold">Error</p>
                  <p>{error || chatError?.message || "An unknown error occurred"}</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="border-t p-4 bg-silver-light">
          <form onSubmit={handleFormSubmit} className="flex w-full gap-2">
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message here..."
              className="flex-grow resize-none border-plum-light focus:border-plum focus:ring-plum"
              disabled={isLoading || (!envKeyAvailable && !apiKey)}
            />
            <Button
              type="submit"
              size="icon"
              className="bg-plum hover:bg-plum-dark"
              disabled={isLoading || !input.trim() || (!envKeyAvailable && !apiKey)}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
