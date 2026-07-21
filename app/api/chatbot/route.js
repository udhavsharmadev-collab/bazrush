import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Keep this in sync with the FAQ list in ChatbotWidget.jsx and your real
// delivery/payment/policy details — this is what grounds the AI's answers.
const SYSTEM_PROMPT = `You are Bazi, the friendly customer support assistant for Bazrush, a multi-vendor local e-commerce and delivery app.

Facts about Bazrush you can rely on:
- Bazrush currently delivers only within Panipat. Other cities are not supported yet.
- Delivery window is 10 AM to 7 PM, with an estimated delivery time of 250–300 minutes depending on the shop and location.
- Payment options: UPI, debit/credit cards, and cash on delivery — availability depends on what the individual seller/shop has enabled.
- Customers can track orders from "My Orders" in their profile menu.
- Coupons can be applied at checkout via the coupon strip near the order summary.
- To become a seller, use the "Become a Seller" button on the homepage and sign up for a seller dashboard.
- For damaged/wrong items, contact support within 24 hours of delivery for a replacement or refund.
- For anything you can't resolve, direct the person to support@bazrush.com.

Rules:
- Keep answers short — 1 to 3 sentences, friendly and plain-spoken.
- Only answer questions about Bazrush, shopping, orders, delivery, or the platform. If asked something unrelated (general trivia, coding help, etc.), politely redirect to Bazrush topics.
- Never invent policies, prices, or timelines you don't have — if unsure, say so and point to support@bazrush.com.
- Do not mention that you are Claude or made by Anthropic; you are Bazrush's assistant.`;

export async function POST(req) {
  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return Response.json({ reply: "Sorry, I didn't catch that — could you rephrase?" }, { status: 400 });
    }

    // Keep only the last few turns so the request stays small and fast.
    const priorTurns = (Array.isArray(history) ? history : [])
      .slice(-8)
      .map((m) => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.text,
      }));

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [...priorTurns, { role: "user", content: message }],
    });

    const reply =
      response.content?.find((block) => block.type === "text")?.text?.trim() ||
      "Sorry, I couldn't work that out — try support@bazrush.com.";

    return Response.json({ reply });
  } catch (err) {
    console.error("Chatbot API error:", err);
    return Response.json(
      { reply: "I'm having trouble replying right now — please try again in a bit or email support@bazrush.com." },
      { status: 500 }
    );
  }
}