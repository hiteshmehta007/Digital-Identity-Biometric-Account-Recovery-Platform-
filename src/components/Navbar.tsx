import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  onCreateAccount?: () => void;
  onSignIn?: () => void;
}

export function Navbar({ onCreateAccount, onSignIn }: NavbarProps = {}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 border-gray-200 shadow-lg' 
          : 'bg-white/80 border-gray-200'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <motion.div 
              className="flex items-center gap-3 flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white shadow-md">
                DI
              </div>
              <span className="text-base font-semibold text-gray-900">Digital Identity</span>
            </motion.div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center gap-8">
              <motion.a 
                href="#about" 
                className="text-gray-700 hover:text-teal-700 transition-colors relative group"
                whileHover={{ y: -2 }}
              >
                About
                <motion.span 
                  className="absolute bottom-0 left-0 w-0 h-0.5 bg-teal-700 group-hover:w-full transition-all duration-300"
                />
              </motion.a>
              <motion.a 
                href="#features" 
                className="text-gray-700 hover:text-teal-700 transition-colors relative group"
                whileHover={{ y: -2 }}
              >
                Features
                <motion.span 
                  className="absolute bottom-0 left-0 w-0 h-0.5 bg-teal-700 group-hover:w-full transition-all duration-300"
                />
              </motion.a>
              <motion.a 
                href="#philosophy" 
                className="text-gray-700 hover:text-teal-700 transition-colors relative group"
                whileHover={{ y: -2 }}
              >
                Philosophy
                <motion.span 
                  className="absolute bottom-0 left-0 w-0 h-0.5 bg-teal-700 group-hover:w-full transition-all duration-300"
                />
              </motion.a>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline"
                  onClick={onSignIn}
                >
                  Sign In
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  className="bg-teal-700 hover:bg-teal-800 shadow-lg"
                  onClick={onCreateAccount}
                >
                  Create Account
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-teal-700 p-2"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              className="md:hidden py-4 border-t border-gray-200 overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="flex flex-col gap-4"
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <motion.a 
                  href="#about" 
                  className="text-gray-700 hover:text-teal-700 transition-colors px-2 py-2"
                  onClick={() => setIsMenuOpen(false)}
                  whileTap={{ scale: 0.98 }}
                >
                  About
                </motion.a>
                <motion.a 
                  href="#features" 
                  className="text-gray-700 hover:text-teal-700 transition-colors px-2 py-2"
                  onClick={() => setIsMenuOpen(false)}
                  whileTap={{ scale: 0.98 }}
                >
                  Features
                </motion.a>
                <motion.a 
                  href="#philosophy" 
                  className="text-gray-700 hover:text-teal-700 transition-colors px-2 py-2"
                  onClick={() => setIsMenuOpen(false)}
                  whileTap={{ scale: 0.98 }}
                >
                  Philosophy
                </motion.a>
                <div className="flex flex-col gap-2 mt-2">
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onSignIn?.();
                    }}
                  >
                    Sign In
                  </Button>
                  <Button 
                    className="bg-teal-700 hover:bg-teal-800 w-full"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onCreateAccount?.();
                    }}
                  >
                    Create Account
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
