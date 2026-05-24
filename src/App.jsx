import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Automations from "./pages/Automations";
import Marketing from "./pages/Marketing";
import Architecture from "./pages/Architecture";
import GetStarted from "./pages/GetStarted";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Portal from "./pages/Portal";
import PortalLogin from "./pages/PortalLogin";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public routes — inside shared Layout (nav + footer) */}
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route
          path="/automations"
          element={
            <Layout>
              <Automations />
            </Layout>
          }
        />
        <Route
          path="/marketing"
          element={
            <Layout>
              <Marketing />
            </Layout>
          }
        />
        <Route
          path="/architecture"
          element={
            <Layout>
              <Architecture />
            </Layout>
          }
        />
        <Route
          path="/get-started"
          element={
            <Layout>
              <GetStarted />
            </Layout>
          }
        />

        {/* Onboarding wizard — standalone, full-screen (no nav/footer) */}
        <Route path="/onboarding" element={<Onboarding />} />

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
