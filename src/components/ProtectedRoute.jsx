import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("loading"); // loading | authed | unauthed

  useEffect(() => {
    if (!supabase) {
      setStatus("unauthed");
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? "authed" : "unauthed");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setStatus(session ? "authed" : "unauthed");
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
  if (status === "unauthed") return <Navigate to="/login" replace />;
  return children;
}
