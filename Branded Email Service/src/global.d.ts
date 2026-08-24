declare module '*.css';
declare module '*.scss';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
// If you still have imports that include version suffixes (e.g. "lucide-react@0.487.0"),
// prefer updating the imports to the plain package name (e.g. "lucide-react").
//
// The project uses Vite aliases in `vite.config.ts` to map these legacy specifiers during
// bundling, but TypeScript doesn't understand those aliases by default. Keep file-type
// module declarations here to silence language-server errors for assets and CSS.
