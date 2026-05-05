import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import FocalView from '../components/FocalView';

// Password strength checker — returns { score 0-4, label, color, checks }
function checkPassword(pwd) {
  const checks = {
    length:    pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number:    /\d/.test(pwd),
    special:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
  const colors = ['', '#ef4444', '#f59e0b', '#eab308', '#10b981', '#6366f1'];
  return { score, label: labels[score] || '', color: colors[score] || '', checks };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'renter' });
  const [error, setError] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Client-side pre-check
    const { checks } = checkPassword(form.password);
    if (!Object.values(checks).every(Boolean)) {
      setError('Please meet all password requirements before continuing.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      login(res.data);
      navigate('/browse');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pwd = checkPassword(form.password);
  const showStrength = form.password.length > 0;

  return (
    <div className="auth-page">
      <FocalView>
        <div className="auth-card">
          <span className="auth-logo">◉ RoomRadar</span>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-sub">Join thousands finding their perfect room</p>

          <form onSubmit={handleSubmit}>
            <label>
              Full name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Rahul Sharma"
                required
                minLength={2}
                autoComplete="name"
              />
            </label>

            <label>
              Email address
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </label>

            <label>
              Password
              <div className="password-wrapper">
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPass((p) => !p)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Password strength meter */}
              {showStrength && (
                <div style={{ marginTop: '0.6rem' }}>
                  {/* Strength bar */}
                  <div style={{ display: 'flex', gap: '3px', marginBottom: '0.4rem' }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: '4px',
                          borderRadius: '2px',
                          background: i <= pwd.score ? pwd.color : 'var(--border)',
                          transition: 'background 250ms ease',
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: pwd.color }}>
                    {pwd.label}
                  </div>

                  {/* Requirement checklist */}
                  <div style={{ marginTop: '0.6rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 0.5rem' }}>
                    {[
                      { key: 'length',    label: '8+ characters' },
                      { key: 'uppercase', label: 'Uppercase letter' },
                      { key: 'lowercase', label: 'Lowercase letter' },
                      { key: 'number',    label: 'Number (0–9)' },
                      { key: 'special',   label: 'Special char (!@#…)' },
                    ].map(({ key, label }) => (
                      <div
                        key={key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.72rem',
                          color: pwd.checks[key] ? '#10b981' : 'var(--muted)',
                          transition: 'color 200ms',
                        }}
                      >
                        <span style={{ fontSize: '0.75rem' }}>{pwd.checks[key] ? '✅' : '○'}</span>
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </label>

            <label>
              I am a
              <div className="role-tabs" style={{ marginTop: '0.4rem' }}>
                <button
                  type="button"
                  className={`role-tab ${form.role === 'renter' ? 'selected' : ''}`}
                  onClick={() => setForm((p) => ({ ...p, role: 'renter' }))}
                >
                  🔍 Looking for room
                </button>
                <button
                  type="button"
                  className={`role-tab ${form.role === 'owner' ? 'selected' : ''}`}
                  onClick={() => setForm((p) => ({ ...p, role: 'owner' }))}
                >
                  🏠 House Owner
                </button>
              </div>
            </label>

            {error && <div className="error">{error}</div>}

            <button
              type="submit"
              className="form-submit-btn"
              disabled={loading || (showStrength && pwd.score < 5)}
            >
              {loading ? 'Creating account…' : 'Create account →'}
            </button>

            {showStrength && pwd.score < 5 && (
              <p style={{ fontSize: '0.72rem', color: 'var(--muted)', textAlign: 'center', marginTop: '0.5rem' }}>
                Complete all password requirements to continue
              </p>
            )}
          </form>

          <p className="auth-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </FocalView>
    </div>
  );
}
