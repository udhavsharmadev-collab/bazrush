'use client';

import { useState, useRef, useEffect } from "react";

// ─── FAQ data ──────────────────────────────────────────────────────────────
// Edit/add entries here — each becomes a tappable chip in the bot's replies.
const FAQS = [
  {
    q: "Which areas do you deliver to?",
    a: "Right now Bazrush only delivers in Panipat — we're expanding fast and more cities are coming soon! 🚀",
  },
  {
    q: "What are your delivery hours?",
    a: "Orders are delivered between 10 AM and 7 PM, with an estimated delivery time of 250–300 minutes depending on the shop and your location.",
  },
  {
    q: "How do I track my order?",
    a: "Head to \"My Orders\" from your profile menu — you'll see live status updates as your delivery partner picks up and delivers your order.",
  },
  {
    q: "How do I apply a coupon code?",
    a: "On the checkout page, look for the coupon strip near your order summary — enter the code and tap Apply, the discount reflects instantly.",
  },
  {
    q: "What payment methods do you accept?",
    a: "You can pay via UPI, debit/credit cards, and cash on delivery, depending on what the seller has enabled for their shop.",
  },
  {
    q: "How can I become a seller?",
    a: "Tap \"Become a Seller\" on the homepage banner and sign up — you'll get your own dashboard to list products and manage orders in minutes.",
  },
  {
    q: "What's your return/refund policy?",
    a: "If an item arrives damaged or wrong, reach out to support within 24 hours of delivery and we'll sort out a replacement or refund.",
  },
  {
    q: "How do I contact a human?",
    a: "For anything I can't help with, email supportbazrush@gmail.com or use the Contact Us option in your profile menu — a real person will get back to you.",
  },
];

// ─── Chat bubble ───────────────────────────────────────────────────────────
const Bubble = ({ from, text }) => (
  <div className={`flex ${from === "user" ? "justify-end" : "justify-start"} mb-2.5`}>
    <div
      className={`max-w-[80%] text-[13px] leading-snug px-3.5 py-2.5 rounded-2xl ${
        from === "user"
          ? "bg-gradient-to-r from-violet-600 to-purple-500 text-white rounded-br-md"
          : "bg-purple-50 text-gray-700 border border-purple-100 rounded-bl-md"
      }`}
    >
      {text}
    </div>
  </div>
);

// ─── Typing indicator ───────────────────────────────────────────────────────
const TypingBubble = () => (
  <div className="flex justify-start mb-2.5">
    <div className="bg-purple-50 border border-purple-100 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-purple-300 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  </div>
);

// ─── Widget ────────────────────────────────────────────────────────────────
const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hey! 👋 I'm Bazi, your Bazrush assistant. Pick a question below, or type anything else you're wondering about." },
  ]);
  const [showChips, setShowChips] = useState(true);
  const [inputVal, setInputVal] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, thinking]);

  const askFaq = (faq) => {
    setMessages((prev) => [...prev, { from: "user", text: faq.q }, { from: "bot", text: faq.a }]);
    setShowChips(false);
    setTimeout(() => setShowChips(true), 0);
  };

  const resetChips = () => setShowChips(true);

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = inputVal.trim();
    if (!text || thinking) return;

    const nextMessages = [...messages, { from: "user", text }];
    setMessages(nextMessages);
    setInputVal("");
    setShowChips(false);
    setThinking(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: nextMessages.slice(0, -1) }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { from: "bot", text: data.reply || "Sorry, something went wrong." }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "I'm having trouble replying right now — please try again or email supportbazrush@gmail.com." },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <>
      {/* Floating launcher button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 shadow-lg shadow-purple-300 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-150 cursor-pointer"
      >
        {open ? (
          <span className="text-white text-2xl leading-none">×</span>
        ) : (
          <span className="relative flex items-center justify-center">
            <span className="text-2xl">💬</span>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[22rem] max-w-[calc(100vw-2.5rem)] h-[32rem] max-h-[75vh] bg-white rounded-3xl shadow-xl shadow-purple-200 border border-purple-100 flex flex-col overflow-hidden animate-[fadeIn_0.15s_ease-out]">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 px-4 py-3.5 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg">🤖</div>
            <div>
              <p className="text-white text-sm font-bold leading-tight">Bazi · Bazrush Assistant</p>
              <p className="text-white/70 text-[11px] leading-tight">Usually replies instantly</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3.5 py-4 bg-white">
            {messages.map((m, i) => (
              <Bubble key={i} from={m.from} text={m.text} />
            ))}
            {thinking && <TypingBubble />}

            {/* FAQ chips */}
            {showChips && !thinking && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {FAQS.map((faq) => (
                  <button
                    key={faq.q}
                    onClick={() => askFaq(faq)}
                    className="text-[11.5px] font-semibold text-violet-600 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all duration-150 cursor-pointer"
                  >
                    {faq.q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Text input */}
          <form onSubmit={sendMessage} className="px-3.5 pt-3 flex gap-2 border-t border-purple-100">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Type your question…"
              disabled={thinking}
              className="flex-1 border border-purple-200 rounded-xl px-3.5 py-2 text-[13px] text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={thinking || !inputVal.trim()}
              className="bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold text-[13px] px-4 py-2 rounded-xl hover:opacity-90 transition-opacity duration-150 disabled:opacity-40 cursor-pointer"
            >
              Send
            </button>
          </form>

          {/* Footer */}
          <div className="px-3.5 py-3">
            <button
              onClick={resetChips}
              className="w-full text-center text-[12px] font-semibold text-violet-600 bg-white border border-purple-200 py-2 rounded-xl hover:bg-violet-600 hover:text-white transition-all duration-150 cursor-pointer"
            >
              Show all questions
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;