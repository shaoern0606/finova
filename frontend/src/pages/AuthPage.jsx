import { ArrowRight, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useState } from "react";

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("Aina Tan");
  const [email, setEmail] = useState("aina@finova.my");
  const [password, setPassword] = useState("finova");

  const isSignup = mode === "signup";

  function submit(e) {
    e.preventDefault();
    onAuth({
      name: isSignup ? name || "Finova User" : "Aina Tan",
      email,
    });
  }

  return (
    <main className="flex h-full flex-col bg-[#f7f4ff] px-7 py-20">
      <section className="mb-10">
        <div className="mb-10 flex items-center justify-between">
          <div className="rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-gx-600">
            Finova
          </div>
        </div>

        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gx-500">Private Banking Layer</p>
        <h1 className="mt-2 text-4xl font-black leading-[0.95] tracking-tight text-gx-900">
          Money clarity, without the noise.
          </h1>
        <p className="mt-4 max-w-xs text-sm font-medium leading-6 text-slate-500">
          Sign in to sync receipts, balances, intelligence, and goals in one live financial cockpit.
          </p>
      </section>

      <section className="rounded-[1.75rem] border border-violet-100 bg-white p-4 pb-8 shadow-[0_24px_70px_rgba(76,29,149,0.18)]">
        <div className="mb-4 grid grid-cols-2 rounded-2xl bg-violet-50 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
            className={`rounded-xl py-2 text-xs font-black transition ${!isSignup ? "bg-white text-gx-700 shadow-sm" : "text-slate-400"}`}
            >
            Login
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
            className={`rounded-xl py-2 text-xs font-black transition ${isSignup ? "bg-white text-gx-700 shadow-sm" : "text-slate-400"}`}
            >
            Sign Up
            </button>
          </div>

        <form className="space-y-3" onSubmit={submit}>
            {isSignup && (
            <label className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-3">
              <UserRound size={17} className="text-gx-500" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-gx-900 outline-none placeholder:text-slate-400"
                placeholder="Full name"
                  />
            </label>
          )}
          <label className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-3">
            <Mail size={17} className="text-gx-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-gx-900 outline-none placeholder:text-slate-400"
              placeholder="Email address"
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-3">
            <LockKeyhole size={17} className="text-gx-500" />
                <input
              type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-gx-900 outline-none placeholder:text-slate-400"
              placeholder="Password"
            />
          </label>

              <button
                type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gx-600 px-4 py-3.5 text-sm font-black text-white shadow-[0_18px_36px_rgba(124,58,237,0.28)] transition active:scale-[0.98]"
              >
            {isSignup ? "Create Account" : "Enter Finova"}
            <ArrowRight size={17} />
              </button>
          </form>

      </section>
    </main>
  );
}
