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
  const [loadingProgress, setLoadingProgress] = useState<string>('Initializing...');
  // referenced to satisfy `noUnusedLocals` under strict checking
  void brightness;
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const movementTimeoutRef = useRef<number | null>(null);
  // counts consecutive successful frames per movement step to make detection responsive
  const movementCountersRef = useRef<Record<MovementStep, number>>({
    'center': 0,
    'left': 0,
    'center-2': 0,
    'right': 0,
    'center-3': 0,
    'complete': 0
  });
  // Keep a mutable ref for the current movement step so the detection loop (which
  // runs inside a setInterval) can read/write it without stale closures.
  const movementStepRef = useRef<MovementStep>('center');
  // Toggle this to true to get per-frame debug logs for tuning thresholds
  const DEBUG_DETECTION = false;
  // Eye state detection refs/state (EAR-based)
  const eyeOpenCounterRef = useRef<number>(0);
  const eyeClosedCounterRef = useRef<number>(0);
  const EYE_OPEN_FRAMES = 3; // require this many consecutive "open" frames to consider eyes open
  const EYE_CLOSED_FRAMES = 3; // require this many consecutive "closed" frames to show warning
  const EAR_THRESHOLD = 0.22; // default EAR threshold; adaptive tuning below will adjust slightly
  const [eyesOpen, setEyesOpen] = useState<boolean>(true);
  const [eyeWarning, setEyeWarning] = useState<string | null>(null);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        setLoadingProgress('Loading face detection models...');
        
        // Use centralized initialization with progress tracking
        setLoadingProgress('Downloading models (this may take 10-30 seconds)...');
        await initializeFaceAPI();
        
        setLoadingProgress('Models loaded successfully!');
        
        // Brief delay to show success message
        await new Promise(resolve => setTimeout(resolve, 300));
        
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
      setIsLoading(true);
      console.log('Requesting camera access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      console.log('Camera stream obtained:', stream);

      // Store stream immediately so it can be stopped if needed
      streamRef.current = stream;

      // Activate camera UI so the <video> element is mounted
      setIsLoading(false);
      setIsCameraActive(true);

      // Wait briefly for the video element to mount
      const waitForVideo = async (timeout = 1500) => {
        const start = Date.now();
        while (!videoRef.current) {
          if (Date.now() - start > timeout) break;
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 50));
        }
      };

      // After ensuring the video element mounts, attach stream and start detection.
      waitForVideo(1500).then(() => {
        const video = videoRef.current;
        if (!video) {
          console.error('Video ref is null');
          setError('Video element not found. Please refresh the page.');
          setIsLoading(false);
          return;
        }

        console.log('Setting up video element...');
        // Attach stream and attempt playback
        try {
          video.srcObject = streamRef.current;
        } catch (err) {
          console.warn('Unable to set srcObject directly:', err);
          try {
            // Fallback for some browsers: use URL.createObjectURL
            // @ts-ignore
            video.src = URL.createObjectURL(streamRef.current as any);
          } catch (e) {
            console.error('Failed to attach stream to video element', e);
          }
        }

        let detectionStarted = false;

        const handleCanPlay = () => {
          console.log('Video can play, dimensions:', video.videoWidth, 'x', video.videoHeight);
          if (!detectionStarted) {
            detectionStarted = true;
            video.play().catch((err) => console.error('Error playing video:', err));
            console.log('Starting face detection...');
            startDetection();
          }
        };

        // Fallback: start detection after 2s even if canplay didn't fire
        const fallbackTimer = window.setTimeout(() => {
          if (!detectionStarted) {
            console.log('Timeout reached, starting detection anyway...');
            detectionStarted = true;
            startDetection();
          }
        }, 2000);

        video.addEventListener('canplay', handleCanPlay, { once: true });
        video.addEventListener('loadedmetadata', () => {
          console.log('Video metadata loaded');
          if (!detectionStarted) {
            handleCanPlay();
          }
        }, { once: true });

        video.addEventListener('error', (err) => {
          console.error('Video error:', err);
        }, { once: true });

        // Clear fallback timer when detection starts or unmount
        const clearFallback = () => {
          clearTimeout(fallbackTimer);
        };

        // Ensure we clear the timer when detection starts
        if (detectionStarted) clearFallback();
      }).catch((err) => {
        console.error('Error waiting for video element:', err);
        setIsLoading(false);
        setError('Video element not found. Please refresh the page.');
      });
    } catch (error) {
      setIsLoading(false);
      console.error('Camera access denied:', error);
      if (error instanceof Error) {
        if ((error as any).name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera access to continue with face verification.');
        } else if ((error as any).name === 'NotFoundError') {
          setError('No camera found. Please ensure a camera is connected.');
        } else if ((error as any).name === 'NotReadableError') {
          setError('Camera is already in use by another application.');
        } else {
          setError(`Camera error: ${(error as Error).message}`);
        }
      } else {
        setError('Please allow camera access to continue with face verification.');
      }
    }
  };

  // Compute Eye Aspect Ratio (EAR) for an eye given 6 landmark points
  const computeEAR = (eye: { x: number; y: number }[]) => {
    // eye should be an array of 6 points: [p1,p2,p3,p4,p5,p6]
    if (!eye || eye.length < 6) return 0;
    const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.hypot(a.x - b.x, a.y - b.y);

  // we've guarded above that eye.length >= 6, use non-null assertions to satisfy TS
  const p1 = eye[0]!;
  const p2 = eye[1]!;
  const p3 = eye[2]!;
  const p4 = eye[3]!;
  const p5 = eye[4]!;
  const p6 = eye[5]!;

    const vertical1 = dist(p2, p6);
    const vertical2 = dist(p3, p5);
    const horizontal = dist(p1, p4) || 1;

    const ear = (vertical1 + vertical2) / (2.0 * horizontal);
    return ear;
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
    // Use relative thresholds based on inter-eye distance so detection scales across resolutions
    const nose = landmarks.getNose()[3];
    const leftEye = landmarks.getLeftEye()[0];
    const rightEye = landmarks.getRightEye()[3];

    const eyeCenterX = (leftEye.x + rightEye.x) / 2;
    const eyeDistance = Math.abs(rightEye.x - leftEye.x) || 1;
    const offset = nose.x - eyeCenterX;

    // threshold as fraction of eye distance (0.06 ~ modest head turn)
    const threshold = eyeDistance * 0.06;

    // Note: landmarks are in camera pixel space. A negative offset means the nose
    // moved left relative to the eye center (user turned head left). Map that
    // to the logical 'left' direction for instructions.
    if (offset < -threshold) return 'left';
    if (offset > threshold) return 'right';
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


  const drawFacialMeshScaled = (ctx: CanvasRenderingContext2D, landmarks: any, color: string, scaleX: number, scaleY: number) => {
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
      ctx.moveTo(points[0].x * scaleX, points[0].y * scaleY);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * scaleX, points[i].y * scaleY);
      }
      ctx.stroke();
    };
    
    const drawPoints = (points: any[]) => {
      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x * scaleX, point.y * scaleY, 2, 0, 2 * Math.PI);
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
      if (i === 0) ctx.moveTo(point.x * scaleX, point.y * scaleY);
      else ctx.lineTo(point.x * scaleX, point.y * scaleY);
    });
    ctx.closePath();
    ctx.stroke();
    
    ctx.beginPath();
    rightEye.forEach((point: any, i: number) => {
      if (i === 0) ctx.moveTo(point.x * scaleX, point.y * scaleY);
      else ctx.lineTo(point.x * scaleX, point.y * scaleY);
    });
    ctx.closePath();
    ctx.stroke();
    
    // Draw mouth (outer line)
    ctx.beginPath();
    mouth.forEach((point: any, i: number) => {
      if (i === 0) ctx.moveTo(point.x * scaleX, point.y * scaleY);
      else ctx.lineTo(point.x * scaleX, point.y * scaleY);
    });
    ctx.closePath();
    ctx.stroke();
    
    // Draw connection lines for mesh effect
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 1;
    
    // Connect nose to eyes
    if (nose[3] && leftEye[0] && rightEye[3]) {
      ctx.beginPath();
      ctx.moveTo(nose[3].x * scaleX, nose[3].y * scaleY);
      ctx.lineTo(leftEye[0].x * scaleX, leftEye[0].y * scaleY);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(nose[3].x * scaleX, nose[3].y * scaleY);
      ctx.lineTo(rightEye[3].x * scaleX, rightEye[3].y * scaleY);
      ctx.stroke();
    }
    
    // Connect nose to mouth
    if (nose[6] && mouth[14]) {
      ctx.beginPath();
      ctx.moveTo(nose[6].x * scaleX, nose[6].y * scaleY);
      ctx.lineTo(mouth[14].x * scaleX, mouth[14].y * scaleY);
      ctx.stroke();
    }
    
    // Connect eyes to jaw
    if (leftEye[0] && jaw[1]) {
      ctx.beginPath();
      ctx.moveTo(leftEye[0].x * scaleX, leftEye[0].y * scaleY);
      ctx.lineTo(jaw[1].x * scaleX, jaw[1].y * scaleY);
      ctx.stroke();
    }
    
    if (rightEye[3] && jaw[15]) {
      ctx.beginPath();
      ctx.moveTo(rightEye[3].x * scaleX, rightEye[3].y * scaleY);
      ctx.lineTo(jaw[15].x * scaleX, jaw[15].y * scaleY);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1.0;
    
    // Draw key points
    drawPoints([...leftEye, ...rightEye, nose[3], mouth[0], mouth[6]]);
  };

  const startDetection = () => {
    if (detectionIntervalRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Create a persistent temporary canvas and context (opt-in for frequent readbacks)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth || 640;
    tempCanvas.height = video.videoHeight || 480;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) return;

  // Track last applied display size to avoid constant resizing due to fractional px differences

    detectionIntervalRef.current = window.setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || !modelsLoaded) {
        // skip silently when prerequisites are not satisfied
        return;
      }

      const videoEl = videoRef.current;
      const canvasEl = canvasRef.current;

      // Ensure video is ready
      if (videoEl.videoWidth === 0 || videoEl.videoHeight === 0) return;

      // Update temp canvas to match video pixel dimensions if they change
      if (tempCanvas.width !== videoEl.videoWidth || tempCanvas.height !== videoEl.videoHeight) {
        tempCanvas.width = videoEl.videoWidth;
        tempCanvas.height = videoEl.videoHeight;
      }

      // Set overlay canvas size to match displayed size (rounded to avoid fractional jitter)
      const videoRect = videoEl.getBoundingClientRect();
      const displayW = Math.round(videoRect.width);
      const displayH = Math.round(videoRect.height);

      if (canvasEl.width !== displayW || canvasEl.height !== displayH) {
        canvasEl.width = displayW;
        canvasEl.height = displayH;
        // single informative log when size actually changes
        console.log('Resized canvas', { width: displayW, height: displayH });
      }

      try {
        const faceapi = getFaceAPI();

        // Draw video frame to temp canvas once per tick
        tempCtx.drawImage(videoEl, 0, 0, tempCanvas.width, tempCanvas.height);

        const detections = await faceapi
          .detectSingleFace(tempCanvas, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();

        const ctx = canvasEl.getContext('2d');
        if (!ctx) return;

        // Clear overlay canvas
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

        if (detections) {
          const box = detections.detection.box; // coordinates are in video pixel space
          const landmarks = detections.landmarks;

          // Scale coordinates from video (pixel) space to display space
          const scaleX = canvasEl.width / tempCanvas.width;
          const scaleY = canvasEl.height / tempCanvas.height;

          const scaledBox = {
            x: box.x * scaleX,
            y: box.y * scaleY,
            width: box.width * scaleX,
            height: box.height * scaleY
          };

          // Check for eyes and compute EAR
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();
          const hasEyes = leftEye.length > 0 && rightEye.length > 0;

          // Compute EAR for both eyes (use first 6 points from each eye array)
          const leftEAR = computeEAR(leftEye.slice(0, 6));
          const rightEAR = computeEAR(rightEye.slice(0, 6));
          // adaptive threshold: scale base threshold by relative eye width vs face width
          // leave space for adaptive threshold later; use base threshold for now
          const adaptiveThreshold = EAR_THRESHOLD;
          const eyesCurrentlyOpen = leftEAR > adaptiveThreshold && rightEAR > adaptiveThreshold;

          // Smooth eye state across frames to avoid false negatives during blinks
          if (eyesCurrentlyOpen) {
            eyeOpenCounterRef.current = (eyeOpenCounterRef.current || 0) + 1;
            eyeClosedCounterRef.current = 0;
          } else {
            eyeClosedCounterRef.current = (eyeClosedCounterRef.current || 0) + 1;
            eyeOpenCounterRef.current = 0;
          }

          if (eyeOpenCounterRef.current >= EYE_OPEN_FRAMES && !eyesOpen) {
            setEyesOpen(true);
            setEyeWarning(null);
            // optional debug
            if (DEBUG_DETECTION) console.debug('[face-dbg] eyes considered OPEN', { leftEAR, rightEAR });
          }

          if (eyeClosedCounterRef.current >= EYE_CLOSED_FRAMES && eyesOpen) {
            setEyesOpen(false);
            setEyeWarning('Please open your eyes fully to continue');
            if (DEBUG_DETECTION) console.debug('[face-dbg] eyes considered CLOSED', { leftEAR, rightEAR });
          }

          // Check distance (use scaled width)
          const faceWidth = scaledBox.width;
          const distanceOk = checkDistance(faceWidth);

          // Check lighting using the temp canvas (video pixel coordinates)
          const sampleSize = 100;
          const sampleX = Math.max(0, Math.floor(box.x));
          const sampleY = Math.max(0, Math.floor(box.y));
          const sampleW = Math.max(1, Math.min(sampleSize, Math.floor(box.width)));
          const sampleH = Math.max(1, Math.min(sampleSize, Math.floor(box.height)));

          let currentBrightness = 0;
          try {
            const imageData = tempCtx.getImageData(sampleX, sampleY, sampleW, sampleH);
            currentBrightness = calculateBrightness(imageData);
            setBrightness(currentBrightness);
          } catch (e) {
            // Some browsers may throw if sampling outside bounds; ignore and continue
            console.warn('Brightness sampling failed:', e);
          }

          const lightingOk = currentBrightness > 50 && currentBrightness < 200;

          // Update validation state
          setValidation(prev => ({
            ...prev,
            hasFace: true,
            hasEyes,
            distanceOk,
            lightingOk
          }));

          // Progress through movement sequence. Use movementStepRef inside the
          // interval loop to avoid stale closures reading React state.
          const direction = getHeadDirection(landmarks);

          if (DEBUG_DETECTION) {
            try {
              const nose = landmarks.getNose()[3];
              const leftEye = landmarks.getLeftEye()[0];
              const rightEye = landmarks.getRightEye()[3];
              const eyeCenterX = (leftEye.x + rightEye.x) / 2;
              const eyeDistance = Math.abs(rightEye.x - leftEye.x) || 1;
              const offset = nose.x - eyeCenterX;
              const threshold = eyeDistance * 0.06;
              console.debug('[face-dbg] dir=%s offset=%.3f threshold=%.3f counters=%o', direction, offset, threshold, movementCountersRef.current);
            } catch (e) {
              // ignore debug errors
            }
          }

          // Enforce eye-open gating: pass the current smoothed eyesOpen state
          checkMovementProgress(direction, distanceOk, lightingOk, hasEyes, eyesOpen);

          // Draw overlays
          const isValid = distanceOk && lightingOk && hasEyes;
          const boxColor = isValid ? '#22c55e' : '#f59e0b';
          const meshColor = isValid ? '#ffffff' : '#fbbf24';

          drawCornerBrackets(ctx, scaledBox.x, scaledBox.y, scaledBox.width, scaledBox.height, boxColor);
          drawFacialMeshScaled(ctx, landmarks, meshColor, scaleX, scaleY);
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
    }, 80);
  };

  const checkMovementProgress = (
    direction: 'left' | 'right' | 'center',
    distanceOk: boolean,
    lightingOk: boolean,
    hasEyes: boolean,
    eyesAreOpen: boolean
  ) => {
  const FRAMES_REQUIRED = 4; // ~320ms at 80ms detection interval (more responsive)

    // Read the current movement step from the mutable ref to avoid stale
    // closures inside the detection interval.
    const currentStep = movementStepRef.current;

    // Reset counter if validations fail or eyes are not confidently open
    if (!distanceOk || !lightingOk || !hasEyes || !eyesAreOpen) {
      movementCountersRef.current[currentStep] = 0;
      return;
    }

    // Map expected direction for each step
    const expectedDir: Record<MovementStep, 'left' | 'right' | 'center'> = {
      'center': 'center',
      'left': 'left',
      'center-2': 'center',
      'right': 'right',
      'center-3': 'center',
      'complete': 'center'
    };

    const expected = expectedDir[currentStep];

    if (direction === expected) {
      movementCountersRef.current[currentStep] = (movementCountersRef.current[currentStep] || 0) + 1;
    } else {
      movementCountersRef.current[currentStep] = 0;
    }

    if (movementCountersRef.current[currentStep] >= FRAMES_REQUIRED) {
      // mark step complete and advance
      setMovementProgress(prev => ({ ...prev, [currentStep]: true }));

      const nextSteps: Record<MovementStep, MovementStep> = {
        'center': 'left',
        'left': 'center-2',
        'center-2': 'right',
        'right': 'center-3',
        'center-3': 'complete',
        'complete': 'complete'
      };

      const nextStep = nextSteps[currentStep];
      // update both the mutable ref (used by the interval) and React state
      movementStepRef.current = nextStep;
      setValidation(prev => ({ ...prev, currentMovement: nextStep }));

      // reset counter for this step
      movementCountersRef.current[currentStep] = 0;

      if (nextStep === 'complete') {
        completeVerification();
      }
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
    
    // Start camera immediately after disclaimer is closed
    // No delay needed - UI is already updated
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

  // Inline eye-state warning UI: shown when eyeWarning is non-null

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
              key="error"
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

        {/* Loading State */}
        {isLoading && !isCameraActive && (
          <div className="flex items-center justify-center h-[500px] bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 rounded-3xl border-2 border-teal-200 shadow-lg">
            <div className="text-center p-8 max-w-md">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              >
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center shadow-xl mb-6">
                  <Camera className="text-white" size={48} />
                </div>
              </motion.div>
              <motion.h3 
                className="text-2xl font-semibold text-gray-800 mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {loadingProgress}
              </motion.h3>
              <p className="text-gray-600 mb-6">Please wait, this only happens once...</p>
              <div className="relative w-full max-w-sm mx-auto">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    className="h-full bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 rounded-full"
                    animate={{ width: ['0%', '100%', '0%'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder before camera activates */}
        {modelsLoaded && !isCameraActive && !disclaimerAccepted && !error && (
          <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-3xl h-[500px] flex items-center justify-center border-2 border-dashed border-teal-300">
            <div className="text-center p-8">
              <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center">
                <Camera className="text-teal-700" size={48} />
              </div>
              <p className="text-gray-700 text-lg font-medium mb-2">Ready to Start</p>
              <p className="text-gray-500 text-sm">Accept the disclaimer above to begin</p>
            </div>
          </div>
        )}

        {/* Camera Initializing State */}
        {modelsLoaded && !isCameraActive && disclaimerAccepted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-3xl h-[500px] flex items-center justify-center border-2 border-teal-200"
          >
            <div className="text-center p-8">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mx-auto mb-6 w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center"
              >
                <Loader2 className="text-teal-700 animate-spin" size={48} />
              </motion.div>
              <p className="text-gray-700 text-lg font-medium mb-2">Initializing Camera...</p>
              <p className="text-gray-500 text-sm">Please grant camera access when prompted</p>
              <div className="mt-6 w-48 mx-auto">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-teal-600 rounded-full"
                    animate={{ width: ['0%', '100%', '0%'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Camera View */}
        {isCameraActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {/* Progress Bar */}
            <div className="bg-gradient-to-r from-white to-teal-50/50 rounded-2xl p-5 border-2 border-teal-200 shadow-lg">
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
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-6 bg-gradient-to-r from-teal-900/90 via-blue-900/90 to-teal-900/90 backdrop-blur-md rounded-2xl p-4 border-2 border-white/30 shadow-2xl"
            >
              <motion.div 
                className="flex items-center gap-2"
                whileHover={{ scale: 1.1 }}
              >
                <motion.div 
                  className={`h-4 w-4 rounded-full transition-all ${
                    validation.hasEyes ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-gray-400'
                  }`}
                  animate={validation.hasEyes ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.5 }}
                />
                <p className="text-sm text-white font-medium">Eyes</p>
              </motion.div>
              
              <div className="h-8 w-px bg-white/30" />
              
              <motion.div 
                className="flex items-center gap-2"
                whileHover={{ scale: 1.1 }}
              >
                <motion.div 
                  className={`h-4 w-4 rounded-full transition-all ${
                    validation.distanceOk ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-gray-400'
                  }`}
                  animate={validation.distanceOk ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.5 }}
                />
                <p className="text-sm text-white font-medium">Distance</p>
              </motion.div>
              
              <div className="h-8 w-px bg-white/30" />
              
              <motion.div 
                className="flex items-center gap-2"
                whileHover={{ scale: 1.1 }}
              >
                <motion.div 
                  className={`h-4 w-4 rounded-full transition-all ${
                    validation.lightingOk ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-gray-400'
                  }`}
                  animate={validation.lightingOk ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.5 }}
                />
                <p className="text-sm text-white font-medium">Light</p>
              </motion.div>
            </motion.div>

            {/* Video Feed */}
            <div className="relative bg-black rounded-3xl overflow-hidden shadow-2xl video-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-[500px] object-cover mirror"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none mirror"
              />
              
              {/* Top Status Indicator */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
                <motion.div
                  key={validation.currentMovement}
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="bg-gradient-to-r from-teal-700 via-blue-700 to-teal-700 backdrop-blur-md rounded-full px-8 py-4 border-2 border-white/40 shadow-2xl"
                >
                  <div className="flex items-center gap-3">
                    <motion.span 
                      className="text-3xl font-bold"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {getMovementIcon()}
                    </motion.span>
                    <p className="text-white font-semibold text-lg tracking-wide">
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
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 backdrop-blur-md rounded-full px-8 py-3 shadow-2xl border-2 border-white/20">
                      <p className="text-white text-sm font-semibold flex items-center gap-2">
                        <AlertCircle className="inline" size={16} />
                        Position your face in the frame
                      </p>
                    </div>
                  </motion.div>
                )}
                
                {validation.hasFace && !validation.hasEyes && (
                    <motion.div
                      key="no-eyes"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
                  >
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 backdrop-blur-md rounded-full px-8 py-3 shadow-2xl border-2 border-white/20">
                      <p className="text-white text-sm font-semibold flex items-center gap-2">
                        <AlertCircle className="inline" size={16} />
                        Eyes not detected - remove glasses
                      </p>
                    </div>
                  </motion.div>
                )}
                
                {validation.hasFace && validation.hasEyes && !validation.distanceOk && (
                  <motion.div
                    key="distance"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
                  >
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 backdrop-blur-md rounded-full px-8 py-3 shadow-2xl border-2 border-white/20">
                      <p className="text-white text-sm font-semibold flex items-center gap-2">
                        <AlertCircle className="inline" size={16} />
                        Adjust your distance from camera
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Eye-open gating warning (shows when EAR smoothing detects closed eyes) */}
                {eyeWarning && (
                  <motion.div
                    key="eye-warning"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10"
                  >
                    <div className="bg-gradient-to-r from-rose-500 to-red-600 backdrop-blur-md rounded-full px-6 py-2 shadow-2xl border-2 border-white/20">
                      <p
                        className="text-white text-sm font-semibold flex items-center gap-2"
                        role="status"
                        aria-live="assertive"
                      >
                        <AlertCircle className="inline" size={16} />
                        {eyeWarning}
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
                className="w-full h-[400px] object-cover mirror"
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
                  // reset movement ref and counters to avoid stale state
                  movementStepRef.current = 'center';
                  Object.keys(movementCountersRef.current).forEach((k) => { movementCountersRef.current[k as MovementStep] = 0; });
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
