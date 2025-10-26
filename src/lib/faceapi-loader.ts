// Lazy import to prevent immediate TensorFlow.js initialization
let faceapi: any = null;

// Singleton state
let isInitialized = false;
let isInitializing = false;
let initializationPromise: Promise<void> | null = null;

// Suppress TensorFlow.js warning messages
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (
      message.includes('backend was already registered') ||
      message.includes('Platform') && message.includes('has already been set')
    ) {
      return; // Suppress these specific warnings
    }
    originalWarn.apply(console, args);
  };
  
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (
      message.includes('backend was already registered') ||
      message.includes('Platform') && message.includes('has already been set')
    ) {
      return; // Suppress these specific errors
    }
    originalError.apply(console, args);
  };
}

/**
 * Initialize face-api.js models once globally
 * This prevents multiple backend registrations and platform overwrites
 */
export async function initializeFaceAPI(): Promise<void> {
  // If already initialized, return immediately
  if (isInitialized) {
    return Promise.resolve();
  }

  // If currently initializing, return the existing promise
  if (isInitializing && initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  isInitializing = true;

  initializationPromise = (async () => {
    try {
      // Lazy load face-api.js only when needed
      if (!faceapi) {
        faceapi = await import('face-api.js');
      }

      // Check if models are already loaded
      if (
        faceapi.nets.tinyFaceDetector.isLoaded &&
        faceapi.nets.faceLandmark68Net.isLoaded &&
        faceapi.nets.faceExpressionNet.isLoaded
      ) {
        isInitialized = true;
        isInitializing = false;
        return;
      }

      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);

      isInitialized = true;
      isInitializing = false;
    } catch (error) {
      isInitializing = false;
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
}

/**
 * Check if face-api.js has been initialized
 */
export function isFaceAPIInitialized(): boolean {
  return isInitialized;
}

/**
 * Reset initialization state (useful for testing or hot reload)
 */
export function resetFaceAPIInitialization(): void {
  isInitialized = false;
  isInitializing = false;
  initializationPromise = null;
}

/**
 * Get the face-api instance (must call initializeFaceAPI first)
 */
export function getFaceAPI(): any {
  if (!faceapi) {
    throw new Error('face-api.js not loaded. Call initializeFaceAPI() first.');
  }
  return faceapi;
}
