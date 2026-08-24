# AuthUI Component Integration Guide

## ✅ Integration Complete

The `auth-fuse.tsx` component has been successfully integrated into your Nuvana Mail application.

## 📦 Dependencies Installed

The following dependencies are required and should be installed:

```bash
npm install clsx lucide-react tailwind-merge @radix-ui/react-slot @radix-ui/react-label class-variance-authority
```

**Note:** `lucide-react` is already used in your project, so it should already be installed.

## 📁 Files Created/Modified

### New Files:
- `/components/ui/auth-fuse.tsx` - Main authentication component
- `/components/AuthDemo.tsx` - Demo/example implementation
- `/AUTH_INTEGRATION.md` - This documentation

### Modified Files:
- `/styles/globals.css` - Updated theme variables for auth component compatibility

## 🎨 Theme Updates

The following CSS variables have been updated in `/styles/globals.css`:

```css
:root {
  --radius: 1rem;  /* Changed from 0.625rem for rounded corners */
  --accent: oklch(0.89 0 0);  /* Updated for better contrast */
  --destructive-foreground: oklch(0.985 0 0);  /* Updated for accessibility */
}

.dark {
  --background: oklch(0.125 0 0);  /* Slightly darker background */
  --accent: oklch(0.229 0 0);  /* Darker accent for dark mode */
  --destructive-foreground: oklch(0.985 0 0);  /* Consistent foreground */
}
```

## 🎯 Component Features

The `AuthUI` component includes:

1. **Sign In Form**
   - Email and password inputs
   - Password visibility toggle
   - Form validation
   - Google OAuth button

2. **Sign Up Form**
   - Full name, email, and password inputs
   - Password visibility toggle
   - Form validation
   - Google OAuth button

3. **Visual Elements**
   - Typewriter animation for quotes
   - Background images with gradient overlay
   - Responsive design (mobile & desktop)
   - Smooth transitions between sign in/sign up

4. **Customization**
   - Custom images for sign in/sign up
   - Custom quotes with authors
   - Branded with Nuvana Mail messaging

## 📖 Usage Examples

### Basic Usage

```tsx
import { AuthUI } from './components/ui/auth-fuse';

function App() {
  return <AuthUI />;
}
```

### Custom Content

```tsx
import { AuthUI } from './components/ui/auth-fuse';

function App() {
  return (
    <AuthUI 
      signInContent={{
        image: {
          src: "https://your-image-url.com/signin.jpg",
          alt: "Custom sign in image"
        },
        quote: {
          text: "Your custom sign in message",
          author: "Your Brand"
        }
      }}
      signUpContent={{
        image: {
          src: "https://your-image-url.com/signup.jpg",
          alt: "Custom sign up image"
        },
        quote: {
          text: "Your custom sign up message",
          author: "Your Brand"
        }
      }}
    />
  );
}
```

## 🔗 Integration with Nuvana Mail

### Option 1: Replace Onboarding Flow

Update `/App.tsx` to use AuthUI instead of OnboardingFlow:

```tsx
import { AuthUI } from './components/ui/auth-fuse';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  if (!isAuthenticated) {
    return <AuthUI />;
  }
  
  // ... rest of your email dashboard
}
```

### Option 2: Add Before Onboarding

Use AuthUI for returning users and OnboardingFlow for new users:

```tsx
import { AuthUI } from './components/ui/auth-fuse';
import { OnboardingFlow } from './components/OnboardingFlow';

export default function App() {
  const [authStep, setAuthStep] = useState<'login' | 'onboarding' | 'app'>('login');
  
  if (authStep === 'login') {
    return <AuthUI />;
  }
  
  if (authStep === 'onboarding') {
    return <OnboardingFlow onComplete={() => setAuthStep('app')} />;
  }
  
  // ... rest of your email dashboard
}
```

### Option 3: Demo Component

Use the pre-configured demo component:

```tsx
import { AuthDemo } from './components/AuthDemo';

export default function App() {
  return <AuthDemo />;
}
```

## 🔐 Adding Authentication Logic

To make the forms functional, update the form handlers in `/components/ui/auth-fuse.tsx`:

```tsx
// Sign In Handler
function SignInForm({ onSignIn }: { onSignIn?: (email: string, password: string) => void }) {
  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // Call your authentication logic here
    if (onSignIn) {
      onSignIn(email, password);
    }
  };
  // ... rest of component
}

// Sign Up Handler
function SignUpForm({ onSignUp }: { onSignUp?: (name: string, email: string, password: string) => void }) {
  const handleSignUp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // Call your registration logic here
    if (onSignUp) {
      onSignUp(name, email, password);
    }
  };
  // ... rest of component
}
```

## 🔌 Supabase Integration

To connect with Supabase authentication:

```tsx
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_KEY');

// In your sign in handler:
async function handleSignIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('Sign in error:', error);
    return;
  }
  
  // Handle successful sign in
  console.log('Signed in:', data);
}

// In your sign up handler:
async function handleSignUp(name: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      }
    }
  });
  
  if (error) {
    console.error('Sign up error:', error);
    return;
  }
  
  // Handle successful sign up
  console.log('Signed up:', data);
}

// For Google OAuth:
async function handleGoogleSignIn() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
}
```

## 🎨 Customization

### Change Images

The component uses Unsplash images by default:
- **Sign In**: Modern office workspace
- **Sign Up**: Colorful modern architecture

Replace these by passing custom `image` props to the component.

### Modify Quotes

Current quotes are branded for Nuvana Mail:
- **Sign In**: "Welcome back to Nuvana Mail. Your secure inbox awaits."
- **Sign Up**: "Create your secure email. A new chapter begins."

Customize by passing `quote` props to the component.

### Styling

The component uses Tailwind CSS and follows the design system in `/styles/globals.css`. You can:
- Modify theme variables for global changes
- Override classes in the component for specific changes
- Use the `className` prop on child components

## 📱 Responsive Behavior

- **Mobile**: Single column layout with form only
- **Desktop**: Two-column layout with form on left, image on right
- **Tablet**: Follows mobile layout for better UX

## 🧪 Testing

To test the component:

1. Navigate to the auth page in your app
2. Try toggling between Sign In and Sign Up
3. Test the password visibility toggle
4. Verify form validation
5. Check responsive behavior on different screen sizes
6. Test the typewriter animation

## 🐛 Troubleshooting

### Password visibility toggle not working
- Ensure `lucide-react` is installed
- Check that Eye/EyeOff icons are imported correctly

### Typewriter animation not starting
- Verify the component is receiving the `text` prop
- Check React state updates are working

### Styles not applying
- Ensure `/styles/globals.css` has been updated with theme variables
- Verify Tailwind CSS is configured correctly
- Check that the `@theme inline` section includes all required color variables

### Images not loading
- Check network connectivity
- Verify Unsplash URLs are accessible
- Consider using local images for production

## 🚀 Next Steps

1. Install required dependencies
2. Test the AuthUI component in isolation
3. Integrate with your authentication backend (Supabase recommended)
4. Add error handling and loading states
5. Implement password reset functionality
6. Add email verification flow
7. Connect to your Nuvana Mail app logic

## 📚 Related Components

- `/components/OnboardingFlow.tsx` - Original onboarding with username creation
- `/App.tsx` - Main application entry point
- `/components/SettingsPanel.tsx` - User settings and security options

## 💡 Best Practices

1. **Security**: Always hash passwords on the backend
2. **Validation**: Add client-side validation for better UX
3. **Error Handling**: Show user-friendly error messages
4. **Loading States**: Display loading indicators during auth requests
5. **Accessibility**: Ensure keyboard navigation works properly
6. **Session Management**: Implement secure session handling
7. **Rate Limiting**: Protect against brute force attacks
