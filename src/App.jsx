import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Services from "./pages/Services";
import Vertical from "./pages/Vertical";
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Automations from "./pages/Automations";
import Marketing from "./pages/Marketing";
import Architecture from "./pages/Architecture";
import GetStarted from "./pages/GetStarted";
import Onboarding from "./pages/Onboarding";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import PermitIntelligence from "./pages/PermitIntelligence";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Portal from "./pages/Portal";
import PortalLogin from "./pages/PortalLogin";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Brand hub — what Koemori is + the trade picker */}
        <Route path="/" element={<Layout><Landing /></Layout>} />

        {/* Roofing — the flagship, bespoke page (a live client relies on it) */}
        <Route path="/roofing" element={<Layout><Home /></Layout>} />
        <Route path="/roofing/features" element={<Layout><Automations /></Layout>} />
        <Route path="/roofing/get-started" element={<Layout><GetStarted /></Layout>} />

        {/* Legacy roofing links — preserve old bookmarks/SEO */}
        <Route path="/automations" element={<Navigate to="/roofing/features" replace />} />
        <Route path="/get-started" element={<Navigate to="/roofing/get-started" replace />} />

        {/* Shared brand pages */}
        <Route path="/services" element={<Layout><Services /></Layout>} />
        <Route path="/permit-intelligence" element={<Layout><PermitIntelligence /></Layout>} />
        <Route path="/marketing" element={<Layout><Marketing /></Layout>} />
        <Route path="/architecture" element={<Layout><Architecture /></Layout>} />

        {/* Onboarding wizard — standalone, full-screen (no nav/footer).
            /:slug/onboarding prefills the trade from the page they came from. */}
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/:slug/onboarding" element={<Onboarding />} />

        {/* Blog + legal */}
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/terms" element={<Layout><Terms /></Layout>} />
        <Route path="/privacy" element={<Layout><Privacy /></Layout>} />

        {/* Auth — no shared Layout (full-screen login) */}
        <Route path="/login" element={<Login />} />

        {/* Client portal — magic-link login + protected dashboard */}
        <Route path="/portal/login" element={<PortalLogin />} />
        <Route path="/portal" element={<Portal />} />

        {/* Admin — protected, no shared Layout */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* Per-vertical landing pages, config-driven. Ranks below every static
            route above, so it only catches trade slugs (/lawncare, /hvac, …).
            Unknown slugs redirect home from inside Vertical. */}
        <Route path="/:slug" element={<Layout><Vertical /></Layout>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
