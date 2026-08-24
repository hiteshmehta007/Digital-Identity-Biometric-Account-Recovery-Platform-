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

      // Use unpkg CDN for faster loading (no CORS issues, fast CDN)
      // @vladmandic/face-api is the modern, actively maintained fork
      const modelUrl = 'https://unpkg.com/@vladmandic/face-api@1.7.12/model/';
      
      console.info('[faceapi-loader] Loading models from', modelUrl);
      
      try {
        // Load all models in parallel for speed
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl).then(() => console.info('[faceapi-loader] Tiny face detector loaded')),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl).then(() => console.info('[faceapi-loader] Face landmarks model loaded')),
          faceapi.nets.faceExpressionNet.loadFromUri(modelUrl).then(() => console.info('[faceapi-loader] Face expression model loaded'))
        ]);
        
        console.info('[faceapi-loader] All models loaded successfully from', modelUrl);
      } catch (err) {
        console.error('[faceapi-loader] Failed to load models:', err);
        throw new Error(`Failed to load face-api models: ${err instanceof Error ? err.message : 'Unknown error'}. Please check your internet connection and try again.`);
      }

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
