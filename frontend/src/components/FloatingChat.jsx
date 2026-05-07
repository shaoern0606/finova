import { MessageCircle, Send, X } from "lucide-react";
import { useState } from "react";
import { post } from "../api.js";

const starters = ["Can I afford this?", "What if I save RM10 daily?", "Should I take this loan?"];

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [thread, setThread] = useState([
    { role: "assistant", text: "Nova is online. I'm your financial intelligence navigator. How can I help you today?" }
  ]);

  async function send(text = message) {
    if (!text.trim()) return;
    setThread((current) => [...current, { role: "user", text }]);
    setMessage("");
    const response = await post("/chat", {
      message: text,
      history: thread.map(h => ({ role: h.role, text: h.text }))
    });
    setThread((current) => [...current, {
      role: "assistant",
      text: response.response,
      thought: response.thought_process,
      evidence: response.insights
    }]);
  }

  return (
    <div className="absolute bottom-20 right-4 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 flex w-[90vw] max-w-[380px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 h-[600px] max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between bg-gx-600 px-4 py-3 text-white">
            <div>
              <p className="font-bold">Nova</p>
              <p className="text-xs text-emerald-100">AI Financial Advisor</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-full p-1 hover:bg-gx-700">
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[#f6fbf8]">
            {thread.map((item, index) => (
              <div key={index} className={`max-w-[88%] rounded-lg p-3 ${item.role === "user" ? "ml-auto bg-gx-500 text-white" : "bg-white border border-emerald-100 text-gx-900 shadow-sm"}`}>
                {item.thought && (
                  <div className="mb-2 rounded border border-emerald-100 bg-emerald-50/50 p-2 text-[10px] font-mono leading-tight text-slate-500">
                    <span className="font-bold text-gx-600 uppercase">Nova's Reasoning:</span><br />
                    {item.thought}
                  </div>
                )}
                <p className="text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-100 bg-white p-3">
            {thread.length === 1 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {starters.map((item) => (
                  <button key={item} onClick={() => send(item)} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-gx-800 hover:bg-emerald-100 transition">
                    {item}
                  </button>
                ))}
              </div>
            )}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                send();
              }}
              className="flex gap-2"
            >
              <input
                className="min-w-0 flex-1 rounded-full border border-emerald-200 bg-[#f6fbf8] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gx-500"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Ask Nova..."
              />
              <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gx-500 text-white hover:bg-gx-600 transition" aria-label="Send message">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
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
