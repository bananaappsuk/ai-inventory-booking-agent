import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PasswordField } from "../components/common/PasswordField";

function AuthBrand() {
  return (
    <div className="auth-brand">
      <div className="auth-brand-mark">
        <span className="material-symbols-outlined">inventory</span>
      </div>
      <div>
        <h1 className="auth-brand-name">EventFlow</h1>
        <p className="auth-brand-subtitle">Inventory Management</p>
      </div>
    </div>
  );
}

export function SignupPage() {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const message = await signup(name, email, password, phone || undefined);
      setPendingMessage(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (pendingMessage) {
    return (
      <div className="auth-page">
        <div className="auth-form">
          <AuthBrand />
          <div className="form">
            <h1>Almost there</h1>
            <p>{pendingMessage}</p>
            <p className="hint">
              <Link to="/login">Back to log in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-form">
        <AuthBrand />
        <form className="form" onSubmit={handleSubmit}>
          <h1>Sign up</h1>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <PasswordField value={password} onChange={setPassword} minLength={8} required />
          </label>
          <label>
            Phone (optional)
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? "Signing up..." : "Sign up"}
          </button>
          <p className="hint">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
