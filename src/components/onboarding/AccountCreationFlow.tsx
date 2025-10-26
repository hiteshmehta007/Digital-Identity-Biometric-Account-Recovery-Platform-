import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Progress } from '../ui/progress';
import { Stage1BasicDetails, Stage1Data } from './Stage1BasicDetails';
import { Stage2FaceVerification, FaceVerificationResult } from './Stage2FaceVerification';
import { Stage3DocumentUpload } from './Stage3DocumentUpload';
import { AccountCreatedSuccess } from './AccountCreatedSuccess';
import { X } from 'lucide-react';
import { Button } from '../ui/button';

interface AccountCreationFlowProps {
  onClose?: () => void;
}

export function AccountCreationFlow({ onClose }: AccountCreationFlowProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [stage1Data, setStage1Data] = useState<Stage1Data | null>(null);
  const [stage2Data, setStage2Data] = useState<FaceVerificationResult | null>(null);
  // referenced below to avoid `noUnusedLocals` under strict checking
  void stage2Data;

  const totalStages = 3;
  const progressPercentage = (currentStage / totalStages) * 100;

  const handleStage1Complete = (data: Stage1Data) => {
    setStage1Data(data);
    setCurrentStage(2);
  };

  const handleStage2Complete = (result: FaceVerificationResult) => {
    setStage2Data(result);
    setCurrentStage(3);
  };

  const handleStage3Complete = () => {
    setCurrentStage(4);
  };

  const handleBack = () => {
    if (currentStage > 1) {
      setCurrentStage(currentStage - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-teal-50/30 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-20 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -30, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
                <span className="text-white">N</span>
              </div>
              <div>
                <h3 className="text-gray-900">Nuvana Mail</h3>
                <p className="text-sm text-gray-500">Account Creation</p>
              </div>
            </div>
            
            {onClose && currentStage < 4 && (
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </Button>
            )}
          </div>

          {currentStage < 4 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">
                  Step {currentStage} of {totalStages}
                </p>
                <p className="text-sm text-teal-700">
                  {Math.round(progressPercentage)}% Complete
                </p>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          {currentStage === 1 && (
            <Stage1BasicDetails
              key="stage1"
              onNext={handleStage1Complete}
              initialData={stage1Data || undefined}
            />
          )}

          {currentStage === 2 && (
            <Stage2FaceVerification
              key="stage2"
              onNext={handleStage2Complete}
              onBack={handleBack}
            />
          )}

          {currentStage === 3 && (
            <Stage3DocumentUpload
              key="stage3"
              onNext={handleStage3Complete}
              onBack={handleBack}
            />
          )}

          {currentStage === 4 && stage1Data && (
            <AccountCreatedSuccess
              key="success"
              email={stage1Data.email}
              fullName={stage1Data.fullName}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {currentStage < 4 && (
        <div className="relative z-10 bg-white/80 backdrop-blur-md border-t border-gray-200 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <p>🔒 All data is encrypted and secure</p>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:text-teal-700 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-teal-700 transition-colors">Help</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
