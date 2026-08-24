/**
 * INTEGRATION EXAMPLES FOR AUTH-FUSE COMPONENT
 * 
 * This file contains three different examples of how to integrate
 * the AuthUI component into the Nuvana Mail application.
 * 
 * Choose the approach that best fits your needs:
 * 1. Simple replacement of OnboardingFlow
 * 2. Combined auth + onboarding flow
 * 3. Full authentication with Supabase
 */

import { useState } from 'react';
import { AuthUI } from './components/ui/auth-fuse';
import { EmailSidebar } from './components/EmailSidebar';
// ... other imports from your App.tsx

// =============================================================================
// EXAMPLE 1: Simple Replacement of OnboardingFlow
// =============================================================================
// Use this if you want to replace the existing onboarding with a standard auth flow

export function AppWithAuthOnly() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  
  // Replace the form handlers in auth-fuse.tsx to call this
  const handleAuthentication = (userEmail: string) => {
    // Extract username from email or set it
    const extractedUsername = userEmail.split('@')[0];
    setUsername(extractedUsername);
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <AuthUI />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Your email dashboard here */}
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <span>Nuvana Mail</span>
          <div className="text-sm text-gray-700">
            {username}@nuvana.mail
          </div>
        </div>
      </header>
      {/* Rest of email interface */}
    </div>
  );
}

// =============================================================================
// EXAMPLE 2: Combined Auth + Onboarding Flow
// =============================================================================
// Use this to show AuthUI for returning users and OnboardingFlow for new users

type AppStep = 'auth' | 'onboarding' | 'dashboard';

export function AppWithAuthAndOnboarding() {
  const [currentStep, setCurrentStep] = useState<AppStep>('auth');
  const [username, setUsername] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  // Called when user signs in successfully
  const handleSignIn = (email: string) => {
    const extractedUsername = email.split('@')[0];
    setUsername(extractedUsername);
    setCurrentStep('dashboard');
  };

  // Called when user clicks sign up
  const handleSignUp = () => {
    setIsNewUser(true);
    setCurrentStep('onboarding');
  };

  // Called when onboarding is complete
  const handleOnboardingComplete = (newUsername: string) => {
    setUsername(newUsername);
    setCurrentStep('dashboard');
  };

  // Show authentication screen
  if (currentStep === 'auth') {
    return (
      <div>
        <AuthUI />
        {/* You'd need to modify the AuthUI component to accept callbacks */}
      </div>
    );
  }

  // Onboarding removed in branded build — fall back to AuthUI (or show dashboard directly)
  if (currentStep === 'onboarding') {
    return <AuthUI />;
  }

  // Show main dashboard
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Your email dashboard */}
    </div>
  );
}

// =============================================================================
// EXAMPLE 3: Full Authentication with Supabase Integration
// =============================================================================
// Use this for production with real authentication

// First, install Supabase: npm install @supabase/supabase-js

/*
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);

export function AppWithSupabase() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUsername(session.user.email?.split('@')[0] || null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUsername(session.user.email?.split('@')[0] || null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error signing in:', error.message);
      alert('Error signing in: ' + error.message);
      return;
    }

    console.log('Signed in successfully:', data);
  };

  const handleSignUp = async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          username: email.split('@')[0],
        },
      },
    });

    if (error) {
      console.error('Error signing up:', error.message);
      alert('Error signing up: ' + error.message);
      return;
    }

    console.log('Signed up successfully:', data);
  };

  const handleGoogleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('Error with Google sign in:', error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUsername(null);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    // Not authenticated - show AuthUI
    // Note: You'll need to modify AuthUI to accept these callbacks
    return <AuthUI />;
  }

  // Authenticated - show email dashboard
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <span>Nuvana Mail</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">
              {username}@nuvana.mail
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      {/* Rest of email interface *\/}
    </div>
  );
}
*/

// =============================================================================
// MODIFIED AUTH-FUSE COMPONENT WITH CALLBACKS
// =============================================================================
// Copy this into your auth-fuse.tsx to enable callbacks

/*
// Add these interfaces to auth-fuse.tsx:

interface AuthCallbacks {
  onSignIn?: (email: string, password: string) => void | Promise<void>;
  onSignUp?: (name: string, email: string, password: string) => void | Promise<void>;
  onGoogleSignIn?: () => void | Promise<void>;
}

// Modify SignInForm to accept and use callbacks:
function SignInForm({ onSignIn }: { onSignIn?: (email: string, password: string) => void | Promise<void> }) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    if (onSignIn) {
      setIsLoading(true);
      try {
        await onSignIn(email, password);
      } catch (error) {
        console.error('Sign in error:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log("UI: Sign In form submitted", { email });
    }
  };
  
  return (
    <form onSubmit={handleSignIn} autoComplete="on" className="flex flex-col gap-8">
      {/* ... rest of form ... *\/}
      <Button type="submit" variant="outline" className="mt-2" disabled={isLoading}>
        {isLoading ? 'Signing In...' : 'Sign In'}
      </Button>
    </form>
  );
}

// Modify SignUpForm similarly:
function SignUpForm({ onSignUp }: { onSignUp?: (name: string, email: string, password: string) => void | Promise<void> }) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    if (onSignUp) {
      setIsLoading(true);
      try {
        await onSignUp(name, email, password);
      } catch (error) {
        console.error('Sign up error:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log("UI: Sign Up form submitted", { name, email });
    }
  };
  
  return (
    <form onSubmit={handleSignUp} autoComplete="on" className="flex flex-col gap-8">
      {/* ... rest of form ... *\/}
      <Button type="submit" variant="outline" className="mt-2" disabled={isLoading}>
        {isLoading ? 'Creating Account...' : 'Sign Up'}
      </Button>
    </form>
  );
}

// Update AuthFormContainer to pass callbacks:
function AuthFormContainer({ 
  isSignIn, 
  onToggle, 
  callbacks 
}: { 
  isSignIn: boolean; 
  onToggle: () => void;
  callbacks?: AuthCallbacks;
}) {
  return (
    <div className="mx-auto grid w-[350px] gap-2">
      {isSignIn ? (
        <SignInForm onSignIn={callbacks?.onSignIn} />
      ) : (
        <SignUpForm onSignUp={callbacks?.onSignUp} />
      )}
      {/* ... rest of component ... *\/}
      <Button 
        variant="outline" 
        type="button" 
        onClick={callbacks?.onGoogleSignIn || (() => console.log("UI: Google button clicked"))}
      >
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google icon" className="mr-2 h-4 w-4" />
        Continue with Google
      </Button>
    </div>
  );
}

// Update AuthUI to accept and pass callbacks:
export interface AuthUIProps {
  signInContent?: AuthContentProps;
  signUpContent?: AuthContentProps;
  callbacks?: AuthCallbacks;
}

export function AuthUI({ signInContent = {}, signUpContent = {}, callbacks }: AuthUIProps) {
  // ... existing code ...
  
  return (
    <div className="w-full min-h-screen md:grid md:grid-cols-2">
      <div className="flex h-screen items-center justify-center p-6 md:h-auto md:p-0 md:py-12">
        <AuthFormContainer isSignIn={isSignIn} onToggle={toggleForm} callbacks={callbacks} />
      </div>
      {/* ... rest of component ... *\/}
    </div>
  );
}
*/

// =============================================================================
// USAGE WITH CALLBACKS
// =============================================================================

/*
export function AppWithCallbacks() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  const handleSignIn = async (email: string, password: string) => {
    console.log('Signing in:', email);
    // Add your authentication logic here
    // For demo purposes:
    setUsername(email.split('@')[0]);
    setIsAuthenticated(true);
  };

  const handleSignUp = async (name: string, email: string, password: string) => {
    console.log('Signing up:', name, email);
    // Add your registration logic here
    // For demo purposes:
    setUsername(email.split('@')[0]);
    setIsAuthenticated(true);
  };

  const handleGoogleSignIn = async () => {
    console.log('Google sign in clicked');
    // Add your Google OAuth logic here
  };

  if (!isAuthenticated) {
    return (
      <AuthUI 
        callbacks={{
          onSignIn: handleSignIn,
          onSignUp: handleSignUp,
          onGoogleSignIn: handleGoogleSignIn,
        }}
      />
    );
  }

  return <div>Welcome, {username}!</div>;
}
*/
