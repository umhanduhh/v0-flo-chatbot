export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    console.log("Fallback API called with", messages.length, "messages")

    // Get the last user message
    const lastUserMessage = messages.filter((m: any) => m.role === "user").pop()
    const userQuestion = lastUserMessage?.content || ""

    // Generate a simple fallback response
    let response = "I'm here to help with your Clipboard Health questions. How can I assist you today?"

    if (userQuestion.toLowerCase().includes("shift")) {
      response =
        "To find and book shifts on Clipboard Health, open the app and go to the Shifts tab. You can filter by location, shift type, pay rate, and more. Once you find a shift you like, tap 'Book Shift' to reserve it."
    } else if (userQuestion.toLowerCase().includes("pay") || userQuestion.toLowerCase().includes("payment")) {
      response =
        "Clipboard Health processes payments weekly for all approved timesheets. Direct deposits typically arrive in your bank account within 2-3 business days. You can view your earnings history in the Earnings tab of the app."
    } else if (userQuestion.toLowerCase().includes("cancel")) {
      response =
        "If you need to cancel a shift, please do so as early as possible through the app. Late cancellations may affect your rating. Always notify both Clipboard Health and the facility if you can't make a shift."
    } else if (userQuestion.length > 0) {
      response = `Thank you for your question about "${userQuestion}". As a fallback system, I have limited information, but I'm happy to help with basic Clipboard Health questions about shifts, payments, and policies.`
    }

    return new Response(
      JSON.stringify({
        id: Date.now().toString(),
        role: "assistant",
        content: response,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Error in fallback chat API:", error)
    return new Response(
      JSON.stringify({
        id: Date.now().toString(),
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again with a simpler question.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
