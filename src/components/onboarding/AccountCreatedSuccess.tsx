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

  return (
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
          <QRCode
            id="qr-code"
            value={JSON.stringify({
              service: 'nuvana',
              email,
              identityCode,
              created: new Date().toISOString()
            })}
            size={200}
            level="H"
          />
        </div>
        
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
        <Button
          className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-12 py-6 shadow-xl"
          size="lg"
        >
          Access My Inbox
          <ArrowRight className="ml-2" size={20} />
        </Button>
        
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
  );
}
