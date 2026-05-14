import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, MicOff, PhoneOff, ArrowRight, Phone } from "lucide-react";
import { logDemoTrial, incrementDemoTrial } from "../lib/supabase";

const EASE = [0.22, 1, 0.36, 1];
const STORAGE_KEY = "raindrop_demo";
const MAX_TRIES = 5;

function getTrialData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveTrialData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Animated waveform bars
function Waveform({ active }) {
  const bars = [0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.45, 0.75, 0.55];
  return (
    <div className="flex items-center gap-1 h-10">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-rain-500"
          animate={
            active
              ? { scaleY: [h * 0.4, h, h * 0.6, h * 0.9, h * 0.4] }
              : { scaleY: 0.15 }
          }
          transition={
            active
              ? { duration: 0.8 + i * 0.07, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.3 }
          }
          style={{ height: 40, transformOrigin: "center" }}
        />
      ))}
    </div>
  );
}

// Timer display
function CallTimer({ running }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) { setSeconds(0); return; }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return <span className="font-mono text-2xl text-slate-900 tabular-nums">{m}:{s}</span>;
}

export default function CallDemoModal({ open, onClose }) {
  // step: email | ready | calling | ended | exhausted
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [triesUsed, setTriesUsed] = useState(0);
  const [agentTalking, setAgentTalking] = useState(false);
  const [micError, setMicError] = useState(false);
  const [callError, setCallError] = useState("");
  const clientRef = useRef(null);

  // Load existing trial data on open
  useEffect(() => {
    if (!open) return;
    const data = getTrialData();
    if (data) {
      setEmail(data.email);
      setTriesUsed(data.triesUsed);
      setStep(data.triesUsed >= MAX_TRIES ? "exhausted" : "ready");
    } else {
      setStep("email");
      setEmail("");
      setTriesUsed(0);
    }
    setCallError("");
    setMicError(false);
  }, [open]);

  // Clean up call if modal closes mid-call
  useEffect(() => {
    if (!open && clientRef.current) {
      clientRef.current.stopCall?.();
      clientRef.current = null;
    }
  }, [open]);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    const existing = getTrialData();
    const tries = existing?.email === email ? existing.triesUsed : 0;
    saveTrialData({ email, triesUsed: tries });
    setTriesUsed(tries);
    setStep(tries >= MAX_TRIES ? "exhausted" : "ready");
    logDemoTrial({ email });
  };

  const startCall = useCallback(async () => {
    setCallError("");
    setMicError(false);

    // Check mic access first
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMicError(true);
      return;
    }

    try {
      const res = await fetch("/.netlify/functions/create-call", { method: "POST" });
      if (!res.ok) throw new Error("Could not start call. Please try again.");
      const { access_token, error } = await res.json();
      if (error) throw new Error(error);

      const { RetellWebClient } = await import("retell-client-js-sdk");
      const client = new RetellWebClient();
      clientRef.current = client;

      client.on("call_started", () => setStep("calling"));
      client.on("agent_start_talking", () => setAgentTalking(true));
      client.on("agent_stop_talking", () => setAgentTalking(false));
      client.on("call_ended", () => {
        const current = getTrialData() ?? { email, triesUsed };
        const newTries = current.triesUsed + 1;
        saveTrialData({ email: current.email, triesUsed: newTries });
        incrementDemoTrial(current.email);
        setTriesUsed(newTries);
        setStep(newTries >= MAX_TRIES ? "exhausted" : "ended");
        clientRef.current = null;
      });
      client.on("error", (err) => {
        setCallError(err?.message ?? "An error occurred during the call.");
        setStep("ready");
        clientRef.current = null;
      });

      await client.startCall({ accessToken: access_token });
    } catch (err) {
      setCallError(err.message);
    }
  }, [email, triesUsed]);

  const endCall = () => {
    clientRef.current?.stopCall();
    clientRef.current = null;
  };

  const remaining = MAX_TRIES - triesUsed;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-cream-50 rounded-3xl w-full max-w-sm p-8 overflow-hidden"
          >
            {/* Ambient glow behind modal */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-rain-200/50 blur-3xl pointer-events-none" />

            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-cream-200 hover:bg-cream-300 flex items-center justify-center transition"
            >
              <X className="w-4 h-4 text-slate-700" />
            </button>

            <AnimatePresence mode="wait">
              {/* STEP: Email capture */}
              {step === "email" && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: EASE }}
                >
                  <div className="w-12 h-12 rounded-full bg-rain-100 flex items-center justify-center mb-5">
                    <Phone className="w-5 h-5 text-rain-700" />
                  </div>
                  <div className="font-display text-2xl text-slate-900 mb-2 tracking-tight">
                    Try the AI receptionist.
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    Talk to the same voice agent your clients would hear — live, right now.{" "}
                    <span className="text-slate-900 font-medium">5 free calls</span>, no credit
                    card.
                  </p>
                  <form onSubmit={handleEmailSubmit} className="space-y-3">
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full bg-cream-100 border border-slate-900/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-rain-500 transition placeholder:text-slate-400"
                    />
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 bg-slate-900 text-cream-100 py-3.5 rounded-full font-medium hover:bg-rain-700 transition"
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                  <p className="mt-4 text-[11px] text-slate-500 text-center">
                    By continuing you agree to receive SMS/call outreach from Raindrop AI.
                    Reply STOP to unsubscribe.
                  </p>
                </motion.div>
              )}

              {/* STEP: Ready to call */}
              {step === "ready" && (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="text-center"
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-rain-600 mb-4">
                    {remaining} of {MAX_TRIES} calls remaining
                  </div>

                  <div className="relative inline-flex mb-6">
                    <div className="absolute inset-0 rounded-full bg-rain-400/20 animate-ping" />
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-rain-400 to-rain-800 flex items-center justify-center">
                      <Phone className="w-8 h-8 text-cream-100" />
                    </div>
                  </div>

                  <div className="font-display text-2xl text-slate-900 mb-2 tracking-tight">
                    Ready to connect.
                  </div>
                  <p className="text-slate-600 text-sm mb-6">
                    You'll be connected to <strong>Ava</strong>, our Nashville AI receptionist.
                    Ask her anything.
                  </p>

                  {micError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
                      <MicOff className="w-4 h-4 flex-shrink-0" />
                      Microphone access is blocked. Please allow mic access and try again.
                    </div>
                  )}
                  {callError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
                      {callError}
                    </div>
                  )}

                  <button
                    onClick={startCall}
                    className="w-full flex items-center justify-center gap-2 bg-rain-700 text-cream-100 py-4 rounded-full font-medium hover:bg-rain-600 transition"
                  >
                    <Mic className="w-4 h-4" />
                    Start Call
                  </button>
                  <button
                    onClick={() => { setStep("email"); setEmail(""); }}
                    className="mt-3 w-full text-sm text-slate-500 hover:text-slate-700 transition"
                  >
                    Use a different email
                  </button>
                </motion.div>
              )}

              {/* STEP: Active call */}
              {step === "calling" && (
                <motion.div
                  key="calling"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-rain-600 mb-6 flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rain-500 rounded-full animate-pulse" />
                    Live · Connected to Ava
                  </div>

                  <div className="flex flex-col items-center gap-5 mb-8">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rain-400 to-rain-800 flex items-center justify-center">
                      <span className="font-display text-cream-100 text-4xl">A</span>
                    </div>

                    <div>
                      <div className="font-display text-lg text-slate-900 mb-1">
                        {agentTalking ? "Ava is speaking…" : "Listening…"}
                      </div>
                      <CallTimer running />
                    </div>

                    <Waveform active={agentTalking} />
                  </div>

                  <button
                    onClick={endCall}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-4 rounded-full font-medium hover:bg-red-700 transition"
                  >
                    <PhoneOff className="w-4 h-4" />
                    End Call
                  </button>
                </motion.div>
              )}

              {/* STEP: Call ended */}
              {step === "ended" && (
                <motion.div
                  key="ended"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-rain-100 mx-auto flex items-center justify-center mb-5">
                    <Phone className="w-6 h-6 text-rain-700" />
                  </div>
                  <div className="font-display text-2xl text-slate-900 mb-2 tracking-tight">
                    That's what your clients hear.
                  </div>
                  <p className="text-slate-600 text-sm mb-2">
                    {remaining > 0
                      ? `You have ${remaining} call${remaining === 1 ? "" : "s"} remaining.`
                      : "That was your last free call."}
                  </p>
                  <div className="flex flex-col gap-2 mt-6">
                    {remaining > 0 && (
                      <button
                        onClick={() => setStep("ready")}
                        className="w-full flex items-center justify-center gap-2 bg-rain-700 text-cream-100 py-3.5 rounded-full font-medium hover:bg-rain-600 transition"
                      >
                        <Phone className="w-4 h-4" />
                        Call again ({remaining} left)
                      </button>
                    )}
                    <a
                      href="#contact"
                      onClick={onClose}
                      className="w-full flex items-center justify-center gap-2 bg-slate-900 text-cream-100 py-3.5 rounded-full font-medium hover:bg-rain-700 transition"
                    >
                      Deploy this on my site <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              )}

              {/* STEP: Trial exhausted */}
              {step === "exhausted" && (
                <motion.div
                  key="exhausted"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-5">
                    All {MAX_TRIES} demo calls used
                  </div>
                  <div className="font-display text-2xl text-slate-900 mb-3 tracking-tight">
                    Ready to go live?
                  </div>
                  <p className="text-slate-600 text-sm mb-6">
                    You've heard what Ava can do. Let's put her to work on your actual business.
                  </p>
                  <a
                    href="#contact"
                    onClick={onClose}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 text-cream-100 py-4 rounded-full font-medium hover:bg-rain-700 transition"
                  >
                    Book a setup call <ArrowRight className="w-4 h-4" />
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
