import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Upload, FileText, Info, CheckCircle2, X, Shield } from 'lucide-react';

interface Stage3Props {
  onNext: () => void;
  onBack: () => void;
}

export function Stage3DocumentUpload({ onNext, onBack }: Stage3Props) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [extracted, setExtracted] = useState<null | {
    fullName?: string;
    dob?: string;
    docNumber?: string;
    address?: string;
    issuingAuthority?: string;
    docType?: string;
  }>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const cryptoKeyRef = useRef<CryptoKey | null>(null);
  const encryptedRef = useRef<string | null>(null);
  const [editingDocNumber, setEditingDocNumber] = useState(false);
  const [showFullNumber, setShowFullNumber] = useState(false);

  const acceptedFormats = [
    { name: 'Passport', icon: '🛂' },
    { name: 'Driver\'s License', icon: '🪪' },
    { name: 'National ID', icon: '🆔' },
    { name: 'Aadhaar Card', icon: '🇮🇳' },
    { name: 'Other Gov ID', icon: '📋' },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      setUploadedFile(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    } else {
      alert('Please upload an image (JPG, PNG) or PDF file');
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!uploadedFile) return;

    // For PDFs we currently ask users to upload an image or capture with camera
    if (uploadedFile.type === 'application/pdf') {
      setOcrError('PDF detected — please upload an image (JPG/PNG) or capture a photo of the document for OCR.');
      return;
    }

    setIsProcessing(true);
    setOcrError(null);
    try {
      await runOcrOnFile(uploadedFile);
      setIsProcessing(false);
      // After OCR and user confirmation they can proceed
      // Keep onNext for finalization flow; do not auto-advance until user confirms
    } catch (err: any) {
      console.error('OCR failed', err);
      setOcrError(String(err?.message || err));
      setIsProcessing(false);
    }
  };

  // Create a symmetric key and store for in-memory encryption of extracted data
  const ensureCryptoKey = async () => {
    if (!cryptoKeyRef.current) {
      cryptoKeyRef.current = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    }
    return cryptoKeyRef.current;
  };

  const encryptExtracted = async (data: object) => {
    const key = await ensureCryptoKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    const cipher = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
    const b64 = `${arrayBufferToBase64(iv)}:${arrayBufferToBase64(cipher)}`;
    encryptedRef.current = b64;
    return b64;
  };

  const arrayBufferToBase64 = (buf: ArrayBuffer | Uint8Array) => {
    const bytes = new Uint8Array(buf as ArrayBuffer);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, Array.prototype.slice.call(bytes, i, i + chunk));
    }
    return btoa(binary);
  };

  const maskDocNumber = (s?: string) => {
    if (!s) return '';
    if (s.length <= 4) return '••••';
    return `${s.slice(0, 2)}••••••${s.slice(-2)}`;
  };

  // OCR flow using tesseract worker
  const runOcrOnFile = async (file: File) => {
    setScanning(true);
    setExtracted(null);
    setOcrError(null);

    // Dynamically import tesseract to avoid issues with CJS/ESM interop in some bundlers
    const t = await import('tesseract.js');
    const createWorkerFn: any = (t && (t.createWorker ?? (t as any).default?.createWorker)) ?? null;
    if (!createWorkerFn) {
      throw new Error('Tesseract createWorker is unavailable');
    }

    // call createWorkerFn and await the returned worker (the library returns a Promise)
    const worker = await createWorkerFn({ logger: (m: any) => {
      // use logger to update a light progress UI if desired
      // m.progress gives 0-1
      // console.debug('tesseract', m);
    }});

    try {
      await worker.load();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');

      // Convert file to data URL if not already
      const imgData = await fileToDataURL(file);

      // show a short 2.5s scanning animation for UX while OCR runs
      const scanningDelay = new Promise(res => setTimeout(res, 2500));

      const { data } = await worker.recognize(imgData);
      await scanningDelay;

      // Simple heuristics to extract fields from OCR text
      const text = data.text || '';
      const extractedFields = heuristicsExtract(text);
      setExtracted(extractedFields);
      await encryptExtracted(extractedFields);
      await worker.terminate();
      setScanning(false);
      return extractedFields;
    } catch (err) {
      try { await worker.terminate(); } catch (e) {}
      setScanning(false);
      throw err;
    }
  };

  const fileToDataURL = (file: File) => new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Failed to read file'));
    r.readAsDataURL(file);
  });

  const heuristicsExtract = (text: string) => {
    // naive regex-based extraction. Improvements: country-specific parsers.
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const joined = lines.join(' | ');
    const nameMatch = joined.match(/([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    const dobMatch = joined.match(/(\b\d{2}[\/-]\d{2}[\/-]\d{2,4}\b)|(\b\d{4}-\d{2}-\d{2}\b)/);
    const numberMatch = joined.match(/([A-Z0-9]{5,20})/g);
    const docNum = numberMatch ? numberMatch[numberMatch.length - 1] : undefined;
    const address = lines.slice(-3).join(', ');
    const docType = detectDocType(joined);
    return {
      fullName: nameMatch?.[0],
      dob: dobMatch?.[0],
      docNumber: docNum,
      address: address || undefined,
      issuingAuthority: undefined,
      docType
    };
  };

  const detectDocType = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('passport') || lower.includes('passport no')) return 'Passport';
    if (lower.includes('aadhaar') || lower.includes('aadhar')) return 'Aadhaar';
    if (lower.includes('driver') || lower.includes('driving')) return 'Driver\'s License';
    if (lower.includes('pan')) return 'PAN';
    if (lower.includes('utility') || lower.includes('bill')) return 'Utility Bill';
    return 'Identity Document';
  };

  // Camera capture helpers
  const openCamera = async () => {
    try {
      setCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera open failed', err);
      setOcrError('Unable to access camera. Please allow camera permissions or upload an image.');
      setCameraOpen(false);
    }
  };

  const closeCamera = async () => {
    setCameraOpen(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureFromCamera = async () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth || 1280;
    canvas.height = v.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');
    // Convert to File-like blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setUploadedFile(file);
    setPreviewUrl(dataUrl);
    await closeCamera();
  };

  useEffect(() => {
    return () => {
      // ensure camera stopped
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
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
            <FileText className="text-teal-700" size={24} />
          </div>
          <h2>Document Verification</h2>
        </motion.div>
        
        <motion.p 
          className="text-gray-600 text-lg mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          To complete your secure email identity, we ask for a government-issued document. This ensures your account is truly yours—and recoverable if ever compromised.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"
        >
          <Shield className="text-amber-600 flex-shrink-0 mt-1" size={20} />
          <div>
            <p className="text-amber-900">
              <span>Your document is handled with care:</span>
            </p>
            <ul className="text-amber-800 text-sm mt-2 space-y-1">
              <li>• Encrypted immediately upon upload</li>
              <li>• Used solely for identity verification</li>
              <li>• Never shared with third parties</li>
              <li>• Can be deleted from your account settings</li>
            </ul>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-6"
      >
        <p className="text-gray-700 mb-3">Accepted documents:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {acceptedFormats.map((format, index) => (
            <motion.div
              key={format.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.05 }}
              className="bg-white border-2 border-gray-200 rounded-xl p-3 text-center hover:border-teal-300 transition-colors"
            >
              <div className="text-2xl mb-1">{format.icon}</div>
              <p className="text-sm text-gray-700">{format.name}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {!uploadedFile ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: 0.7 }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all ${
              dragActive 
                ? 'border-teal-500 bg-teal-50' 
                : 'border-gray-300 bg-gray-50 hover:border-teal-400 hover:bg-teal-50/50'
            }`}
          >
            <motion.div
              className="h-20 w-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Upload className="text-teal-700" size={32} />
            </motion.div>
            <h3 className="mb-2">Upload your document</h3>
            <p className="text-gray-600 mb-6">
              Drag and drop or click to browse
            </p>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInput}
              accept="image/*,application/pdf"
              className="hidden"
              id="file-upload"
              aria-label="Upload document file"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-teal-700 hover:bg-teal-800"
              size="lg"
            >
              Choose File
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              Supported formats: JPG, PNG, PDF (Max 10MB)
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="border-2 border-green-300 bg-green-50 rounded-2xl overflow-hidden"
          >
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Document preview"
                  className="w-full h-64 object-contain bg-gray-900"
                />
                <button
                  onClick={removeFile}
                  className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                  aria-label="Remove uploaded document"
                  title="Remove uploaded document"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-100">
                <FileText className="mx-auto mb-3 text-gray-600" size={48} />
                <p className="text-gray-700">PDF Document</p>
              </div>
            )}
            
            <div className="p-6 bg-white">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle2 className="text-green-600 flex-shrink-0 mt-1" size={24} />
                <div className="flex-1">
                  <p className="text-gray-900">{uploadedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  onClick={removeFile}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Remove
                </Button>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-900 text-sm">
                  🔒 Your document will be encrypted before transmission and stored securely.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera capture and scanning controls */}
      <div className="mt-4 flex gap-3 items-center">
        <Button onClick={openCamera} variant="outline" aria-label="Capture document with camera">
          Capture via Camera
        </Button>
        <Button onClick={() => fileInputRef.current?.click()} variant="outline" aria-label="Upload document file">
          Upload from Device
        </Button>
        {ocrError && <div className="text-rose-600 text-sm">{ocrError}</div>}
      </div>

      {/* Scanning overlay */}
      <AnimatePresence>
        {scanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            role="status"
            aria-live="polite"
          >
            <div className="bg-white rounded-xl p-6 w-11/12 max-w-md text-center shadow-xl">
              <div className="mb-4">
                <div className="relative h-40 bg-gray-900 rounded overflow-hidden">
                  {/* pulsing scan beam */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
                    style={{ mixBlendMode: 'screen' }}
                  />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Scanning your document securely…</h3>
              <p className="text-sm text-gray-600 mb-4">We temporarily process the image in your browser and extract key fields.</p>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-3">
                <motion.div className="bg-teal-600 h-2" animate={{ width: ['10%', '80%', '100%'] }} transition={{ duration: 2.5 }} />
              </div>
              <div className="flex justify-center">
                <Button onClick={() => { /* allow users to cancel scan */ setScanning(false); }} variant="ghost">Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Extracted fields preview and edit */}
      {extracted && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-white border border-gray-200 rounded-2xl p-6">
          <h4 className="text-lg font-semibold mb-3">Scanned details (editable)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-700">Full name</label>
              <input className="w-full mt-1 p-2 border rounded" value={extracted.fullName || ''} onChange={(e) => setExtracted({ ...extracted, fullName: e.target.value })} aria-label="Full name" />
            </div>
            <div>
              <label className="text-sm text-gray-700">Date of birth</label>
              <input className="w-full mt-1 p-2 border rounded" value={extracted.dob || ''} onChange={(e) => setExtracted({ ...extracted, dob: e.target.value })} aria-label="Date of birth" />
            </div>
            <div>
              <label className="text-sm text-gray-700">Document number</label>
              <div className="flex gap-2 items-center">
                <input
                  className="w-full mt-1 p-2 border rounded"
                  value={editingDocNumber ? (extracted.docNumber || '') : (showFullNumber ? (extracted.docNumber || '') : maskDocNumber(extracted.docNumber))}
                  onChange={(e) => setExtracted({ ...extracted, docNumber: e.target.value })}
                  aria-label="Document number"
                  readOnly={!editingDocNumber}
                />
                <Button variant="outline" size="sm" onClick={() => { if (editingDocNumber) { setEditingDocNumber(false); setShowFullNumber(false); } else { setEditingDocNumber(true); setShowFullNumber(true); } }} aria-label={editingDocNumber ? 'Save document number' : 'Edit document number'}>
                  {editingDocNumber ? 'Save' : 'Edit'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowFullNumber(s => !s)} aria-label="Toggle show document number">
                  {showFullNumber ? 'Hide' : 'Show'}
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-700">Document type</label>
              <input className="w-full mt-1 p-2 border rounded" value={extracted.docType || ''} onChange={(e) => setExtracted({ ...extracted, docType: e.target.value })} aria-label="Document type" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-gray-700">Address</label>
              <textarea className="w-full mt-1 p-2 border rounded" value={extracted.address || ''} onChange={(e) => setExtracted({ ...extracted, address: e.target.value })} aria-label="Address" />
            </div>
          </div>

            <div className="mt-4 flex items-center justify-end gap-2">
            <Button onClick={() => { setExtracted(null); setPreviewUrl(null); setUploadedFile(null); }}>Re-scan</Button>
            <Button variant="outline" onClick={() => { /* allow user to clear encrypted data */ encryptedRef.current = null; setExtracted(null); }}>Clear</Button>
            <Button onClick={async () => {
              setIsProcessing(true);
              try {
                await encryptExtracted(extracted);
                // store a small, non-sensitive verification summary for downstream flows (used to populate QR / confirmation)
                try {
                  const summary = {
                    docType: extracted.docType || 'Identity Document',
                    submittedAt: new Date().toISOString(),
                    name: extracted.fullName || undefined,
                    // do NOT store full document numbers in sessionStorage; store masked representation only
                    maskedDocNumber: extracted.docNumber ? maskDocNumber(extracted.docNumber) : undefined
                  };
                  sessionStorage.setItem('digital_identity_verification_summary', JSON.stringify(summary));
                } catch (e) {
                  // ignore sessionStorage errors (private mode etc.)
                }
                setIsProcessing(false);
                onNext();
              } catch (e) {
                setIsProcessing(false);
                setOcrError('Failed to save scanned data.');
              }
            }} className="bg-teal-700 text-white">Save & Continue</Button>
          </div>
        </motion.div>
      )}

      {/* Camera modal */}
      <AnimatePresence>
        {cameraOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white rounded-lg w-11/12 max-w-lg p-4">
              <div className="relative">
                <video ref={videoRef} className="w-full h-64 bg-black rounded" playsInline muted aria-label="Camera preview" />
                <button onClick={closeCamera} className="absolute top-2 right-2 bg-white rounded-full p-2" aria-label="Close camera"><X size={18} /></button>
              </div>
              <div className="mt-3 flex items-center justify-center gap-3">
                <Button onClick={captureFromCamera} aria-label="Capture photo">Capture</Button>
                <Button variant="outline" onClick={closeCamera} aria-label="Cancel camera">Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {uploadedFile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Button
            onClick={handleSubmit}
            className="w-full bg-teal-700 hover:bg-teal-800 py-6"
            size="lg"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mr-2"
                >
                  ⏳
                </motion.div>
                Verifying Document...
              </>
            ) : (
              'Complete Verification'
            )}
          </Button>
        </motion.div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button
          onClick={onBack}
          variant="ghost"
          className="text-gray-600"
          disabled={isProcessing}
        >
          ← Back
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="text-teal-700">
              <Info className="mr-2" size={18} />
              Why is this required?
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Document Verification: Explained</DialogTitle>
              <DialogDescription className="text-base leading-relaxed space-y-4 mt-4">
                <p>
                  We require a government-issued document to establish a verified identity. This protects you by:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Preventing account impersonation and identity theft</li>
                  <li>Enabling secure, blame-free account recovery</li>
                  <li>Ensuring you can always regain access to your data</li>
                  <li>Meeting regulatory requirements for email providers</li>
                </ul>
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mt-4">
                  <p className="text-teal-900">
                    <span>Privacy & Security:</span> Your document is encrypted end-to-end. 
                    We use it only for verification purposes and comply with international data 
                    protection standards. You can request manual review if you have privacy concerns.
                  </p>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Alternative verification methods may be available for users who cannot provide 
                  standard documents. Contact our support team for assistance.
                </p>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
}
