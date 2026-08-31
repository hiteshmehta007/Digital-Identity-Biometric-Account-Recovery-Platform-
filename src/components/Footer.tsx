import { Globe } from 'lucide-react';
import { motion } from 'motion/react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 relative overflow-hidden">
      {/* Subtle animated background */}
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 bg-teal-900/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo and tagline */}
          <motion.div 
            className="col-span-1 md:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white shadow-lg">
                DI
              </div>
              <span className="text-lg font-semibold text-white">Digital Identity</span>
            </div>
            <p className="text-gray-400 max-w-md">
              A secure digital sanctuary for identity recovery, privacy, and peace of mind.
            </p>
          </motion.div>

          {/* Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h3 className="mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <motion.a 
                  href="#privacy" 
                  className="text-gray-400 hover:text-teal-400 transition-colors inline-block"
                  whileHover={{ x: 4 }}
                >
                  Privacy Policy
                </motion.a>
              </li>
              <li>
                <motion.a 
                  href="#terms" 
                  className="text-gray-400 hover:text-teal-400 transition-colors inline-block"
                  whileHover={{ x: 4 }}
                >
                  Terms of Service
                </motion.a>
              </li>
              <li>
                <motion.a 
                  href="#contact" 
                  className="text-gray-400 hover:text-teal-400 transition-colors inline-block"
                  whileHover={{ x: 4 }}
                >
                  Contact
                </motion.a>
              </li>
            </ul>
          </motion.div>

          {/* Language Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="mb-4">Language</h3>
            <motion.button 
              className="flex items-center gap-2 text-gray-400 hover:text-teal-400 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Globe size={20} />
              <span>English</span>
            </motion.button>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Digital Identity Biometric Account Recovery Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
