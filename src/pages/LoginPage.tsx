import { useState } from "react";
import scLogo from "@/assets/sc-logo.png";
import { authenticate } from "@/data/users";

interface Props {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (authenticate(username, password)) {
      onLogin();
    } else {
      setError("Invalid username or password.");
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="bg-surface-card border border-edge rounded-xl shadow-lg p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-7">
          <img src={scLogo} alt="Sri Chaitanya" className="w-16 h-16 object-contain mb-3" />
          <h1 className="font-display text-xl font-bold text-ink">
            Year End Concession
          </h1>
          <p className="text-xs text-ink-muted mt-1 text-center">
            Sri Chaitanya Educational Institutions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-ink-muted block mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full bg-surface border border-edge rounded-lg px-3 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="text-xs text-ink-muted block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-surface border border-edge rounded-lg px-3 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
              placeholder="Enter password"
            />
          </div>
          {error && (
            <p className="text-xs text-status-danger bg-red-50 border border-red-100 rounded px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-brand text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-brand-dark transition-colors mt-2"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
