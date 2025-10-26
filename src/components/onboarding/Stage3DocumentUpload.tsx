import { useState, useRef } from 'react';
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
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    setIsProcessing(true);
    // Simulate document verification
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsProcessing(false);
    onNext();
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
