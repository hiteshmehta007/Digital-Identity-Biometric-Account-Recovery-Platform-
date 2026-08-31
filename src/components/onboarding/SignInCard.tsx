import React, { useEffect, useState } from 'react';
import OTPVerification from './OTPVerification';

type Props = {
  onSignedIn?: (user?: { name?: string; email?: string }) => void;
};

const emailOrPhoneRegex = /^(?:\+?[0-9]{7,15}|[\w.-]+@[\w.-]+\.[A-Za-z]{2,})$/;

export default function SignInCard({ onSignedIn }: Props) {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ credential?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [contactForOtp, setContactForOtp] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | undefined>(undefined);

  // simple password strength indicator
  const passwordStrength = (p: string) => {
    let score = 0;
    if (p.length >= 8) score += 1;
    if (/[A-Z]/.test(p)) score += 1;
    if (/[0-9]/.test(p)) score += 1;
    if (/[^A-Za-z0-9]/.test(p)) score += 1;
    return score; // 0..4
  };

  useEffect(() => {
    // realtime validation for credential field
    if (!credential) {
      setErrors((e) => ({ ...e, credential: 'Field required' }));
    } else if (!emailOrPhoneRegex.test(credential)) {
      setErrors((e) => ({ ...e, credential: 'Enter a valid email, username or phone' }));
    } else {
      setErrors((e) => ({ ...e, credential: undefined }));
    }
  }, [credential]);

  useEffect(() => {
    if (!password) setErrors((e) => ({ ...e, password: 'Field required' }));
    else if (password.length < 6) setErrors((e) => ({ ...e, password: 'Password too short' }));
    else setErrors((e) => ({ ...e, password: undefined }));
  }, [password]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (errors.credential || errors.password) return;
    setSubmitting(true);

    // Simulate credential check against server
    await new Promise((r) => setTimeout(r, 700));

    // For demo: accept any credential + password combo but derive contact to send OTP
    let contact: string;
    if (/@/.test(credential)) {
      contact = credential;
    } else if (credential.replace(/[^0-9+]/g, '').length >= 7) {
      contact = credential;
    } else {
      contact = `${credential}@example.com`;
    }

    // Derive a display name for welcome message (non-sensitive)
    setUserName(credential.includes('@') ? credential.split('@')[0] : credential);
    setContactForOtp(contact);

    // show OTP verification screen
    setShowOtp(true);
    setSubmitting(false);
  };

  if (showOtp && contactForOtp) {
    return (
      <div className="max-w-md mx-auto">
        <OTPVerification
          contact={contactForOtp}
          onVerified={() => onSignedIn?.({ name: userName, email: contactForOtp })}
          onCancel={() => setShowOtp(false)}
        />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6"
      aria-labelledby="signin-title"
    >
      <h3 id="signin-title" className="text-lg font-semibold mb-4">Sign in to Digital Identity Recovery</h3>

      <label className="block mb-3">
        <span className="text-xs text-gray-500">Email, username or phone</span>
        {errors.credential ? (
          <input
            type="text"
            value={credential}
            onChange={(e) => setCredential(e.target.value.trim())}
            className="mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="you@example.com or +1 555 555 5555"
            aria-invalid="true"
          />
        ) : (
          <input
            type="text"
            value={credential}
            onChange={(e) => setCredential(e.target.value.trim())}
            className="mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="you@example.com or +1 555 555 5555"
            aria-invalid="false"
          />
        )}
        {errors.credential && <div className="text-xs text-red-600 mt-1">{errors.credential}</div>}
      </label>

      <label className="block mb-2">
        <span className="text-xs text-gray-500">Password</span>
        {errors.password ? (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="••••••••"
            aria-invalid="true"
          />
        ) : (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="••••••••"
            aria-invalid="false"
          />
        )}
        {errors.password && <div className="text-xs text-red-600 mt-1">{errors.password}</div>}
      </label>

      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-gray-500">Password strength: <strong>{['Weak','Fair','Good','Strong','Excellent'][passwordStrength(password)]}</strong></div>
        <a className="text-xs text-indigo-600 hover:underline" href="#">Forgot password?</a>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
        <button
          type="button"
          className="text-sm text-gray-600 hover:underline"
          onClick={() => alert('Biometrics sign-in is coming soon')}
        >
          Sign in with biometrics
        </button>
      </div>
    </form>
  );
}
