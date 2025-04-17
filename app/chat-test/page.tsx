"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2 } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

type Message = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
}

type RetrievedContent = {
  title: string
  url: string
  chunk_text: string
  similarity: number
}

export default function ChatTestPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-message",
      role: "assistant",
      content:
        "Hi there! I'm Flo, your personal guide to Clipboard Health. Ask me anything about Clipboard Health to test my RAG capabilities!",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [retrievedContent, setRetrievedContent] = useState<RetrievedContent[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [inputRows, setInputRows] = useState(1)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle textarea height adjustment
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
      role: "user" as const,
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setInputRows(1)
    setIsLoading(true)

    try {
      // Get retrieved content first
      const contentResponse = await fetch("/api/rag/retrieve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: userMessage.content }),
      })

      const contentData = await contentResponse.json()
      setRetrievedContent(contentData.results || [])

      // Then get the chat response
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (!chatResponse.ok) {
        throw new Error("Failed to get response")
      }

      const data = await chatResponse.json()

      // Add assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: data.response,
        },
      ])
    } catch (error) {
      console.error("Error:", error)
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-4xl flex gap-4">
        <Card className="w-2/3 h-[80vh] flex flex-col">
          <CardHeader className="bg-teal-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8 bg-teal-800">
                <span className="text-sm font-bold">F</span>
              </Avatar>
              Flo - RAG Test Chat
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-grow p-0 overflow-hidden">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex w-full gap-2">
              <Textarea
                value={input}
                onChange={handleTextareaChange}
                placeholder="Ask a question about Clipboard Health..."
                className="flex-grow resize-none"
                rows={inputRows}
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </CardFooter>
        </Card>

        <Card className="w-1/3 h-[80vh] flex flex-col">
          <CardHeader className="bg-gray-200 rounded-t-lg">
            <CardTitle className="text-sm">Retrieved Content</CardTitle>
          </CardHeader>

          <CardContent className="flex-grow p-0 overflow-hidden">
            <ScrollArea className="h-full p-4">
              {retrievedContent.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {retrievedContent.map((content, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left text-sm">
                        <div>
                          <span className="font-medium">{content.title}</span>
                          <span className="text-xs text-gray-500 block">
                            Similarity: {(content.similarity * 100).toFixed(2)}%
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm">
                          <a
                            href={content.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs block"
                          >
                            {content.url}
                          </a>
                          <div className="bg-gray-50 p-2 rounded-md text-xs">{content.chunk_text}</div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    "Ask a question to see retrieved content"
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
