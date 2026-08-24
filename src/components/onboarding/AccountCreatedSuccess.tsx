import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Mail, Download, Sparkles, Shield, ArrowRight } from 'lucide-react';
import QRCode from 'react-qr-code';

interface SuccessProps {
  email: string;
  fullName: string;
}

export function AccountCreatedSuccess({ email, fullName }: SuccessProps) {
  const emotionalAlias = `${fullName.split(' ')[0]}'s Sanctuary`;
  const identityCode = `NUVANA-${Date.now().toString(36).toUpperCase()}`;

  const downloadQRCode = () => {
    const svg = document.getElementById('qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `nuvana-identity-${identityCode}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  // Read a small, non-sensitive verification summary that may have been written by the
  // document upload stage. This is intentionally a minimal summary (docType, submittedAt, masked number).
  const getVerificationSummary = () => {
    try {
      const raw = sessionStorage.getItem('nuvana_verification_summary');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  };

  const formatDisplayDate = (iso?: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString();
    } catch (e) {
      return iso;
    }
  };

  // Provision mailbox in the branded email service and establish session continuity.
  const [provisioning, setProvisioning] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const log = (msg: string) => {
    const entry = `${new Date().toISOString()} - ${msg}`;
    setLogs((s) => [...s, entry]);
    // keep console in sync for developer convenience
    // eslint-disable-next-line no-console
    console.debug('[provision-log]', entry);
  };

  const provisionMailbox = async () => {
    try {
      setProvisioning(true);
      setProvisionError(null);
      setLogs([]);
      log('Starting provisioning flow');
      // Decide API URL heuristically in dev vs prod
      const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const apiUrl = isLocalhost ? 'http://localhost:4000/api/provision-mailbox' : '/api/provision-mailbox';
      log(`Calling provisioning API: ${apiUrl}`);
      // Call backend provisioning endpoint. Replace with your real API route.
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName }),
        credentials: 'include'
      });

      if (!resp.ok) {
        log(`Provisioning API returned non-OK status: ${resp.status}`);
        console.warn('Provisioning API returned non-OK:', resp.status);
        setProvisionError(`Provisioning failed (${resp.status})`);
        setProvisioning(false);
        // don't immediate return — allow manual retry
        return;
      }

      const data = await resp.json();
      log('Provisioning response received');
      // If backend returns a token for session continuity, set it as a cookie
      if (data?.token) {
        log('Received provisioning token from server');
        // Set cookie for the current origin; expiry 7 days
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `nuvana_token=${data.token}; path=/; expires=${expires}; SameSite=Lax`;
      }

      // Redirect to the branded email dashboard (backend may provide a redirectUrl)
      const target = data?.redirectUrl || '/email/inbox' || '/email/welcome';
      log(`Redirecting to ${target}`);
      // best-effort navigate in same tab
      window.location.assign(target);
    } catch (err) {
      console.error('Provisioning failed:', err);
      log(`Provisioning error: ${String(err)}`);
      setProvisionError(String(err));
      setProvisioning(false);
    }
  };

  // Auto-run provisioning when this success screen mounts so users land directly in email
  useEffect(() => {
    // small delay to allow UI to render animations before redirecting
    const t = window.setTimeout(() => {
      provisionMailbox();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-3xl mx-auto text-center"
    >
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          delay: 0.2,
          type: "spring",
          stiffness: 200,
          damping: 15
        }}
        className="mb-8"
      >
        <div className="relative inline-block">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-teal-200 to-blue-200 rounded-full blur-2xl opacity-60"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 0.8, 0.6],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <div className="relative h-32 w-32 mx-auto rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-2xl">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <Mail className="text-white" size={64} />
            </motion.div>
          </div>
          <motion.div
            className="absolute -top-2 -right-2 bg-green-500 rounded-full p-2 shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 300 }}
          >
            <Sparkles className="text-white" size={24} />
          </motion.div>
        </div>
      </motion.div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <h1 className="mb-4">
          Your email sanctuary is ready
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          You'll never need to repeat this process again.
        </p>
        
        <div className="bg-gradient-to-br from-teal-50 to-blue-50 border-2 border-teal-200 rounded-2xl p-8 mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Mail className="text-teal-700" size={28} />
            <p className="text-2xl text-teal-900">{email}</p>
          </div>
          <div className="inline-block bg-white rounded-full px-4 py-2 shadow-sm">
            <p className="text-teal-700">
              ✨ {emotionalAlias}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Identity QR Code */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl border-2 border-gray-200 p-8 mb-8"
      >
        <h3 className="mb-4">Your Identity Code</h3>
        <p className="text-gray-600 mb-6">
          Save this QR code for quick access across Nuvana services
        </p>
        
        <div className="inline-block bg-white p-6 rounded-xl border-2 border-gray-200 mb-4">
          {/**
           * Build a QR payload with non-sensitive account info and an optional
           * verification summary. Avoid including full document numbers or any
           * sensitive plaintext in the QR payload.
           */}
          {(() => {
            const verification = getVerificationSummary();
            const createdIso = new Date().toISOString();
            // Build a concise, human-readable summary for scanners that display raw QR text
            const summaryText = verification
              ? `${fullName || email} · ${verification.docType || 'Document'} · ${verification.maskedDocNumber || ''} · ${formatDisplayDate(verification.submittedAt)}`
              : `${fullName || email} · Created ${formatDisplayDate(createdIso)}`;

            const payload = {
              service: 'nuvana',
              email,
              fullName,
              identityCode,
              created: createdIso,
              verification: verification || undefined,
              // Provide a short, human-friendly summary so many QR scanner UIs render readable text
              summaryText
            };
            return (
              <QRCode id="qr-code" value={JSON.stringify(payload)} size={200} level="H" />
            );
          })()}
        </div>
        
        {/* show verification summary if present */}
        {(() => {
          const verification = getVerificationSummary();
          if (!verification) return null;
          return (
            <div className="text-left text-sm text-gray-700 mb-4">
              <div className="text-xs text-gray-500 mb-2">Verification submitted</div>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start">
                <div className="sm:col-span-1">
                  <dt className="text-xs text-gray-500">Document</dt>
                  <dd className="text-sm text-gray-900">{verification.docType || 'Identity Document'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-xs text-gray-500">Submitted</dt>
                  <dd className="text-sm text-gray-900">{formatDisplayDate(verification.submittedAt)}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-xs text-gray-500">Document #</dt>
                  <dd className="text-sm text-gray-900">{verification.maskedDocNumber || '—'}</dd>
                </div>
              </dl>
            </div>
          );
        })()}
        
        <p className="text-sm text-gray-500 mb-4">
          Identity Code: <code className="bg-gray-100 px-2 py-1 rounded">{identityCode}</code>
        </p>
        
        <Button
          onClick={downloadQRCode}
          variant="outline"
          className="border-teal-700 text-teal-700 hover:bg-teal-50"
        >
          <Download className="mr-2" size={18} />
          Download QR Code
        </Button>
      </motion.div>

      {/* Cross-Service Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 mb-8"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Shield className="text-blue-700" size={28} />
          <h3>Your identity is now portable</h3>
        </div>
        
        <p className="text-gray-700 mb-6">
          Access all Nuvana services with one verified identity:
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-gray-700">Messaging</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-3xl mb-2">☁️</div>
            <p className="text-gray-700">Storage</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-3xl mb-2">🎨</div>
            <p className="text-gray-700">Creator Tools</p>
          </div>
        </div>
        
        <div className="bg-white/50 backdrop-blur-sm border border-blue-200 rounded-xl p-4">
          <p className="text-blue-900 text-sm">
            <span>✨ No re-verification needed.</span> Your verified identity unlocks everything, 
            and account recovery is always available through our emotionally intelligent flow.
          </p>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <div className="flex flex-col items-center gap-4">
          <Button
            onClick={provisionMailbox}
            className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-12 py-6 shadow-xl"
            size="lg"
            disabled={provisioning}
          >
            {provisioning ? 'Provisioning your mailbox…' : 'Access My Inbox'}
            <ArrowRight className="ml-2" size={20} />
          </Button>

          {provisionError && (
            <div className="text-sm text-rose-600">Unable to provision mailbox: {provisionError}. You can retry.</div>
          )}
        </div>
        
        <p className="text-gray-500 text-sm mt-4">
          Welcome to your digital sanctuary, {fullName.split(' ')[0]} 🌸
        </p>
      </motion.div>

      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-teal-300 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: window.innerHeight + 50,
              opacity: 0
            }}
            animate={{
              y: -50,
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: i * 0.3,
              repeat: Infinity,
              repeatDelay: 2
            }}
          />
        ))}
      </div>
    </motion.div>
      {/* Provisioning status modal */}
      {(provisioning || provisionError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-lg shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Provisioning your mailbox</h3>
            <p className="text-sm text-gray-600 mb-4">This will create your mailbox and redirect you to the Nuvana Mail app.</p>
            <div className="mb-4">
              <div className="max-h-40 overflow-auto bg-slate-50 p-3 rounded text-sm border border-gray-100">
                {logs.length === 0 ? (
                  <div className="text-gray-400">Waiting for steps...</div>
                ) : (
                  logs.map((l, i) => (
                    <div key={i} className="border-b border-gray-100 py-1">{l}</div>
                  ))
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              {!provisioning && (
                <>
                  <Button onClick={provisionMailbox}>Retry</Button>
                  <Button variant="outline" onClick={() => setProvisionError(null)}>Close</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
