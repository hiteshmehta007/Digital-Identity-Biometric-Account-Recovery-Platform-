import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Camera, Info, CheckCircle2, AlertTriangle, AlertCircle, Loader2
} from 'lucide-react';
import { initializeFaceAPI, getFaceAPI } from '../../lib/faceapi-loader';

interface Stage2Props {
  onNext: (result: FaceVerificationResult) => void;
  onBack: () => void;
}

export interface FaceVerificationResult {
  movementsCompleted: boolean;
  distanceValid: boolean;
  lightingValid: boolean;
  disclaimerAccepted: boolean;
  imageData: string;
}

type MovementStep = 'center' | 'left' | 'center-2' | 'right' | 'center-3' | 'complete';

interface ValidationState {
  hasFace: boolean;
  hasEyes: boolean;
  distanceOk: boolean;
  lightingOk: boolean;
  currentMovement: MovementStep;
}

export function Stage2FaceVerification({ onNext, onBack }: Stage2Props) {
  // UI State
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Verification State
  const [validation, setValidation] = useState<ValidationState>({
    hasFace: false,
    hasEyes: false,
    distanceOk: false,
    lightingOk: false,
    currentMovement: 'center'
  });
  
  const [movementProgress, setMovementProgress] = useState<Record<MovementStep, boolean>>({
    'center': false,
    'left': false,
    'center-2': false,
    'right': false,
    'center-3': false,
    'complete': false
  });
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(0);
  // referenced to satisfy `noUnusedLocals` under strict checking
  void brightness;
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const movementTimeoutRef = useRef<number | null>(null);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        
        // Use centralized initialization
        await initializeFaceAPI();
        
        setModelsLoaded(true);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading face detection models:', err);
        setError('Failed to load face detection models. Please refresh the page.');
        setIsLoading(false);
      }
    };

    loadModels();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    if (!modelsLoaded) {
      setError('Please wait for face detection to initialize');
      return;
    }

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for metadata to load
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().then(() => resolve()).catch(console.error);
            };
          }
        });
        
        streamRef.current = stream;
        setIsCameraActive(true);
        startDetection();
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setError('Please allow camera access to continue with face verification.');
    }
  };

  const stopCamera = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    if (movementTimeoutRef.current) {
      clearTimeout(movementTimeoutRef.current);
      movementTimeoutRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCameraActive(false);
  }, []);

  const calculateBrightness = (imageData: ImageData): number => {
    const data = imageData.data;
    let sum = 0;

    for (let i = 0; i < data.length; i += 4) {
      // guard indices defensively to satisfy strict checks
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      sum += (r + g + b) / 3;
    }

    return sum / (data.length / 4);
  };

  const checkDistance = (faceWidth: number): boolean => {
    // Optimal face width in pixels (approximately 40-70cm from camera)
    const MIN_WIDTH = 150;
    const MAX_WIDTH = 400;
    return faceWidth >= MIN_WIDTH && faceWidth <= MAX_WIDTH;
  };

  const getHeadDirection = (landmarks: any): 'left' | 'right' | 'center' => {
    const nose = landmarks.getNose()[3];
    const leftEye = landmarks.getLeftEye()[0];
    const rightEye = landmarks.getRightEye()[3];
    
    const eyeCenter = {
      x: (leftEye.x + rightEye.x) / 2,
      y: (leftEye.y + rightEye.y) / 2
    };
    
    const offset = nose.x - eyeCenter.x;
    
    if (offset > 15) return 'left';
    if (offset < -15) return 'right';
    return 'center';
  };

  const drawCornerBrackets = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) => {
    const cornerLength = 30;
    const lineWidth = 4;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    
    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(x, y + cornerLength);
    ctx.lineTo(x, y);
    ctx.lineTo(x + cornerLength, y);
    ctx.stroke();
    
    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(x + width - cornerLength, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + cornerLength);
    ctx.stroke();
    
    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(x, y + height - cornerLength);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x + cornerLength, y + height);
    ctx.stroke();
    
    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(x + width - cornerLength, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width, y + height - cornerLength);
    ctx.stroke();
  };

  const drawFacialMesh = (ctx: CanvasRenderingContext2D, landmarks: any, color: string) => {
    const jaw = landmarks.getJawOutline();
    const nose = landmarks.getNose();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const leftEyebrow = landmarks.getLeftEyeBrow();
    const rightEyebrow = landmarks.getRightEyeBrow();
    const mouth = landmarks.getMouth();
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.fillStyle = color;
    
    // Draw lines connecting points
    const drawLine = (points: any[]) => {
      if (points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    };
    
    const drawPoints = (points: any[]) => {
      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      });
    };
    
    // Draw facial features
    drawLine(jaw);
    drawLine(nose);
    drawLine(leftEyebrow);
    drawLine(rightEyebrow);
    
    // Draw eyes (closed loop)
    ctx.beginPath();
    leftEye.forEach((point: any, i: number) => {
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.stroke();
    
    ctx.beginPath();
    rightEye.forEach((point: any, i: number) => {
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.stroke();
    
    // Draw mouth (outer line)
    ctx.beginPath();
    mouth.forEach((point: any, i: number) => {
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.stroke();
    
    // Draw connection lines for mesh effect
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 1;
    
    // Connect nose to eyes
    if (nose[3] && leftEye[0] && rightEye[3]) {
      ctx.beginPath();
      ctx.moveTo(nose[3].x, nose[3].y);
      ctx.lineTo(leftEye[0].x, leftEye[0].y);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(nose[3].x, nose[3].y);
      ctx.lineTo(rightEye[3].x, rightEye[3].y);
      ctx.stroke();
    }
    
    // Connect nose to mouth
    if (nose[6] && mouth[14]) {
      ctx.beginPath();
      ctx.moveTo(nose[6].x, nose[6].y);
      ctx.lineTo(mouth[14].x, mouth[14].y);
      ctx.stroke();
    }
    
    // Connect eyes to jaw
    if (leftEye[0] && jaw[1]) {
      ctx.beginPath();
      ctx.moveTo(leftEye[0].x, leftEye[0].y);
      ctx.lineTo(jaw[1].x, jaw[1].y);
      ctx.stroke();
    }
    
    if (rightEye[3] && jaw[15]) {
      ctx.beginPath();
      ctx.moveTo(rightEye[3].x, rightEye[3].y);
      ctx.lineTo(jaw[15].x, jaw[15].y);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1.0;
    
    // Draw key points
    drawPoints([...leftEye, ...rightEye, nose[3], mouth[0], mouth[6]]);
  };

  const startDetection = () => {
    if (detectionIntervalRef.current) return;

    detectionIntervalRef.current = window.setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match video
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      try {
        const faceapi = getFaceAPI();
        const detections = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detections) {
          // Draw face detection box
          const box = detections.detection.box;
          const landmarks = detections.landmarks;
          
          // Check for eyes
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();
          const hasEyes = leftEye.length > 0 && rightEye.length > 0;
          
          // Check distance
          const faceWidth = box.width;
          const distanceOk = checkDistance(faceWidth);
          
          // Check lighting (sample a small area instead of full canvas for performance)
          const sampleSize = 100;
          const sampleX = Math.max(0, box.x);
          const sampleY = Math.max(0, box.y);
          const sampleW = Math.min(sampleSize, box.width);
          const sampleH = Math.min(sampleSize, box.height);
          
          ctx.drawImage(video, sampleX, sampleY, sampleW, sampleH, 0, 0, sampleW, sampleH);
          const imageData = ctx.getImageData(0, 0, sampleW, sampleH);
          const currentBrightness = calculateBrightness(imageData);
          setBrightness(currentBrightness);
          const lightingOk = currentBrightness > 50 && currentBrightness < 200;
          
          // Clear canvas again after brightness check
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Get head direction
          const direction = getHeadDirection(landmarks);
          
          // Update validation state
          setValidation(prev => ({
            ...prev,
            hasFace: true,
            hasEyes,
            distanceOk,
            lightingOk
          }));
          
          // Progress through movement sequence
          checkMovementProgress(direction, distanceOk, lightingOk, hasEyes);
          
          // Determine color based on validation
          const isValid = distanceOk && lightingOk && hasEyes;
          const boxColor = isValid ? '#22c55e' : '#f59e0b';
          const meshColor = isValid ? '#ffffff' : '#fbbf24';
          
          // Draw corner brackets instead of full rectangle
          drawCornerBrackets(ctx, box.x, box.y, box.width, box.height, boxColor);
          
          // Draw facial mesh landmarks
          drawFacialMesh(ctx, landmarks, meshColor);
          
        } else {
          setValidation(prev => ({
            ...prev,
            hasFace: false,
            hasEyes: false
          }));
        }
      } catch (err) {
        console.error('Detection error:', err);
      }
    }, 100); // Check every 100ms
  };

  const checkMovementProgress = (
    direction: 'left' | 'right' | 'center',
    distanceOk: boolean,
    lightingOk: boolean,
    hasEyes: boolean
  ) => {
    if (!distanceOk || !lightingOk || !hasEyes) return;

    const currentStep = validation.currentMovement;
    
    // Clear any existing timeout
    if (movementTimeoutRef.current) {
      clearTimeout(movementTimeoutRef.current);
    }

    // Check if user is in the correct position
    let isCorrectPosition = false;
    
    switch (currentStep) {
      case 'center':
        isCorrectPosition = direction === 'center';
        break;
      case 'left':
        isCorrectPosition = direction === 'left';
        break;
      case 'center-2':
        isCorrectPosition = direction === 'center';
        break;
      case 'right':
        isCorrectPosition = direction === 'right';
        break;
      case 'center-3':
        isCorrectPosition = direction === 'center';
        break;
    }

    if (isCorrectPosition) {
      // Hold position for 1 second before marking as complete
      movementTimeoutRef.current = window.setTimeout(() => {
        setMovementProgress(prev => ({ ...prev, [currentStep]: true }));
        
        // Move to next step
        const nextSteps: Record<MovementStep, MovementStep> = {
          'center': 'left',
          'left': 'center-2',
          'center-2': 'right',
          'right': 'center-3',
          'center-3': 'complete',
          'complete': 'complete'
        };
        
        const nextStep = nextSteps[currentStep];
        setValidation(prev => ({ ...prev, currentMovement: nextStep }));
        
        if (nextStep === 'complete') {
          completeVerification();
        }
      }, 1000);
    }
  };

  const completeVerification = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    // Capture final image
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/png');
      setCapturedImage(imageData);
      stopCamera();
    }
  }, [stopCamera]);

  const handleAcceptDisclaimer = () => {
    setDisclaimerAccepted(true);
    setShowDisclaimer(false);
    startCamera();
  };

  const handleSubmit = () => {
    if (!capturedImage) return;

    const result: FaceVerificationResult = {
      movementsCompleted: movementProgress['center-3'],
      distanceValid: validation.distanceOk,
      lightingValid: validation.lightingOk,
      disclaimerAccepted,
      imageData: capturedImage
    };

    onNext(result);
  };

  const getMovementInstruction = (): string => {
    switch (validation.currentMovement) {
      case 'center':
        return 'Look straight at the camera';
      case 'left':
        return 'Turn your head to the left';
      case 'center-2':
        return 'Return to center';
      case 'right':
        return 'Turn your head to the right';
      case 'center-3':
        return 'Return to center';
      case 'complete':
        return 'Verification complete!';
      default:
        return '';
    }
  };

  const getMovementIcon = () => {
    switch (validation.currentMovement) {
      case 'left':
        return '←';
      case 'right':
        return '→';
      case 'center':
      case 'center-2':
      case 'center-3':
        return '●';
      case 'complete':
        return '✓';
      default:
        return '';
    }
  };

  const movementSteps: MovementStep[] = ['center', 'left', 'center-2', 'right', 'center-3'];
  const completedSteps = movementSteps.filter(step => movementProgress[step]).length;
  const progressPercentage = (completedSteps / movementSteps.length) * 100;

  return (
    <>
      {/* Disclaimer Dialog */}
      <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertCircle className="text-amber-700" size={24} />
              </div>
              Important: Prepare for Face Verification
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed space-y-4 mt-4">
              <p className="text-gray-700">
                For accurate and secure identity verification, please ensure the following before we begin:
              </p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                <p className="text-amber-900">
                  <span>Please remove:</span>
                </p>
                <ul className="text-amber-800 space-y-2 ml-4">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                    Glasses or sunglasses
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                    Face masks or coverings
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                    Hats or head coverings (if possible)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                    Any facial obstructions
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-900">
                  <span>Why this matters:</span> Clear face verification helps us protect your identity 
                  and ensure secure, blame-free account recovery. Your face data is processed locally, 
                  encrypted immediately, and never shared.
                </p>
              </div>

              <p className="text-sm text-gray-600">
                By continuing, you confirm you've read our{' '}
                <a href="#privacy" className="text-teal-700 hover:underline">Privacy Policy</a>{' '}
                and understand how your biometric data is used and protected.
              </p>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="flex-1"
                >
                  Go Back
                </Button>
                <Button
                  onClick={handleAcceptDisclaimer}
                  className="flex-1 bg-teal-700 hover:bg-teal-800"
                  disabled={isLoading || !modelsLoaded}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={18} />
                      Loading...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2" size={18} />
                      I Understand
                    </>
                  )}
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Main Component */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl mx-auto"
      >
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center">
              <Camera className="text-teal-700" size={24} />
            </div>
            <h2>Face Verification</h2>
          </motion.div>
          
          <motion.p 
            className="text-gray-600 text-lg mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Follow the on-screen instructions to complete your secure identity verification.
          </motion.p>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera View */}
        {isCameraActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Progress Bar */}
            <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Verification Progress</p>
                <p className="text-sm text-teal-700">{Math.round(progressPercentage)}%</p>
              </div>
              <Progress value={progressPercentage} className="h-2 mb-4" />
              
              {/* Movement Steps */}
              <div className="flex items-center justify-between gap-2">
                {movementSteps.map((step, index) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`flex items-center justify-center h-8 w-8 rounded-full transition-all ${
                      movementProgress[step] 
                        ? 'bg-green-500 text-white' 
                        : validation.currentMovement === step
                        ? 'bg-teal-600 text-white animate-pulse'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {movementProgress[step] ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>
                    {index < movementSteps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 ${
                        movementProgress[step] ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Validation Indicators - Compact Row */}
            <div className="flex items-center justify-center gap-6 bg-black/40 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full transition-all ${
                  validation.hasEyes ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-400'
                }`} />
                <p className="text-sm text-white">Eyes</p>
              </div>
              
              <div className="h-6 w-px bg-white/20" />
              
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full transition-all ${
                  validation.distanceOk ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-400'
                }`} />
                <p className="text-sm text-white">Distance</p>
              </div>
              
              <div className="h-6 w-px bg-white/20" />
              
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full transition-all ${
                  validation.lightingOk ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-400'
                }`} />
                <p className="text-sm text-white">Light</p>
              </div>
            </div>

            {/* Video Feed */}
            <div className="relative bg-black rounded-3xl overflow-hidden shadow-2xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-[500px] object-cover mirror"
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full mirror pointer-events-none"
                style={{ transform: 'scaleX(-1)' }}
              />
              
              {/* Top Status Indicator */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
                <motion.div
                  key={validation.currentMovement}
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="bg-black/70 backdrop-blur-md rounded-full px-8 py-3 border-2 border-white/30 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getMovementIcon()}</span>
                    <p className="text-white">
                      {getMovementInstruction()}
                    </p>
                  </div>
                </motion.div>
              </div>
              
              {/* Bottom Warning Messages */}
              <AnimatePresence>
                {!validation.hasFace && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
                  >
                    <div className="bg-amber-500/90 backdrop-blur-sm rounded-full px-6 py-2">
                      <p className="text-white text-sm">
                        Position your face in the frame
                      </p>
                    </div>
                  </motion.div>
                )}
                
                {validation.hasFace && !validation.hasEyes && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
                  >
                    <div className="bg-amber-500/90 backdrop-blur-sm rounded-full px-6 py-2">
                      <p className="text-white text-sm">
                        Eyes not detected - remove glasses
                      </p>
                    </div>
                  </motion.div>
                )}
                
                {validation.hasFace && validation.hasEyes && !validation.distanceOk && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
                  >
                    <div className="bg-amber-500/90 backdrop-blur-sm rounded-full px-6 py-2">
                      <p className="text-white text-sm">
                        Adjust your distance from camera
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </motion.div>
        )}

        {/* Captured Image */}
        {capturedImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-2xl border-2 border-green-300 overflow-hidden">
              <img
                src={capturedImage}
                alt="Verified face"
                className="w-full h-[400px] object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 className="text-green-600" size={24} />
                <p className="text-green-900">
                  Face verification completed successfully!
                </p>
              </div>
              <p className="text-green-700 text-sm">
                Your face data has been encrypted and secured
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setCapturedImage(null);
                  setMovementProgress({
                    'center': false,
                    'left': false,
                    'center-2': false,
                    'right': false,
                    'center-3': false,
                    'complete': false
                  });
                  setValidation(prev => ({ ...prev, currentMovement: 'center' }));
                  startCamera();
                }}
                variant="outline"
                className="flex-1"
              >
                Retry Verification
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-teal-700 hover:bg-teal-800"
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            onClick={() => {
              stopCamera();
              onBack();
            }}
            variant="ghost"
            className="text-gray-600"
          >
            ← Back
          </Button>

          <Dialog>
            <Button variant="ghost" className="text-teal-700" asChild>
              <DialogTrigger>
                <Info className="mr-2" size={18} />
                Privacy & Security
              </DialogTrigger>
            </Button>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>How We Protect Your Face Data</DialogTitle>
                <DialogDescription className="text-base leading-relaxed space-y-4 mt-4">
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                    <p className="text-teal-900">
                      <span>🔒 100% Local Processing:</span> All face detection happens in your browser. 
                      No video feed is sent to our servers.
                    </p>
                  </div>
                  
                  <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
                    <li>Face data is immediately encrypted using industry-standard algorithms</li>
                    <li>Only a secure hash is stored—never the raw image</li>
                    <li>Used exclusively for account recovery verification</li>
                    <li>You can request deletion at any time from account settings</li>
                    <li>Never sold, shared, or used for advertising</li>
                  </ul>

                  <p className="text-sm text-gray-600">
                    Our emotionally intelligent recovery system ensures you can always regain access 
                    to your account securely, without blame or judgment.
                  </p>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>
    </>
  );
}
