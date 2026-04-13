import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "#F9F9F9" }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "#308AD8" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: "#9ca3af" }}>Loading Preddi…</p>
        </div>
      </div>
    );
  }

  return user ? <ChatPage /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
