"use client"

import type React from "react"

import { useChat } from "ai/react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2 } from "lucide-react"

export default function FallbackChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setMessages } = useChat({
    api: "/api/chat-fallback",
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [inputRows, setInputRows] = useState(1)

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
          content:
            "Hi there! I'm Flo, your personal guide to Clipboard Health. I'm currently running in fallback mode with limited capabilities. How can I help you today?",
        },
      ])
    }
  }, [messages, setMessages])

  // Handle textarea height adjustment
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e)
    const rows = e.target.value.split("\n").length
    setInputRows(Math.min(5, Math.max(1, rows)))
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-silver-light p-4">
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col shadow-lg border-plum-light">
        <CardHeader className="bg-gradient-to-r from-plum to-yinmn text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Avatar className="h-8 w-8 bg-magenta">
              <span className="text-sm font-bold">F</span>
            </Avatar>
            Flo - Fallback Mode
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-grow p-0 overflow-hidden bg-silver-light bg-opacity-20">
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
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  <p className="font-bold">Error</p>
                  <p>{error.message}</p>
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
              onChange={handleTextareaChange}
              placeholder="Type your message here..."
              className="flex-grow resize-none border-plum-light focus:border-plum focus:ring-plum"
              rows={inputRows}
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="bg-plum hover:bg-plum-dark"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
