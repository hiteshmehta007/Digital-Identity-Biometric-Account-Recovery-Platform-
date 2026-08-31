import { AuthUI } from '../components/ui/auth-ui';

interface AuthPageProps {
  onSignInSuccess?: (user?: { name?: string; email?: string }) => void;
  onClose?: () => void;
}

export default function AuthPage({ onSignInSuccess, onClose }: AuthPageProps) {
  const handleSignIn = (data: { email: string; password: string }) => {
    console.log('Sign in with:', data);
    // Here you would typically make an API call to authenticate
    onSignInSuccess?.({ email: data.email });
  };

  const handleSignUp = (data: { name: string; email: string; password: string }) => {
    console.log('Sign up with:', data);
    // Here you would typically make an API call to create account
    onSignInSuccess?.({ name: data.name, email: data.email });
  };

  return (
    <AuthUI 
      onSignInSubmit={handleSignIn}
      onSignUpSubmit={handleSignUp}
    />
  );
}
