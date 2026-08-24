import { useEffect, useRef, useState } from 'react';

type Props = {
  contact: string;
  onVerified?: () => void;
  onCancel?: () => void;
};

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 300; // 5 minutes
const RESEND_COOLDOWN = 30; // seconds
const MAX_ATTEMPTS = 3;

export default function OTPVerification({ contact, onVerified, onCancel }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // For demo purposes only: generate a transient OTP and log it (remove in production)
  const otpRef = useRef<string>('');
  const generateOtp = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    otpRef.current = code;
    // eslint-disable-next-line no-console
    console.info('DEBUG OTP for', contact, code);
  };

  useEffect(() => {
    generateOtp();
    setSecondsLeft(OTP_EXPIRY_SECONDS);
    const t = window.setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => {
      // explicit cleanup returning void
      window.clearInterval(t);
    };
  }, [contact]);

  useEffect(() => {
    if (secondsLeft === 0) setMessage('OTP expired. Please resend to get a new code.');
  }, [secondsLeft]);

  useEffect(() => {
    let t: number | undefined;
    if (resendCooldown > 0) {
      t = window.setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    }
    return () => {
      if (t !== undefined) window.clearInterval(t);
    };
  }, [resendCooldown]);

  useEffect(() => {
    if (attempts >= MAX_ATTEMPTS) setLocked(true);
  }, [attempts]);

  const focusAt = (idx: number) => {
    const el = inputsRef.current[idx];
    if (el) el.focus();
  };

  const handleDigitChange = (idx: number, value: string) => {
    if (locked) return;
    const c = value.replace(/[^0-9]/g, '').slice(-1);
    setDigits((d) => {
      const next = [...d];
      next[idx] = c;
      return next;
    });
    if (c && idx < OTP_LENGTH - 1) focusAt(idx + 1);
    if (!c && idx > 0) focusAt(idx - 1);
  };

  const submit = () => {
    if (locked) return setMessage('Too many failed attempts — account locked.');
    const code = digits.join('');
    if (code.length !== OTP_LENGTH) return setMessage('Enter the full 6-digit code');
    if (secondsLeft === 0) return setMessage('OTP expired. Resend to get a new code.');
    if (code === otpRef.current) {
      setMessage(null);
      onVerified?.();
    } else {
      setAttempts((a) => a + 1);
      setMessage('Incorrect OTP. Please try again.');
    }
  };

  const resend = () => {
    if (resendCooldown > 0) return;
    generateOtp();
    setResendCooldown(RESEND_COOLDOWN);
    setSecondsLeft(OTP_EXPIRY_SECONDS);
    setDigits(Array(OTP_LENGTH).fill(''));
    setMessage('A new OTP was sent.');
  };

  const formattedTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="bg-white shadow rounded-md p-6">
      <h4 className="text-lg font-semibold mb-2">Enter the verification code</h4>
      <p className="text-sm text-gray-600 mb-4">We’ve sent a secure OTP to <strong>{contact}</strong>. Enter the 6-digit code to continue.</p>

      <div className="flex gap-2 justify-center mb-3" role="group" aria-label="OTP digits">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={d}
            placeholder="•"
            title={`Digit ${i + 1} of ${OTP_LENGTH}`}
            aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') focusAt(Math.max(0, i - 1));
              if (e.key === 'ArrowRight') focusAt(Math.min(OTP_LENGTH - 1, i + 1));
              if (e.key === 'Backspace' && !digits[i]) focusAt(Math.max(0, i - 1));
              if (e.key === 'Enter') submit();
            }}
            className={`w-12 h-12 text-center text-xl rounded-md border ${d ? 'border-indigo-600' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-300`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-600">Expires in <strong>{formattedTime(secondsLeft)}</strong></div>
        <div>
          <button
            type="button"
            onClick={resend}
            disabled={resendCooldown > 0}
            className="text-sm text-indigo-600 hover:underline disabled:opacity-50"
          >
            {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend OTP'}
          </button>
        </div>
      </div>

      {message && <div className="text-sm text-red-600 mb-3">{message}</div>}

      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60"
        >
          Verify
        </button>
        <button onClick={onCancel} className="text-sm text-gray-600 hover:underline">Back</button>
        <div className="ml-auto text-sm text-gray-500">Attempts: {attempts}/{MAX_ATTEMPTS}</div>
      </div>

      {locked && <div className="mt-3 text-sm text-red-700">Too many failed attempts. Please try again later or contact support.</div>}
    </div>
  );
}
