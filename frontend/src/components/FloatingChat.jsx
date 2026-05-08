import { MessageCircle, Send, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { post } from "../api.js";

// Short, realistic suggestions only
const STARTERS = [
  "How to reduce spending?",
  "What if I save RM 10 daily?",
  "Am I overspending?",
];


export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [thread, setThread] = useState([
    {
      role: "assistant",
      text: "Nova is online. I'm your financial intelligence navigator. How can I help you today?",
    },
  ]);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  async function send(text = message) {
    const trimmed = typeof text === "string" ? text.trim() : message.trim();
    if (!trimmed) return;

    // 1. Add user message + loading bubble into the thread at the same time
    setThread((prev) => [
      ...prev,
      { role: "user", text: trimmed },
      { role: "assistant", loading: true },   // <-- typing indicator as real message
    ]);
    setMessage("");

    try {
      const response = await post("/chat", {
        message: trimmed,
        history: thread.map((h) => ({ role: h.role, text: h.text })),
      });

      // 2. Replace the loading bubble with the real AI response
      setThread((prev) => [
        ...prev.slice(0, -1),   // remove last entry (the loading bubble)
        {
          role: "assistant",
          text: response.response || "Sorry, I couldn't generate a response.",
          thought: response.thought_process,
        },
      ]);
    } catch {
      setThread((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          text: "I'm having trouble connecting right now. Please try again shortly.",
        },
      ]);
    }
  }

  return (
    <div className="absolute bottom-20 right-4 z-50 flex flex-col items-end">
      {/* ── Chat Window ── */}
      {isOpen && (
        <div className="mb-4 flex w-[90vw] max-w-[360px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 h-[560px]">

          {/* Header */}
          <div className="flex shrink-0 items-center justify-between bg-gx-600 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-bold leading-tight">Nova</p>
              <p className="text-[10px] text-emerald-200 mt-0.5">AI Financial Advisor</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 hover:bg-gx-700 transition"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-[#f6fbf8] px-4 py-4">
            {thread.map((item, i) => (
              <div
                key={i}
                className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {/* Loading bubble — dots only, matches AI bubble style */}
                {item.loading ? (
                  <div className="max-w-[86%] rounded-2xl rounded-bl-none bg-white border border-emerald-100 px-4 py-3.5 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="block h-2 w-2 rounded-full bg-gx-400 animate-bounce" style={{ animationDuration: "0.8s", animationDelay: "0s" }} />
                      <span className="block h-2 w-2 rounded-full bg-gx-400 animate-bounce" style={{ animationDuration: "0.8s", animationDelay: "0.15s" }} />
                      <span className="block h-2 w-2 rounded-full bg-gx-400 animate-bounce" style={{ animationDuration: "0.8s", animationDelay: "0.3s" }} />
                    </div>
                  </div>
                ) : (
                  <div
                    className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                      item.role === "user"
                        ? "rounded-br-none bg-gx-500 text-white"
                        : "rounded-bl-none bg-white border border-emerald-100 text-gx-900"
                    }`}
                  >
                    {item.thought && (
                      <div className="mb-2 rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-[10px] font-mono leading-snug text-slate-400">
                        <span className="font-bold text-gx-500">Reasoning: </span>
                        {item.thought}
                      </div>
                    )}
                    {item.text}
                  </div>
                )}
              </div>
            ))}

            {/* Auto-scroll anchor */}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="shrink-0 border-t border-slate-100 bg-white p-3">
            {/* Starter chips — left-aligned, shown only at thread start */}
            {thread.length === 1 && (
              <div className="mb-3 flex flex-wrap justify-start gap-1.5">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-gx-800 hover:bg-emerald-100 active:scale-95 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex gap-2"
            >
              <input
                className="min-w-0 flex-1 rounded-full border border-emerald-200 bg-[#f6fbf8] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gx-500 transition"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask Nova..."
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gx-500 text-white hover:bg-gx-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Floating Action Button (position & style unchanged) ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gx-500 text-white shadow-xl hover:bg-gx-600 hover:scale-105 transition-all duration-300"
          aria-label="Open chat"
        >
          <MessageCircle size={28} />
          <span className="absolute right-full mr-4 whitespace-nowrap rounded-lg bg-slate-800 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
            Chat with Nova
          </span>
        </button>
      )}
    </div>
  );
}
