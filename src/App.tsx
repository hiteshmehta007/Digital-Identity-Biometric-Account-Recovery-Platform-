import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { FeatureCard } from './components/FeatureCard';
import { TestimonialCard } from './components/TestimonialCard';
import { Button } from './components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Shield, Heart, Sparkles, Lock, ArrowRight, Info } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';
import { AccountCreationFlow } from './components/onboarding/AccountCreationFlow';
import AuthDemo from './demo/AuthDemo';
import { FaceVerificationTest } from './components/FaceVerificationTest';

export default function App() {
  const [showAccountCreation, setShowAccountCreation] = useState(false);
  const [showFaceTest, setShowFaceTest] = useState(false);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    // Smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  // Check for test mode in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test') === 'face') {
      setShowFaceTest(true);
    }
  }, []);

  // Dev/demo route: open the auth demo when path is /auth-demo
  if (typeof window !== 'undefined' && window.location.pathname === '/auth-demo') {
    return <AuthDemo />;
  }

  if (showFaceTest) {
    return <FaceVerificationTest />;
  }

  if (showAccountCreation) {
    return <AccountCreationFlow onClose={() => setShowAccountCreation(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onCreateAccount={() => setShowAccountCreation(true)} />

      {/* Hero Section */}
      <section className="relative pt-16 overflow-hidden">
        {/* Animated Background with gradient overlay */}
        <motion.div 
          className="absolute inset-0 z-0"
          style={{ y: heroY }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-teal-900/90 via-blue-900/85 to-teal-800/90 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1635900689534-94f81c933e9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZWFjZWZ1bCUyMHNhbmN0dWFyeSUyMG5hdHVyZXxlbnwxfHx8fDE3NjE0MDQ0NzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
            alt="Peaceful sanctuary"
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Floating elements */}
        <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl"
            animate={{
              y: [0, 30, 0],
              x: [0, 20, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"
            animate={{
              y: [0, -40, 0],
              x: [0, -30, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        {/* Hero Content */}
        <motion.div 
          className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40"
          style={{ opacity: heroOpacity }}
        >
          <div className="text-center">
            <motion.h1 
              className="text-white mb-6 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              A sanctuary for your digital life.
            </motion.h1>
            <motion.p 
              className="text-xl sm:text-2xl text-teal-100 mb-10 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Private. Peaceful. Emotionally intelligent. Built for trust, not tracking.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  className="bg-white text-teal-900 hover:bg-teal-50 px-8 py-6 group shadow-xl"
                  onClick={() => setShowAccountCreation(true)}
                >
                  Create Your Account
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 backdrop-blur-sm"
                >
                  Explore Our Philosophy
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Decorative animated wave */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <motion.svg 
            viewBox="0 0 1440 120" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-full"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F9FAFB"/>
          </motion.svg>
        </div>
      </section>

      {/* About Nuvana Section */}
      <section id="about" className="py-20 bg-gray-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-teal-50/50 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <motion.h2 
                className="mb-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Why Nuvana Exists
              </motion.h2>
              <motion.p 
                className="text-gray-600 text-lg leading-relaxed mb-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Nuvana is built for people who want control, clarity, and compassion in their digital lives. We protect your identity, support your recovery, and never exploit your data.
              </motion.p>
              <motion.p 
                className="text-gray-600 text-lg leading-relaxed"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                In a world where platforms profit from your attention and anxiety, we've created a different path. One that respects your humanity, honors your privacy, and supports your well-being.
              </motion.p>
            </motion.div>
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-teal-200/30 to-blue-200/30 rounded-3xl transform rotate-3"
                whileHover={{ rotate: 6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              <motion.img 
                src="https://images.unsplash.com/photo-1677405879342-86cafb012575?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGNhbG0lMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzYxNDA0NDcxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
                alt="Abstract sanctuary"
                className="relative rounded-3xl shadow-2xl w-full h-[400px] object-cover"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-20 bg-white relative overflow-hidden">
        {/* Animated background gradient */}
        <motion.div 
          className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-gradient-to-br from-teal-100/40 via-blue-100/40 to-rose-100/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-4">
              What You'll Find Inside
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Everything you need to reclaim your digital sovereignty, wrapped in compassion.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Shield size={32} />}
              title="Zero-knowledge identity creation"
              description="No forced biometrics. No centralized vaults. Your identity belongs to you, encrypted and protected."
              index={0}
            />
            <FeatureCard
              icon={<Heart size={32} />}
              title="Emotionally intelligent recovery"
              description="Blame-free, family-assisted, offline-compatible. We understand that life happens, and we're here to help."
              index={1}
            />
            <FeatureCard
              icon={<Sparkles size={32} />}
              title="Creator tools with dignity"
              description="Reels, live streaming, and chat—without exploitation. Create freely, knowing your work is respected."
              index={2}
            />
          </div>
        </div>
      </section>

      {/* Verification Philosophy Section */}
      <section id="philosophy" className="py-20 bg-gray-50 relative overflow-hidden">
        {/* Floating animated orbs */}
        <motion.div
          className="absolute top-10 left-10 w-40 h-40 bg-teal-200/30 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-56 h-56 bg-blue-200/30 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="bg-white rounded-3xl shadow-xl p-8 sm:p-12 relative overflow-hidden"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            whileHover={{ shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
          >
            {/* Decorative elements */}
            <motion.div 
              className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-100/50 to-blue-100/50 rounded-full blur-3xl -z-0"
              animate={{
                scale: [1, 1.2, 1],
                x: [0, 20, 0],
                y: [0, 20, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div 
              className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-rose-100/50 to-amber-100/50 rounded-full blur-3xl -z-0"
              animate={{
                scale: [1, 1.3, 1],
                x: [0, -20, 0],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            <div className="relative z-10">
              <motion.div 
                className="flex items-center gap-4 mb-6"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <motion.div 
                  className="h-16 w-16 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  <Lock className="text-teal-700" size={32} />
                </motion.div>
                <h2>
                  Why We Ask for Verification
                </h2>
              </motion.div>
              
              <motion.div 
                className="space-y-4 text-gray-600 text-lg leading-relaxed"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <p>
                  We ask for a one-time face and document verification—not to track you, but to protect what's yours.
                </p>
                <p>
                  Your data is encrypted, never sold, and always under your control. We verify your humanity once, so we can ensure your sanctuary remains secure and your recovery options remain available.
                </p>
                <p>
                  This isn't surveillance. It's protection. And it's entirely on your terms.
                </p>
              </motion.div>

              <Dialog>
                <DialogTrigger asChild>
                  <motion.div 
                    className="mt-8"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button variant="outline" className="border-teal-700 text-teal-700 hover:bg-teal-50">
                      <Info className="mr-2" size={18} />
                      Learn More About Our Privacy Commitment
                    </Button>
                  </motion.div>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Our Privacy Commitment</DialogTitle>
                    <DialogDescription className="text-base leading-relaxed space-y-4 mt-4">
                      <p>
                        At Nuvana, we believe privacy is a fundamental human right. Here's how we protect yours:
                      </p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Zero-knowledge encryption: We can't access your data even if we wanted to</li>
                        <li>No data selling: Your information will never be sold to advertisers or third parties</li>
                        <li>Minimal collection: We only collect what's necessary for security and recovery</li>
                        <li>User control: You can export or delete your data at any time</li>
                        <li>Transparent practices: Our privacy policy is written in plain language</li>
                      </ul>
                      <p>
                        We verify your identity once to prevent fraud and enable secure recovery. After that, your biometric data is hashed and encrypted—we never store the raw image.
                      </p>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>
        </div>
      </section>

      {/* User Testimonials Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <motion.div
            className="absolute top-0 left-0 w-full h-full"
            style={{
              backgroundImage: 'radial-gradient(circle, #0f766e 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}
            animate={{
              backgroundPosition: ['0px 0px', '50px 50px'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-4">
              What People Say
            </h2>
            <p className="text-gray-600 text-lg">
              Stories from our community
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard
              quote="I recovered my account without panic. Nuvana made me feel safe."
              author="Sarah M."
              index={0}
            />
            <TestimonialCard
              quote="Finally, a platform that respects my privacy and my emotions."
              author="James K."
              index={1}
            />
            <TestimonialCard
              quote="The verification process felt secure but never invasive. I'm in control."
              author="Maria L."
              index={2}
            />
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-br from-teal-700 via-blue-800 to-teal-900 relative overflow-hidden">
        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-teal-600/20 to-purple-600/20"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Decorative background */}
        <div className="absolute inset-0 opacity-10">
          <img 
            src="https://images.unsplash.com/photo-1758180497920-7ab05a50a951?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxodW1hbiUyMGNvbm5lY3Rpb24lMjB0cnVzdHxlbnwxfHx8fDE3NjE0MDQ0NzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
            alt="Connection"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Floating particles */}
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-xl"
          animate={{
            y: [0, 30, 0],
            x: [0, -20, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <motion.div 
          className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2 
            className="text-white mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Ready to Begin?
          </motion.h2>
          <motion.p 
            className="text-teal-100 text-xl mb-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Your digital sanctuary is waiting.
          </motion.p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button 
              size="lg" 
              className="bg-white text-teal-900 hover:bg-teal-50 px-10 py-6 group shadow-2xl"
              onClick={() => setShowAccountCreation(true)}
            >
              Create Your Account
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
            </Button>
          </motion.div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
