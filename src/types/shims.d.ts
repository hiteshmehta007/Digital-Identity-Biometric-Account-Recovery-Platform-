// Fallback shims for packages that either don't have types installed yet
// Prefer installing proper @types or the package's own types. These
// are temporary developer helper declarations to silence editor errors.

declare module 'motion/react' {
  // Common exports used in this project
  export const motion: any;
  export const AnimatePresence: any;
  export function useScroll(): any;
  export function useTransform(...args: any[]): any;
  export default motion;
}

declare module 'react/jsx-runtime' {
  const jsx: any;
  export = jsx;
}

// NOTE: lucide-react types were intentionally removed from this shim so the
// project uses the library's real types. Keep other temporary shims below
// (e.g., for `motion/react` and `react/jsx-runtime`) and prefer installing
// proper type packages if any editor diagnostics appear.

