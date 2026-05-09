import {
  Bell,
  Bot,
  CreditCard,
  Fingerprint,
  Globe,
  HelpCircle,
  Info,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  Moon,
  Pencil,
  Phone,
  Shield,
  User,
} from "lucide-react";
import { useState } from "react";

/* ─── Reusable Card ─────────────────────────────────── */
function Card({ title, icon: TitleIcon, children }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
      {title && (
        <div className="flex items-center gap-2 px-4 pt-4 pb-2 border-b border-slate-50">
          {TitleIcon && <TitleIcon size={15} className="text-gx-500" />}
          <p className="text-xs font-bold uppercase tracking-widest text-gx-600">{title}</p>
        </div>
      )}
      <div className="divide-y divide-slate-50">{children}</div>
    </div>
  );
}

/* ─── Toggle Switch ─────────────────────────────────── */
function Toggle({ value, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${value ? "bg-gx-500" : "bg-slate-200"
        }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-300 ${value ? "translate-x-5" : "translate-x-0"
          }`}
      />
    </button>
  );
}

/* ─── Setting Row ───────────────────────────────────── */
function Row({ icon: Icon, label, sublabel, right, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left group"
    >
      <div className="h-8 w-8 rounded-xl bg-gx-50 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-gx-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 leading-tight">{label}</p>
        {sublabel && <p className="text-[11px] text-slate-400 mt-0.5">{sublabel}</p>}
      </div>
      {right}
    </button>
  );
}

/* ─── Linked Account Card ───────────────────────────── */
function LinkedAccount({ name, type, last4, connected }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
      <div className="h-9 w-9 rounded-xl bg-gx-100 flex items-center justify-center shrink-0">
        <CreditCard size={16} className="text-gx-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800">{name}</p>
        <p className="text-[11px] text-slate-400">{type} · ••••{last4}</p>
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${connected ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
        {connected ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

/* ─── Main Profile Page ─────────────────────────────── */
export default function Profile({ onSignOut }) {
  const [darkMode, setDarkMode] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="flex flex-col gap-4 px-4 py-5 pb-8 pt-14">
      {/* ── Avatar & Name ─────────────────────────── */}
      <div className="flex flex-col items-center gap-2 py-2">
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gx-400 to-gx-700 flex items-center justify-center shadow-lg">
            <User size={36} className="text-white" />
          </div>
          <button className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center hover:bg-gx-50 transition">
            <Pencil size={12} className="text-gx-600" />
          </button>
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-slate-800">Aina Tan</p>
          <p className="text-xs text-slate-400">@ainatan510 · FinMate Member</p>
        </div>
      </div>

      {/* ── Personal Info ─────────────────────────── */}
      <Card title="Personal Info" icon={User}>
        <Row icon={Mail} label="aina@finova.my" sublabel="Email address" />
        <Row icon={Phone} label="+60 12-345 6789" sublabel="Phone number" />
      </Card>

      {/* ── Security ──────────────────────────────── */}
      <Card title="Account & Security" icon={Shield}>
        <Row
          icon={Lock}
          label="Change Password"
          sublabel="Update your login credentials"
          right={<span className="text-[11px] text-slate-400">›</span>}
        />
        <Row
          icon={Shield}
          label="Two‑Factor Authentication"
          sublabel={twoFactor ? "Enabled" : "Disabled"}
          right={<Toggle value={twoFactor} onChange={setTwoFactor} />}
        />
        <Row
          icon={Fingerprint}
          label="Biometric Login"
          sublabel="Face ID / Fingerprint"
          right={<Toggle value={biometric} onChange={setBiometric} />}
        />
        <Row
          icon={Shield}
          label="Privacy Settings"
          sublabel="Manage data & permissions"
          right={<span className="text-[11px] text-slate-400">›</span>}
        />
      </Card>

      {/* ── Preferences ───────────────────────────── */}
      <Card title="Preferences" icon={Globe}>
        <Row
          icon={Moon}
          label="Dark Mode"
          sublabel="Toggle app appearance"
          right={<Toggle value={darkMode} onChange={setDarkMode} />}
        />
        <Row
          icon={CreditCard}
          label="Currency"
          sublabel="Malaysian Ringgit"
          right={<span className="text-xs font-bold text-gx-600">MYR</span>}
        />
        <Row
          icon={Globe}
          label="Language"
          sublabel="App display language"
          right={<span className="text-xs font-bold text-gx-600">English</span>}
        />
        <Row
          icon={Bell}
          label="Notifications"
          sublabel="Spending alerts & tips"
          right={<Toggle value={notifications} onChange={setNotifications} />}
        />
      </Card>

      {/* ── Linked Accounts ───────────────────────── */}
      <Card title="Linked Accounts" icon={CreditCard}>
        <LinkedAccount name="Maybank" type="Savings" last4="4921" connected />
        <LinkedAccount name="Touch 'n Go eWallet" type="eWallet" last4="8831" connected />
        <LinkedAccount name="CIMB Clicks" type="Current" last4="2203" connected={false} />
        <div className="px-4 py-3">
          <button className="w-full rounded-xl border-2 border-dashed border-gx-200 py-2.5 text-xs font-semibold text-gx-500 hover:bg-gx-50 transition">
            + Add Account
          </button>
        </div>
      </Card>

      {/* ── Support ───────────────────────────────── */}
      <Card title="Support" icon={HelpCircle}>
        <Row
          icon={HelpCircle}
          label="Help Center"
          sublabel="Browse FAQs & guides"
          right={<span className="text-[11px] text-slate-400">›</span>}
        />
        <Row
          icon={MessageCircle}
          label="Contact Support"
          sublabel="Chat with our team"
          right={<span className="text-[11px] text-slate-400">›</span>}
        />
        <Row
          icon={Info}
          label="About FinMate"
          sublabel="Version 1.0.0"
          right={<span className="text-[11px] text-slate-400">›</span>}
        />
      </Card>

      {/* ── Logout ────────────────────────────────── */}
      <button
        onClick={onSignOut}
        className="flex items-center justify-center gap-2 w-full rounded-2xl bg-red-50 border border-red-100 py-3.5 text-sm font-bold text-red-600 hover:bg-red-100 active:scale-95 transition-all"
      >
        <LogOut size={16} />
        Sign Out
      </button>
    </div>
  );
}
