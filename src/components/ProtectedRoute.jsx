import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const ADMIN_EMAIL = "rainn.causer1@gmail.com";

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("loading"); // loading | authed | unauthed | forbidden

  useEffect(() => {
    if (!supabase) {
      setStatus("unauthed");
      return;
    }

    async function check(session) {
      if (!session) { setStatus("unauthed"); return; }
      if (session.user?.email !== ADMIN_EMAIL) {
        // Valid session but wrong account — sign them out silently and block
        await supabase.auth.signOut();
        setStatus("forbidden");
        return;
      }
      setStatus("authed");
    }

    supabase.auth.getSession().then(({ data }) => check(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      check(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-rain-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (status === "forbidden") {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="font-display text-2xl text-slate-900 mb-2">Access denied</h1>
          <p className="text-slate-500 text-sm">This area is restricted. <a href="/portal/login" className="text-rain-700 underline">Go to client portal →</a></p>
        </div>
      </div>
    );
  }
  if (status === "unauthed") return <Navigate to="/login" replace />;
  return children;
}
