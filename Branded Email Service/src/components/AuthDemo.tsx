import { AuthUI } from './ui/auth-fuse';

/**
 * Demo component showing how to use the AuthUI component in Nuvana Mail
 * 
 * This can be used as:
 * 1. A standalone login page before the onboarding flow
 * 2. An alternative to the existing OnboardingFlow component
 * 3. A login screen for returning users
 * 
 * To integrate into App.tsx:
 * - Replace or add before the OnboardingFlow component
 * - Handle authentication logic in the form submit handlers
 * - Connect to Supabase or your backend authentication system
 */
export function AuthDemo() {
  return (
    <AuthUI 
      signInContent={{
        quote: {
          text: "Welcome back to Nuvana Mail. Your secure inbox awaits.",
          author: "Nuvana Mail Team"
        }
      }}
      signUpContent={{
        quote: {
          text: "Join Nuvana Mail. Experience secure, encrypted communication.",
          author: "Nuvana Mail Team"
        }
      }}
    />
  );
}
