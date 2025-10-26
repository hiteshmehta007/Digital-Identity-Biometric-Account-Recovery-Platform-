PR Summary — Standardize lucide imports & tighten TypeScript (phase 1)

Why
- The repo had a mix of temporary shims and import inconsistencies for `lucide-react` and a relaxed TypeScript configuration.
- The goal of this phase was to: (A) cross-check all lucide icon imports against the installed package and (C) raise TypeScript strictness for the repo while avoiding being blocked by third-party d.ts conflicts.

What I changed
- Verified the installed `lucide-react` exports and compared them to all import sites in `src`.
  - All imported symbols are present in the installed package; no automatic rename/patch was required.
- Fixed small project-level strict-mode issues that were surfaced by enabling `strict` flags:
  - `src/components/onboarding/Stage2FaceVerification.tsx`
    - Defensive guards in `calculateBrightness` to avoid indexed access undefined warnings.
    - Replaced/ensured used lucide icons are imported (`Info` present), and minor unused-local references handled.
  - `src/components/onboarding/Stage1BasicDetails.tsx`
    - Removed unused `Progress` import.
  - `src/components/onboarding/AccountCreationFlow.tsx`
    - Added a `void stage2Data;` no-op reference to avoid `noUnusedLocals` while preserving the state for future stages.
- Type declarations / toolchain:
  - Added `src/types/react-jsx-runtime.d.ts` — a minimal ambient shim exposing `react_jsx_runtime.JSX` to satisfy third-party d.ts that reference `react_jsx_runtime.JSX.Element` (radix/framer-motion interop).
  - Installed `@types/lodash` (devDependency) to satisfy Recharts type imports.
  - Kept `skipLibCheck: true` in `tsconfig.json` as an explicit, intentional dev safeguard while we fix transitive type conflicts in a follow-up pass.
- Added an npm script: `npm run typecheck` (runs `tsc --noEmit`) to make it easy to re-run the type check locally.

Files changed (high-level)
- Edited
  - `src/components/onboarding/Stage2FaceVerification.tsx` — brightness guard & small strict-related fixes
  - `src/components/onboarding/Stage1BasicDetails.tsx` — removed unused import
  - `src/components/onboarding/AccountCreationFlow.tsx` — touched to silence unused-local
  - `package.json` — added `typecheck` script
- Added
  - `src/types/react-jsx-runtime.d.ts` — tiny ambient shim
  - `scripts/generate-lucide-map.cjs`, `scripts/check-lucide-imports.cjs`, `scripts/check-lucide-require.cjs` — helper scripts used to validate lucide imports/exports
  - `.lucide_exports.txt`, `.lucide_map.json`, `.lucide_missing.json`, `.lucide_require_report.json` — diagnostic artifacts created during the cross-check

Why `skipLibCheck: true` is retained for now
- Enabling full library type-checking exposed transitive, third-party type conflicts (duplicate WebGL2 declarations and `react_jsx_runtime` shape mismatches across packages).
- Fixing those robustly requires a separate dependency-typing cleanup (bumping/downgrading specific packages, adding curated shims, or upstream fixes). That's a follow-up task.
- Keeping `skipLibCheck: true` preserves strict checks for your project code and avoids being blocked by transitive issues.

How I validated
- Ran `npm install` then `npx tsc --noEmit` (and `npm run typecheck`) — type-check completes successfully with current config (strict flags enabled, skipLibCheck true).
- Ran runtime check against installed `lucide-react` module to confirm every imported icon exists on the module.

How to review / run locally
1. Install deps

```powershell
npm install
```

2. Run the stricter type-check (already configured):

```powershell
npm run typecheck
```

3. If you want to re-run the lucide export check (diagnostic helpers):

```powershell
node scripts/check-lucide-require.cjs
node scripts/check-lucide-imports.cjs
# results are written to .lucide_require_report.json and .lucide_missing.json
```

Follow-ups (recommended next PR)
- Full library-typing cleanup to remove `skipLibCheck`:
  - Triage and fix transitive type conflicts (tfjs/webgl2, framer-motion, radix, etc.).
  - Consider specific dependency upgrades or small curated shims (document each change).
- Optional: convert the diagnostic scripts into a developer tool (npm script) and remove generated artifact files from the repo or add them to .gitignore.

If you'd like, I can prepare the follow-up plan and execute the first pass (identify a minimal set of package upgrades or shims to remove skipLibCheck safely).