// Minimal shim to satisfy third-party d.ts that reference `react_jsx_runtime.JSX`.
// This avoids needing to relax skipLibCheck while keeping strict mode enabled.

declare namespace react_jsx_runtime {
  // Some third-party .d.ts files reference `react_jsx_runtime.JSX.Element`.
  // Provide a minimal nested namespace with the expected shape so they
  // compile under strict type checking.
  export namespace JSX {
    // Element is used as a type in several packages; keep it permissive.
    type Element = any;
    type ElementClass = any;
    interface IntrinsicElements {
      [key: string]: any;
    }
    interface IntrinsicAttributes {
      [key: string]: any;
    }
  }
}
