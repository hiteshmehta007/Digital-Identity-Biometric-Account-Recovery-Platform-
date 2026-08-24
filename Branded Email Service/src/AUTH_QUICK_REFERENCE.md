# 🚀 AuthUI Quick Reference Card

## Installation (One Command)
```bash
npm install clsx tailwind-merge @radix-ui/react-slot @radix-ui/react-label class-variance-authority
```

## Basic Usage
```tsx
import { AuthUI } from './components/ui/auth-fuse';

function App() {
  return <AuthUI />;
}
```

## Custom Content
```tsx
<AuthUI 
  signInContent={{
    image: { src: "url", alt: "description" },
    quote: { text: "message", author: "name" }
  }}
  signUpContent={{
    image: { src: "url", alt: "description" },
    quote: { text: "message", author: "name" }
  }}
/>
```

## Files Created
- `/components/ui/auth-fuse.tsx` - Main component
- `/components/AuthDemo.tsx` - Demo component
- `/AUTH_INTEGRATION.md` - Full documentation
- `/INTEGRATION_EXAMPLES.tsx` - Code examples
- `/INSTALLATION_GUIDE.md` - Setup guide

## Files Modified
- `/styles/globals.css` - Theme variables updated

## Testing
```tsx
// Quick test in App.tsx
import { AuthDemo } from './components/AuthDemo';
export default function App() {
  return <AuthDemo />;
}
```

## Features
- ✅ Sign In / Sign Up forms
- ✅ Password visibility toggle
- ✅ Typewriter animation
- ✅ Background images
- ✅ Google OAuth button
- ✅ Fully responsive
- ✅ Dark mode support
- ✅ Accessible (WCAG compliant)

## Form Handlers (Currently)
- Sign In: Logs to console
- Sign Up: Logs to console  
- Google: Logs to console

## Next Steps
1. Install dependencies
2. Test with `<AuthDemo />`
3. Add real auth logic
4. Customize branding

## Supabase Integration
```bash
npm install @supabase/supabase-js
```

See `/INTEGRATION_EXAMPLES.tsx` for full code.

## Background Images (Default)
- **Sign In**: Modern office workspace (Unsplash)
- **Sign Up**: Colorful architecture (Unsplash)

## Default Quotes
- **Sign In**: "Welcome back to Nuvana Mail. Your secure inbox awaits."
- **Sign Up**: "Create your secure email. A new chapter begins."

## Troubleshooting
| Issue | Fix |
|-------|-----|
| Missing dependencies | Run `npm install` |
| Icons not showing | Install `lucide-react` |
| Styles broken | Check `/styles/globals.css` |
| Forms don't work | Add auth logic (see docs) |

## Documentation Priority
1. 📖 **INSTALLATION_GUIDE.md** - Start here
2. 📘 **AUTH_INTEGRATION.md** - Detailed guide
3. 💻 **INTEGRATION_EXAMPLES.tsx** - Code samples
4. 📝 **AUTH_QUICK_REFERENCE.md** - This file

---

**Ready to use! Install dependencies and test with `<AuthDemo />` 🎉**
