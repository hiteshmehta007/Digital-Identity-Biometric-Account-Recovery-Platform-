import { AuthUI } from '../components/ui/auth-ui';
import { useNavigate } from 'react-router-dom';

interface LoginPageProps {
  onSignedIn?: (user?: { name?: string; email?: string }) => void;
}

export default function LoginPage({ onSignedIn }: LoginPageProps) {
  const navigate = useNavigate();

  const handleSignIn = (data: { email: string; password: string }) => {
    console.log('Sign in with:', data);
    // Here you would typically make an API call to authenticate
    // For demo purposes, we'll just call the callback
    onSignedIn?.({ email: data.email });
    // Optionally navigate to account creation or home page
    navigate('/');
  };

  const handleSignUp = (data: { name: string; email: string; password: string }) => {
    console.log('Sign up with:', data);
    // Here you would typically make an API call to create account
    // For demo purposes, we'll just call the callback
    onSignedIn?.({ name: data.name, email: data.email });
    // Optionally navigate to account creation flow
    navigate('/?signup=true');
  };

  return (
    <AuthUI 
      onSignInSubmit={handleSignIn}
      onSignUpSubmit={handleSignUp}
    />
  );
}
