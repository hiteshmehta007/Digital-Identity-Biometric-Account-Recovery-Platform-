import { Stage2FaceVerification } from './onboarding/Stage2FaceVerification';

export function FaceVerificationTest() {
  const handleNext = (result: any) => {
    console.log('Face verification completed:', result);
    alert('Face verification completed successfully!');
  };

  const handleBack = () => {
    console.log('Back button clicked');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          Face Verification Test
        </h1>
        <Stage2FaceVerification onNext={handleNext} onBack={handleBack} />
      </div>
    </div>
  );
}
