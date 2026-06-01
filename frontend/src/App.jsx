import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ChatPage from "./pages/ChatPage";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#fff8f5]">
        <div className="flex flex-col items-center gap-3.5">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#0d2678] text-white shadow-sm">
            <MessageSquare size={22} strokeWidth={2.4} />
          </div>
          <p className="text-sm text-[#757683]">Loading Pai…</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/" replace /> : <SignupPage />}
      />
      <Route
        path="/"
        element={user ? <ChatPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="*"
        element={<Navigate to={user ? "/" : "/login"} replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
