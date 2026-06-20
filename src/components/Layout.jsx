import { useState, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Menu, X, Mail, MapPin, LogIn, LayoutDashboard } from "lucide-react";
import RaindropMark from "./RaindropMark";
import { supabase } from "../lib/supabase";
import { verticalFromPath, LIVE_VERTICALS } from "../config/verticals";

const EASE = [0.22, 1, 0.36, 1];

// Nav adapts to the active trade. Roofing (the bespoke flagship) keeps its rich
// sub-nav; template verticals + the brand hub get a lean cross-trade nav.
function getNavLinks(active) {
  if (active?.slug === "roofing") {
    return [
      { to: "/roofing/features", label: "What You Get" },
      { to: "/permit-intelligence", label: "Permit Intelligence" },
      { to: "/roofing/get-started", label: "How It Works" },
      { to: "/blog", label: "Blog" },
    ];
  }
  return [
    { to: "/services", label: "All Trades" },
    { to: "/blog", label: "Blog" },
  ];
}

function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const active = verticalFromPath(location.pathname);
  const navLinks = getNavLinks(active);
  // Carry the trade into onboarding so signups land on their vertical.
  const onboardingPath = active ? `/${active.slug}/onboarding` : "/onboarding";
  const ADMIN_EMAIL = "rainn.causer1@gmail.com";

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      setIsAdmin(u?.email === ADMIN_EMAIL);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsAdmin(u?.email === ADMIN_EMAIL);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-cream-100/90 backdrop-blur-xl shadow-soft border-b border-slate-900/6"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <RaindropMark size={26} />
            <span className="font-display text-xl text-slate-900 tracking-tight">
              Koemori<span className="text-rain-500">.</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500 ml-2 hidden sm:inline">
                AI
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-slate-900 text-cream-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-cream-200"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {!user && (
              <Link
                to="/portal/login"
                className="hidden md:inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 px-3 py-2 rounded-full text-[13px] font-medium transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in
              </Link>
            )}
            {user && isAdmin && (
              <Link
                to="/admin"
                className="hidden md:inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-900 px-3 py-2 rounded-full text-[13px] font-medium transition"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </Link>
            )}
            {user && !isAdmin && (
              <Link
                to="/portal"
                className="hidden md:inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-900 px-3 py-2 rounded-full text-[13px] font-medium transition"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                My Portal
              </Link>
            )}
            <Link
              to={onboardingPath}
              className="hidden md:inline-flex items-center gap-1.5 bg-rain-700 text-cream-100 px-4 py-2 rounded-full text-[13px] font-medium hover:bg-rain-600 transition"
            >
              Book a Call
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="fixed inset-0 z-30 bg-cream-100 pt-20 px-6 flex flex-col"
          >
            <nav className="flex flex-col gap-2 mt-4">
              <Link
                to="/"
                className="py-4 text-3xl font-display text-slate-900 border-b border-slate-900/8"
              >
                Home
              </Link>
              {navLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `py-4 text-3xl font-display border-b border-slate-900/8 transition ${
                      isActive ? "text-rain-700" : "text-slate-900"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-auto mb-8 space-y-2">
              {!user && (
                <Link
                  to="/portal/login"
                  className="flex items-center justify-center gap-2 bg-cream-200 border border-slate-900/10 text-slate-800 py-3.5 rounded-full font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  Sign in
                </Link>
              )}
              {user && isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center justify-center gap-2 bg-cream-200 border border-slate-900/10 text-slate-800 py-3.5 rounded-full font-medium"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              )}
              {user && !isAdmin && (
                <Link
                  to="/portal"
                  className="flex items-center justify-center gap-2 bg-cream-200 border border-slate-900/10 text-slate-800 py-3.5 rounded-full font-medium"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  My Portal
                </Link>
              )}
              <Link
                to={onboardingPath}
                className="flex items-center justify-center gap-2 bg-slate-900 text-cream-100 py-4 rounded-full font-medium"
              >
                Book a Call
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-900/8 py-16 px-6 bg-cream-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-12 gap-10 mb-12">
          <div className="md:col-span-4">
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <RaindropMark size={24} />
              <span className="font-display text-xl text-slate-900 tracking-tight">
                Koemori<span className="text-rain-500">.</span>
              </span>
            </Link>
            <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
              <strong className="text-slate-800">Koemori</strong> — from the Japanese
              声 <em>(koe, "voice")</em> + 守り <em>(mamori, "to guard")</em>: the voice that
              guards your business. Every call answered, every job caught — even when you're
              out in the field.
            </p>
            <div className="mt-5 space-y-2">
              <a href="mailto:help@koemori.ai" className="inline-flex items-center gap-2 text-[13px] text-slate-600 hover:text-rain-700 transition">
                <Mail className="w-3.5 h-3.5 text-rain-500" />
                help@koemori.ai
              </a>
              <div className="flex items-center gap-2 text-[13px] text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-rain-500" />
                Nashville, TN · 615 / 629
              </div>
            </div>
          </div>
          <div className="md:col-span-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-4">
              Built For
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-600">
              {LIVE_VERTICALS.map((v) => (
                <li key={v.slug}>
                  <Link to={v.to} className="hover:text-slate-900 transition">
                    {v.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-4">
              The System
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/" className="hover:text-slate-900 transition">
                  All Trades
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-slate-900 transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/onboarding" className="hover:text-slate-900 transition">
                  Get Set Up
                </Link>
              </li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-4">
              Legal
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/terms" className="hover:text-slate-900 transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-slate-900 transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/privacy#sms" className="hover:text-slate-900 transition">
                  SMS / 10DLC Disclosure
                </Link>
              </li>
              <li>
                <Link to="/privacy#do-not-sell" className="hover:text-slate-900 transition">
                  Do Not Sell My Info
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-900/8 flex flex-col md:flex-row justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
          <div>© 2026 Koemori · Nashville, TN · All rights reserved.</div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-rain-500 rounded-full animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 18 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -10 },
};
const pageTransition = { duration: 0.35, ease: EASE };

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-cream-100 text-slate-900 antialiased">
      <Nav />
      <main className="pt-16">
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="in"
          exit="out"
          transition={pageTransition}
        >
          {children}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
