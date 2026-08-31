import { useState } from 'react';
import { motion } from 'motion/react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

interface Stage1Props {
  onNext: (data: Stage1Data) => void;
  initialData?: Stage1Data;
}

export interface Stage1Data {
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  password: string;
}

export function Stage1BasicDetails({ onNext, initialData }: Stage1Props) {
  const [formData, setFormData] = useState<Stage1Data>(initialData || {
    fullName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Stage1Data>>({});

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 20;
    return Math.min(strength, 100);
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 70) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Good';
    return 'Strong';
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@digitalidentity\.mail$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<Stage1Data> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!validateEmail(formData.email)) newErrors.email = 'Email must end with @digitalidentity.mail';
    if (passwordStrength < 40) newErrors.password = 'Please choose a stronger password';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext(formData);
  };

  const updateField = (field: keyof Stage1Data, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="mb-8">
        <motion.h2 
          className="mb-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Let's begin with the basics
        </motion.h2>
        <motion.p 
          className="text-gray-600 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          This helps us personalize your experience and prepare your secure email identity.
        </motion.p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            className={`mt-2 ${errors.fullName ? 'border-red-500' : ''}`}
            placeholder="Enter your full name"
          />
          {errors.fullName && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <XCircle size={14} />
              {errors.fullName}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => updateField('dateOfBirth', e.target.value)}
            className={`mt-2 ${errors.dateOfBirth ? 'border-red-500' : ''}`}
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.dateOfBirth && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <XCircle size={14} />
              {errors.dateOfBirth}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Label htmlFor="email">Desired Email Address</Label>
          <div className="relative mt-2">
            <Input
              id="email"
              type="text"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              className={`${errors.email ? 'border-red-500' : ''}`}
              placeholder="yourname@digitalidentity.mail"
            />
            {formData.email && validateEmail(formData.email) && (
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={20} />
            )}
          </div>
          {errors.email && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <XCircle size={14} />
              {errors.email}
            </p>
          )}
          <p className="text-gray-500 text-sm mt-1">
            All Digital Identity email addresses end with @digitalidentity.mail
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Label htmlFor="phone">Phone Number (Optional)</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className="mt-2"
            placeholder="+1 (555) 000-0000"
          />
          <p className="text-gray-500 text-sm mt-1">
            Used for account recovery and security alerts
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-2">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              className={`pr-10 ${errors.password ? 'border-red-500' : ''}`}
              placeholder="Create a strong password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          {formData.password && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Password strength:</span>
                <span className={`text-sm ${
                  passwordStrength < 40 ? 'text-red-500' : 
                  passwordStrength < 70 ? 'text-amber-500' : 'text-green-500'
                }`}>
                  {getPasswordStrengthText()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${getPasswordStrengthColor()}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${passwordStrength}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-gray-500">
                Use 12+ characters with a mix of letters, numbers, and symbols
              </p>
            </div>
          )}
          
          {errors.password && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <XCircle size={14} />
              {errors.password}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="pt-4"
        >
          <Button
            type="submit"
            className="w-full bg-teal-700 hover:bg-teal-800 py-6"
            size="lg"
          >
            Continue to Verification
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}
