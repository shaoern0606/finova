import { Send } from "lucide-react";
import { useState } from "react";
import { post } from "../api.js";

const starters = ["Can I afford this?", "What if I save RM10 daily?", "Should I take this loan?"];

export default function Chat() {
  const [message, setMessage] = useState("Can I afford this?");
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
    <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-5">
      <section>
        <p className="text-sm font-bold text-gx-600">AI Assistant</p>
        <h1 className="text-3xl font-black text-gx-900">Your Financial Intelligence Navigator.</h1>
      </section>

      <div className="flex flex-wrap gap-2">
        {starters.map((item) => (
          <button key={item} onClick={() => send(item)} className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-gx-900">
            {item}
          </button>
        ))}
      </div>

      <section className="card min-h-[460px] p-4">
        <div className="space-y-3">
          {thread.map((item, index) => (
            <div key={index} className={`max-w-[88%] rounded-lg p-3 ${item.role === "user" ? "ml-auto bg-gx-500 text-white" : "bg-emerald-50 text-gx-900"}`}>
              {item.thought && (
                <div className="mb-2 rounded border border-emerald-100 bg-white/50 p-2 text-[10px] font-mono leading-tight text-slate-500">
                  <span className="font-bold text-gx-600 uppercase">Nova's Reasoning:</span><br/>
                  {item.thought}
                </div>
              )}
              <p className="text-sm leading-6">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
        className="flex gap-2"
      >
        <input
          className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-4 py-3"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Ask Nova anything about your finances..."
        />
        <button className="grid h-12 w-12 place-items-center rounded-lg bg-gx-500 text-white" aria-label="Send message">
          <Send size={18} />
        </button>
      </form>
    </main>
  );
}

