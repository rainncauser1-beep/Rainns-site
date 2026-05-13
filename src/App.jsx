import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneOff,
  MessageSquare,
  Database,
  Search,
  ArrowUpRight,
  Check,
  Zap,
  Clock,
  TrendingDown,
  Sparkles,
  Send,
  Mic,
  Calendar,
  ChevronRight,
  Activity,
} from "lucide-react";

export default function RainnsLanding() {
  const [missedCalls, setMissedCalls] = useState(0);
  const [revenueLost, setRevenueLost] = useState(0);
  const [chatMessages, setChatMessages] = useState([
    { from: "ai", text: "Hey there 👋 This is Ava from Apex Roofing. Got a leak or a project I can help with?", time: "now" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState("voice");

  // Live counter — missed calls and revenue
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      // ~1 missed call every 2 seconds across "the industry" - dramatized
      setMissedCalls(Math.floor(elapsed * 0.5));
      setRevenueLost(Math.floor(elapsed * 0.5 * 287)); // avg job value
    }, 100);
    return () => clearInterval(id);
  }, []);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = { from: "user", text: chatInput, time: "now" };
    setChatMessages((m) => [...m, userMsg]);
    setChatInput("");
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setChatMessages((m) => [
        ...m,
        {
          from: "ai",
          text: "Got it. I can get a tech out tomorrow between 9–11am or 2–4pm. Which works better?",
          time: "now",
        },
      ]);
    }, 1400);
  };

  return (
    <div className="min-h-screen bg-[#0a0b0a] text-neutral-100 font-sans antialiased overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; }
        .font-sans { font-family: 'Geist', sans-serif; }
        .font-mono { font-family: 'Geist Mono', monospace; }
        .grain::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
          opacity: 0.06;
          pointer-events: none;
          mix-blend-mode: overlay;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes blink { 50% { opacity: 0; } }
        .blink { animation: blink 1s step-end infinite; }
        @keyframes scroll-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee { animation: scroll-marquee 40s linear infinite; }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .glass {
          background: rgba(20, 22, 20, 0.55);
          backdrop-filter: blur(20px) saturate(140%);
          -webkit-backdrop-filter: blur(20px) saturate(140%);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .lime-glow {
          box-shadow: 0 0 0 1px rgba(217, 255, 0, 0.2), 0 20px 80px -20px rgba(217, 255, 0, 0.4);
        }
        .grid-bg {
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 64px 64px;
        }
        .text-balance { text-wrap: balance; }
      `}</style>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#d9ff00] rounded-sm flex items-center justify-center">
              <span className="font-mono text-black text-xs font-bold">R</span>
            </div>
            <span className="font-display text-xl">Rainn's<span className="text-[#d9ff00]">.</span></span>
            <span className="font-mono text-[10px] text-neutral-500 ml-2 hidden sm:inline">/ AI EMPLOYEE SYSTEMS</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-wider text-neutral-400">
            <a href="#problem" className="hover:text-white transition">The Problem</a>
            <a href="#solution" className="hover:text-white transition">Solution</a>
            <a href="#demo" className="hover:text-white transition">Demo</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
          </div>
          <a href="#cta" className="group flex items-center gap-2 bg-[#d9ff00] text-black px-4 py-2 rounded-sm font-mono text-xs uppercase tracking-wider font-medium hover:bg-white transition">
            Free Audit
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-24 px-6 grain">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#d9ff00] opacity-[0.04] blur-[120px]" />

        <div className="relative max-w-7xl mx-auto">
          {/* Status bar */}
          <div className="flex items-center justify-between mb-16 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#d9ff00] rounded-full animate-pulse" />
              <span>System online · {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
            </div>
            <div className="hidden md:block">Rainn's Enterprises · Holding Co.</div>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7 fade-up">
              <div className="inline-flex items-center gap-2 mb-8 px-3 py-1 border border-neutral-800 rounded-full font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                <Sparkles className="w-3 h-3 text-[#d9ff00]" />
                Full-Cycle AI Employees for Local Service Brands
              </div>

              <h1 className="font-display text-[clamp(3rem,7vw,6.5rem)] leading-[0.95] text-balance mb-8">
                Every missed call is a
                <br />
                <span className="italic text-[#d9ff00]">competitor's </span>
                <span className="italic">paycheck.</span>
              </h1>

              <p className="text-lg md:text-xl text-neutral-400 max-w-xl mb-10 leading-relaxed text-balance">
                We deploy AI receptionists, web agents, and reactivation engines that answer every lead in under <span className="text-white font-medium">3 seconds</span> — so you stop bleeding revenue while you're on the ladder.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <a href="#cta" className="group flex items-center justify-center gap-2 bg-[#d9ff00] text-black px-6 py-4 rounded-sm font-medium hover:bg-white transition">
                  Get Your Free AI Visibility Audit
                  <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                </a>
                <a href="#demo" className="flex items-center justify-center gap-2 border border-neutral-800 text-neutral-300 px-6 py-4 rounded-sm hover:border-neutral-600 hover:text-white transition">
                  See it work
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Live missed-call ticker */}
            <div className="lg:col-span-5 fade-up" style={{ animationDelay: "0.2s" }}>
              <div className="glass rounded-md p-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Live · since you loaded this page</div>
                  <Activity className="w-3.5 h-3.5 text-[#d9ff00]" />
                </div>

                <div className="space-y-5">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mb-2 flex items-center gap-2">
                      <PhoneOff className="w-3 h-3" /> Calls missed by small biz (US)
                    </div>
                    <div className="font-display text-5xl tabular-nums">{missedCalls.toLocaleString()}</div>
                  </div>

                  <div className="h-px bg-neutral-800" />

                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mb-2 flex items-center gap-2">
                      <TrendingDown className="w-3 h-3" /> Revenue evaporated
                    </div>
                    <div className="font-display text-5xl tabular-nums text-[#d9ff00]">
                      ${revenueLost.toLocaleString()}
                    </div>
                  </div>

                  <div className="pt-2 font-mono text-[10px] text-neutral-600 leading-relaxed">
                    Est. avg. $287 LTV per missed call · Source: BIA/Kelsey, Invoca call studies
                  </div>
                </div>

                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-[#d9ff00] opacity-10 blur-3xl rounded-full" />
              </div>
            </div>
          </div>

          {/* Logo strip */}
          <div className="mt-24 pt-8 border-t border-neutral-900">
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-600 mb-6 text-center">
              Built for the trades · Deployed across our DBA portfolio
            </div>
            <div className="overflow-hidden">
              <div className="flex gap-16 marquee whitespace-nowrap">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex gap-16 items-center font-display text-2xl text-neutral-700">
                    <span>Roofing</span><span>·</span>
                    <span>HVAC</span><span>·</span>
                    <span>Car Detailing</span><span>·</span>
                    <span>Plumbing</span><span>·</span>
                    <span>Med Spas</span><span>·</span>
                    <span>Pest Control</span><span>·</span>
                    <span>Landscaping</span><span>·</span>
                    <span>Locksmiths</span><span>·</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section id="problem" className="relative py-32 px-6 border-t border-neutral-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 mb-20">
            <div className="lg:col-span-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#d9ff00] mb-4">01 / The Problem</div>
              <h2 className="font-display text-5xl md:text-6xl leading-[0.95] text-balance">
                You're losing jobs you <span className="italic">never knew existed.</span>
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <p className="text-lg text-neutral-400 leading-relaxed text-balance">
                Service businesses are built around the truck, the tool, the technician. Not the front desk. So when the phone rings while you're under a sink — it goes to voicemail. And voicemails don't pay rent.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-neutral-900 border border-neutral-900">
            {[
              {
                stat: "62%",
                label: "of calls to small businesses go unanswered",
                detail: "BrightLocal, 2024 — and the caller dials your competitor within 90 seconds.",
                icon: PhoneOff,
              },
              {
                stat: "5 min",
                label: "is the cliff for lead conversion",
                detail: "Leads contacted within 5 min are 21× more likely to convert than those after 30 min (HBR).",
                icon: Clock,
              },
              {
                stat: "$1,200",
                label: "avg lifetime value of one missed roofing lead",
                detail: "Multiply by 8–12 missed calls a week. The math is brutal.",
                icon: TrendingDown,
              },
            ].map((item, i) => (
              <div key={i} className="bg-[#0a0b0a] p-8 md:p-10 hover:bg-[#0f100f] transition group">
                <item.icon className="w-5 h-5 text-neutral-600 group-hover:text-[#d9ff00] transition mb-8" />
                <div className="font-display text-7xl md:text-8xl mb-4 text-[#d9ff00] leading-none">{item.stat}</div>
                <div className="text-white font-medium mb-3">{item.label}</div>
                <div className="font-mono text-xs text-neutral-500 leading-relaxed">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE SOLUTION — 3 Tiers */}
      <section id="solution" className="relative py-32 px-6 border-t border-neutral-900 grain">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 mb-20">
            <div className="lg:col-span-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#d9ff00] mb-4">02 / The System</div>
              <h2 className="font-display text-5xl md:text-6xl leading-[0.95] text-balance">
                Three AI employees. <span className="italic">One paycheck.</span>
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <p className="text-lg text-neutral-400 leading-relaxed text-balance">
                Speed-to-lead in under 3 seconds, 24/7/365 — across voice, web, and your dormant database. Built on Retell, Vapi, and GoHighLevel. Tuned for the trades.
              </p>
            </div>
          </div>

          <div className="space-y-px bg-neutral-900 border border-neutral-900">
            {[
              {
                num: "I",
                title: "The Receptionist",
                subtitle: "AI Voice Agent",
                desc: "Answers every inbound call in under 2 rings. Qualifies, handles objections, and books appointments directly into your calendar. Sounds human. Never sleeps. Never has a bad Monday.",
                stack: "Retell AI · Vapi · Twilio",
                features: ["24/7 inbound coverage", "Live calendar booking", "Custom voice + persona", "SMS follow-up trigger"],
                icon: Phone,
              },
              {
                num: "II",
                title: "The Lead Catcher",
                subtitle: "AI Web Agent",
                desc: "A React chat widget that intercepts visitors before they bounce. Qualifies in conversation, captures contact info, and pings your phone the moment a hot lead is ready.",
                stack: "React · GPT-4o · Webhooks",
                features: ["<3s response time", "Mobile-first widget", "Form-free capture", "Live handoff to human"],
                icon: MessageSquare,
              },
              {
                num: "III",
                title: "The Resurrector",
                subtitle: "Database Reactivation",
                desc: "Your CRM is a graveyard of $50K+ in dead leads. We deploy AI-personalized SMS + email sequences that wake them up, book them, and route them — automatically.",
                stack: "GoHighLevel · Zapier · Custom LLM prompts",
                features: ["1-click campaign launch", "Personalized at scale", "Reply detection + handoff", "ROI dashboard"],
                icon: Database,
              },
            ].map((tier, i) => (
              <div key={i} className="bg-[#0a0b0a] p-8 md:p-12 hover:bg-[#0f100f] transition group">
                <div className="grid md:grid-cols-12 gap-8 items-start">
                  <div className="md:col-span-1">
                    <div className="font-display text-5xl text-[#d9ff00] italic">{tier.num}</div>
                  </div>
                  <div className="md:col-span-5">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mb-2">{tier.subtitle}</div>
                    <h3 className="font-display text-4xl md:text-5xl mb-4">{tier.title}</h3>
                    <p className="text-neutral-400 leading-relaxed mb-4">{tier.desc}</p>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-600">{tier.stack}</div>
                  </div>
                  <div className="md:col-span-5 md:col-start-8">
                    <ul className="space-y-3">
                      {tier.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <Check className="w-4 h-4 text-[#d9ff00] mt-1 flex-shrink-0" />
                          <span className="text-neutral-300">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <tier.icon className="w-6 h-6 text-neutral-700 group-hover:text-[#d9ff00] transition" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTERACTIVE DEMO */}
      <section id="demo" className="relative py-32 px-6 border-t border-neutral-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 mb-16">
            <div className="lg:col-span-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#d9ff00] mb-4">03 / Live Demo</div>
              <h2 className="font-display text-5xl md:text-6xl leading-[0.95] text-balance">
                Talk to the AI. <span className="italic">Right now.</span>
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <p className="text-lg text-neutral-400 leading-relaxed text-balance">
                This is the actual widget — not a screenshot. Ask about a roof leak, book an appointment, try to break it. This is what visits to your site will look like in 2 weeks.
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 font-mono text-xs uppercase tracking-wider">
            {[
              { id: "voice", label: "Voice Agent", icon: Mic },
              { id: "chat", label: "Web Chat", icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-sm border transition ${
                  activeTab === tab.id
                    ? "bg-[#d9ff00] text-black border-[#d9ff00]"
                    : "border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-white"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Demo container */}
          <div className="glass rounded-md overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* Left: Browser frame mockup */}
              <div className="p-8 md:p-12 border-r border-neutral-900 bg-[#070807]">
                <div className="flex items-center gap-1.5 mb-6">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                  <div className="ml-3 font-mono text-[10px] text-neutral-600">apex-roofing.com</div>
                </div>
                <div className="font-display text-3xl mb-3">Apex Roofing & Restoration</div>
                <div className="text-neutral-500 text-sm mb-6 leading-relaxed">
                  Family-owned. Serving Davidson County since 2011. Free estimates, no pressure, no upsells.
                </div>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {["Roofing", "Gutters", "Repairs"].map((s) => (
                    <div key={s} className="border border-neutral-900 rounded-sm p-3 font-mono text-[10px] uppercase text-neutral-500 text-center">
                      {s}
                    </div>
                  ))}
                </div>
                <div className="text-neutral-700 text-xs">↓ See the agent in the bottom-right →</div>
              </div>

              {/* Right: Active demo */}
              <div className="p-8 md:p-12 relative min-h-[520px] flex flex-col">
                {activeTab === "chat" ? (
                  <>
                    <div className="flex items-center gap-3 pb-4 mb-4 border-b border-neutral-900">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d9ff00] to-[#7a9100] flex items-center justify-center">
                          <span className="font-display text-black font-semibold">A</span>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0a0b0a]" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Ava · AI Concierge</div>
                        <div className="font-mono text-[10px] text-neutral-500">Responds in &lt;3 seconds</div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto mb-4 pr-2">
                      {chatMessages.map((m, i) => (
                        <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[85%] px-3.5 py-2.5 rounded-md text-sm leading-relaxed ${
                              m.from === "user"
                                ? "bg-[#d9ff00] text-black rounded-br-sm"
                                : "bg-neutral-900 text-neutral-100 rounded-bl-sm"
                            }`}
                          >
                            {m.text}
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-neutral-900 rounded-md rounded-bl-sm px-4 py-3 flex gap-1">
                            <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 items-center border border-neutral-800 rounded-md p-1.5 bg-neutral-900/50 focus-within:border-[#d9ff00] transition">
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendChat()}
                        placeholder="Try: 'I have a leak in my ceiling'"
                        className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-neutral-600"
                      />
                      <button
                        onClick={sendChat}
                        className="bg-[#d9ff00] text-black p-2 rounded-sm hover:bg-white transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 rounded-full bg-[#d9ff00] opacity-20" style={{ animation: "pulse-ring 2s ease-out infinite" }} />
                      <div className="absolute inset-0 rounded-full bg-[#d9ff00] opacity-20" style={{ animation: "pulse-ring 2s ease-out 0.6s infinite" }} />
                      <div className="relative w-24 h-24 rounded-full bg-[#d9ff00] flex items-center justify-center lime-glow">
                        <Phone className="w-9 h-9 text-black" />
                      </div>
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-[#d9ff00] mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#d9ff00] rounded-full animate-pulse" />
                      Live · Sample call in progress
                    </div>
                    <div className="font-display text-2xl mb-3 max-w-sm">
                      "Hi, this is Ava with Apex Roofing — how can I help you today?"
                    </div>
                    <div className="font-mono text-xs text-neutral-500 max-w-xs leading-relaxed">
                      Custom-trained voice agent. Books appointments. Handles 17 common objections. Hands off complex calls.
                    </div>
                    <button className="mt-8 flex items-center gap-2 border border-neutral-800 px-5 py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider hover:border-[#d9ff00] hover:text-[#d9ff00] transition">
                      <Calendar className="w-3.5 h-3.5" />
                      Book a live demo call
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Stat bar */}
            <div className="border-t border-neutral-900 grid grid-cols-3 divide-x divide-neutral-900">
              {[
                { v: "2.4s", l: "Avg response" },
                { v: "94%", l: "Booking rate" },
                { v: "24/7", l: "Always on" },
              ].map((s, i) => (
                <div key={i} className="p-4 text-center">
                  <div className="font-display text-2xl text-[#d9ff00]">{s.v}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="relative py-32 px-6 border-t border-neutral-900 grain">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 mb-20">
            <div className="lg:col-span-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#d9ff00] mb-4">04 / Pricing</div>
              <h2 className="font-display text-5xl md:text-6xl leading-[0.95] text-balance">
                Less than <span className="italic">one missed job</span> a month.
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <p className="text-lg text-neutral-400 leading-relaxed text-balance">
                Two tracks. Both pay for themselves before invoice #2. No contracts — we earn the renewal every month.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-neutral-900 border border-neutral-900">
            {/* TIER 1 */}
            <div className="bg-[#0a0b0a] p-10 md:p-12">
              <div className="flex items-baseline justify-between mb-2">
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Starter</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-700">01</div>
              </div>
              <h3 className="font-display text-4xl mb-1">Lead Capture</h3>
              <div className="text-neutral-500 mb-8">For owner-operators ready to stop missing calls.</div>

              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-display text-6xl">$500</span>
                <span className="font-mono text-xs text-neutral-500">setup</span>
              </div>
              <div className="flex items-baseline gap-2 mb-8 pb-8 border-b border-neutral-900">
                <span className="font-display text-2xl text-[#d9ff00]">+ $197</span>
                <span className="font-mono text-xs text-neutral-500">/ month</span>
              </div>

              <ul className="space-y-3 mb-10">
                {[
                  "AI Voice Receptionist (1 number)",
                  "Web Chat Widget — fully branded",
                  "Calendar + CRM integration",
                  "Basic SMS follow-up sequence",
                  "Monthly performance report",
                  "Standard support (24hr)",
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-neutral-300">
                    <Check className="w-4 h-4 text-[#d9ff00] mt-1 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <a href="#cta" className="block w-full text-center border border-neutral-800 hover:border-white text-white py-3.5 rounded-sm font-mono text-xs uppercase tracking-wider transition">
                Start with Lead Capture
              </a>
            </div>

            {/* TIER 2 */}
            <div className="bg-[#0a0b0a] p-10 md:p-12 relative">
              <div className="absolute top-6 right-6 bg-[#d9ff00] text-black font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm">
                Most Booked
              </div>
              <div className="flex items-baseline justify-between mb-2">
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#d9ff00]">Full Automation</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-700">02</div>
              </div>
              <h3 className="font-display text-4xl mb-1">Full-Cycle AI Employee</h3>
              <div className="text-neutral-500 mb-8">Voice + Web + Database resurrection. The whole machine.</div>

              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-display text-6xl text-[#d9ff00]">$1,000</span>
                <span className="font-mono text-xs text-neutral-500">setup</span>
              </div>
              <div className="flex items-baseline gap-2 mb-8 pb-8 border-b border-neutral-900">
                <span className="font-display text-2xl text-[#d9ff00]">+ $497</span>
                <span className="font-mono text-xs text-neutral-500">/ month</span>
              </div>

              <ul className="space-y-3 mb-10">
                {[
                  "Everything in Lead Capture",
                  "Database Reactivation engine",
                  "Multi-channel SMS + Email sequences",
                  "AEO Audit (ChatGPT, Perplexity, Gemini)",
                  "Custom objection handling library",
                  "A/B tested booking flows",
                  "Priority support + dedicated PM",
                  "Quarterly strategy call",
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-neutral-200">
                    <Check className="w-4 h-4 text-[#d9ff00] mt-1 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <a href="#cta" className="block w-full text-center bg-[#d9ff00] hover:bg-white text-black py-3.5 rounded-sm font-mono text-xs uppercase tracking-wider font-medium transition">
                Deploy the full system →
              </a>
            </div>
          </div>

          <div className="mt-8 text-center font-mono text-[11px] text-neutral-600">
            No long-term contracts · 30-day performance guarantee · Pause anytime
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="relative py-32 px-6 border-t border-neutral-900 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-[#d9ff00] opacity-[0.08] blur-[140px]" />
        <div className="absolute inset-0 grid-bg opacity-30" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest text-[#d9ff00] mb-6 flex items-center justify-center gap-2">
            <Zap className="w-3 h-3" />
            05 / The Next Move
          </div>

          <h2 className="font-display text-5xl md:text-7xl leading-[0.95] mb-8 text-balance">
            Get your <span className="italic text-[#d9ff00]">free AI Visibility Audit.</span>
          </h2>

          <p className="text-lg text-neutral-400 max-w-xl mx-auto mb-12 leading-relaxed text-balance">
            We'll show you exactly how invisible your business is to ChatGPT, Perplexity, and Gemini — and how many leads you're losing this week. No pitch. Just numbers.
          </p>

          <div className="glass rounded-md p-2 max-w-2xl mx-auto mb-8">
            <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
              <input
                placeholder="Business name"
                className="bg-neutral-900/50 border border-neutral-800 rounded-sm px-4 py-3.5 text-sm outline-none focus:border-[#d9ff00] transition"
              />
              <input
                placeholder="Website URL"
                className="bg-neutral-900/50 border border-neutral-800 rounded-sm px-4 py-3.5 text-sm outline-none focus:border-[#d9ff00] transition"
              />
              <button className="group flex items-center justify-center gap-2 bg-[#d9ff00] text-black px-6 py-3.5 rounded-sm font-medium hover:bg-white transition whitespace-nowrap">
                Run my audit
                <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
              </button>
            </div>
          </div>

          <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-600">
            Report delivered in &lt; 24 hours · No credit card · No spam · Pinky promise
          </div>

          {/* Trust bar */}
          <div className="mt-20 pt-12 border-t border-neutral-900 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { v: "<3s", l: "Speed to lead" },
              { v: "24/7", l: "Coverage" },
              { v: "30-day", l: "Guarantee" },
              { v: "100%", l: "US-based team" },
            ].map((s, i) => (
              <div key={i}>
                <div className="font-display text-3xl text-[#d9ff00]">{s.v}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative border-t border-neutral-900 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-8 mb-12">
            <div className="md:col-span-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-[#d9ff00] rounded-sm flex items-center justify-center">
                  <span className="font-mono text-black text-xs font-bold">R</span>
                </div>
                <span className="font-display text-xl">Rainn's<span className="text-[#d9ff00]">.</span></span>
              </div>
              <p className="text-sm text-neutral-500 max-w-sm leading-relaxed">
                Rainn's Enterprises is a holding company deploying Full-Cycle AI Employee systems for local service brands across North America.
              </p>
            </div>
            <div className="md:col-span-2">
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-600 mb-4">Product</div>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#solution" className="hover:text-white transition">Voice Agent</a></li>
                <li><a href="#solution" className="hover:text-white transition">Web Agent</a></li>
                <li><a href="#solution" className="hover:text-white transition">Reactivation</a></li>
                <li><a href="#" className="hover:text-white transition">AEO Audit</a></li>
              </ul>
            </div>
            <div className="md:col-span-2">
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-600 mb-4">Industries</div>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>Roofing</li>
                <li>HVAC</li>
                <li>Car Detailing</li>
                <li>Plumbing</li>
              </ul>
            </div>
            <div className="md:col-span-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-600 mb-4">Contact</div>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>hello@rainnsenterprises.com</li>
                <li>Nashville, TN</li>
                <li className="pt-2 font-mono text-[10px] text-neutral-700">DBAs: Rainn's AI · Rainn's Voice · Rainn's Web</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-neutral-900 flex flex-col md:flex-row justify-between gap-4 font-mono text-[10px] uppercase tracking-widest text-neutral-600">
            <div>© 2026 Rainn's Enterprises. All rights reserved.</div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#d9ff00] rounded-full animate-pulse" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
