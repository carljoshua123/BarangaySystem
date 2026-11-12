import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Register({ switchToLogin }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailAvailability, setEmailAvailability] = useState({ email: '', status: 'idle' });
  const [role, setRole] = useState('resident');
  const [registrationSuccess, setRegistrationSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordChecks = [
    { label: 'At least 12 characters', passed: password.length >= 12 },
    { label: 'Uppercase and lowercase letters', passed: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: 'At least one number', passed: /\d/.test(password) },
    { label: 'At least one symbol', passed: /[^A-Za-z0-9\s]/.test(password) }
  ];
  const passedPasswordChecks = passwordChecks.filter((check) => check.passed).length;
  const passwordStrength = password.length === 0
    ? ''
    : passedPasswordChecks === passwordChecks.length
      ? 'Strong'
      : passedPasswordChecks >= 2
        ? 'Medium'
        : 'Weak';
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const normalizedEmail = email.trim().toLowerCase();
  const emailIsValid = normalizedEmail.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail);
  const emailStatus = !email
    ? 'idle'
    : !emailIsValid
      ? 'invalid'
      : emailAvailability.email !== normalizedEmail
        ? 'checking'
        : emailAvailability.status;

  useEffect(() => {
    if (!emailIsValid) return undefined;

    let active = true;
    const timeout = window.setTimeout(async () => {
      try {
        const response = await api.get('/api/auth/check-email', {
          params: { email: normalizedEmail }
        });
        if (active) {
          setEmailAvailability({
            email: normalizedEmail,
            status: response.data.available ? 'available' : 'taken'
          });
        }
      } catch {
        if (active) setEmailAvailability({ email: normalizedEmail, status: 'error' });
      }
    }, 400);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [emailIsValid, normalizedEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwordStrength !== 'Strong') {
      setError('Meet all password requirements before creating your account.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setRegistrationSuccess('');
    try {
      await api.post('/api/auth/register', { fullName, email: normalizedEmail, password, role });
      setRegistrationSuccess(role === 'resident'
        ? 'Your account was created and is awaiting admin approval.'
        : 'Your admin account was created successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Create Account</h2>
      {error && <div className="alert alert-danger py-2 text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-semibold mb-1 text-gray-700">Full Name</label>
        <input 
          type="text" 
          className="form-control p-2.5 rounded-lg border border-gray-300 w-full" 
          value={fullName} 
          onChange={(e) => setFullName(e.target.value)} 
          required 
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1 text-gray-700">Email Address</label>
        <input 
          type="email" 
          className="form-control p-2.5 rounded-lg border border-gray-300 w-full" 
          value={email} 
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
          autoComplete="email"
          maxLength={254}
          aria-invalid={emailStatus === 'invalid' || emailStatus === 'taken'}
          aria-describedby="email-validation-status"
          required 
        />
        {emailStatus !== 'idle' && (
          <p
            id="email-validation-status"
            className={`email-validation-status email-validation-status--${emailStatus}`}
            aria-live="polite"
          >
            {emailStatus === 'invalid' && 'Enter a valid email address.'}
            {emailStatus === 'checking' && 'Checking email availability…'}
            {emailStatus === 'available' && 'Email address is available.'}
            {emailStatus === 'taken' && 'This email is already registered.'}
            {emailStatus === 'error' && 'Could not check availability; the server will verify during registration.'}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1 text-gray-700">Password</label>
        <input 
          type="password" 
          className="form-control p-2.5 rounded-lg border border-gray-300 w-full" 
          value={password} 
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          aria-describedby="password-requirements"
          required 
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1 text-gray-700">Confirm Password</label>
        <input
          type="password"
          className="form-control p-2.5 rounded-lg border border-gray-300 w-full"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setError('');
          }}
          autoComplete="new-password"
          maxLength={128}
          aria-describedby="password-match-status"
          required
        />
        {confirmPassword && (
          <p
            id="password-match-status"
            className={`password-match-status ${passwordsMatch ? 'password-match-status--match' : 'password-match-status--mismatch'}`}
            aria-live="polite"
          >
            {passwordsMatch ? 'Passwords match.' : 'Passwords do not match.'}
          </p>
        )}
      </div>

      <div className="password-strength" id="password-requirements" aria-live="polite">
        <div className="password-strength-heading">
          <span>Password strength</span>
          <strong className={passwordStrength ? `password-strength-label password-strength-label--${passwordStrength.toLowerCase()}` : 'password-strength-label'}>
            {passwordStrength || 'Not entered'}
          </strong>
        </div>
        <div className="password-strength-meter" aria-hidden="true">
          <span
            className={passwordStrength ? `password-strength-fill password-strength-fill--${passwordStrength.toLowerCase()}` : 'password-strength-fill'}
            style={{ width: `${(passedPasswordChecks / passwordChecks.length) * 100}%` }}
          />
        </div>
        <ul className="password-requirements">
          {passwordChecks.map((check) => (
            <li className={check.passed ? 'password-requirement password-requirement--passed' : 'password-requirement'} key={check.label}>
              <span aria-hidden="true">{check.passed ? '✓' : '○'}</span>
              {check.label}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1 text-gray-700">Account Type</label>
        <select 
          className="form-select p-2.5 rounded-lg border border-gray-300 w-full"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="resident">Resident (Requires Admin Evaluation)</option>
          <option value="admin">Barangay Official / Admin</option>
        </select>
      </div>

      <button 
        type="submit" 
        disabled={loading || passwordStrength !== 'Strong' || !passwordsMatch || emailStatus === 'invalid' || emailStatus === 'taken'}
        className="btn btn-success w-full py-2.5 font-bold shadow-md bg-green-600 hover:bg-green-700 border-none transition"
      >
        {loading ? 'Processing...' : 'Register Account'}
      </button>
      </form>
      {registrationSuccess && (
        <div className="auth-feedback-backdrop" role="presentation" onClick={() => setRegistrationSuccess('')}>
          <section
            className="auth-feedback-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="registration-success-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="auth-feedback-kicker">Account created</p>
            <h2 id="registration-success-title">Registration successful</h2>
            <p>{registrationSuccess}</p>
            <div>
              <button
                type="button"
                className="auth-feedback-continue"
                onClick={() => {
                  setRegistrationSuccess('');
                  switchToLogin();
                }}
              >
                Go to login
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}