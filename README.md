
# Digital Identity Biometric Account Recovery Platform

## Overview

This repository is a front-end prototype for an identity recovery and account protection experience. The product story is built around a user who has lost access to an account and needs a secure, guided, and empathetic way to recover it. The project combines a polished product landing page, a 3-step onboarding flow, a face verification experience, a document upload/OCR stage, and a mock mailbox provisioning flow.

The code is intentionally designed as a concept demo, not a production identity platform. It demonstrates user flow, UX patterns, verification logic, and product positioning in a way that is realistic enough for product review but still clearly prototype-level from a security and architecture perspective.

## What is in this workspace

- Root app: [src/App.tsx](src/App.tsx)
- Onboarding flow: [src/components/onboarding/AccountCreationFlow.tsx](src/components/onboarding/AccountCreationFlow.tsx)
- Face verification stage: [src/components/onboarding/Stage2FaceVerification.tsx](src/components/onboarding/Stage2FaceVerification.tsx)
- Government ID OCR stage: [src/components/onboarding/Stage3DocumentUpload.tsx](src/components/onboarding/Stage3DocumentUpload.tsx)
- Success screen and QR generation: [src/components/onboarding/AccountCreatedSuccess.tsx](src/components/onboarding/AccountCreatedSuccess.tsx)
- Face model loader: [src/lib/faceapi-loader.ts](src/lib/faceapi-loader.ts)
- Mock backend: [server/provision-server.js](server/provision-server.js)

## Technical Implementation

### 7) Three-step onboarding flow in detail

The account creation flow is implemented in [src/components/onboarding/AccountCreationFlow.tsx](src/components/onboarding/AccountCreationFlow.tsx). It is a three-stage user journey with a progress bar.

1. Stage 1: Basic details
   - This is implemented in [src/components/onboarding/Stage1BasicDetails.tsx](src/components/onboarding/Stage1BasicDetails.tsx).
   - The user enters full name, DOB, email, phone, and password.
   - It validates the email against the demo domain pattern `@digitalidentity.mail` and enforces a minimum password strength threshold.
   - When valid, the form submits a `Stage1Data` object to `onNext` and moves to the next stage.

2. Stage 2: Face verification
   - This is implemented in [src/components/onboarding/Stage2FaceVerification.tsx](src/components/onboarding/Stage2FaceVerification.tsx).
   - The component loads `face-api.js` models from a CDN and then requests camera access using `getUserMedia`.
   - The app displays a live video stream and monitors the face with FaceAPI landmarks.
   - The user is guided through movement prompts such as center, left, right, and repeated center positions. The system checks for a face, whether eyes are open, distance quality, and lighting quality.
   - If the checks pass, the component captures a still image from the video stream and returns a `FaceVerificationResult` payload.

3. Stage 3: Government ID upload / OCR
   - This is implemented in [src/components/onboarding/Stage3DocumentUpload.tsx](src/components/onboarding/Stage3DocumentUpload.tsx).
   - The user uploads a passport, driver's license, national ID, or similar document image.
   - OCR is run via Tesseract.js, followed by heuristic extraction of fields such as name, DOB, document number, and document type.
   - The extracted summary is optionally encrypted in memory with Web Crypto (`AES-GCM`) and saved to a minimal verification summary object in `sessionStorage`.
   - After confirmation, the flow advances to the success screen.

There is no real backend identity store behind this flow. The app is front-end oriented and is intentionally simulating a verification experience rather than enforcing production-grade identity proofing.

### 8) Facial recognition library, model, or API used

The prototype uses `face-api.js`, specifically the browser-side models loaded via the `@vladmandic/face-api` package:

- `tinyFaceDetector`
- `faceLandmark68Net`
- `faceExpressionNet`

This choice is documented in [src/lib/faceapi-loader.ts](src/lib/faceapi-loader.ts). The model loader downloads the model files from an unpkg CDN:

```ts
const modelUrl = 'https://unpkg.com/@vladmandic/face-api@1.7.12/model/';
```

We chose this because it is easy to run in a browser demo, has a straightforward API for face detection and landmark analysis, and is a good fit for product prototypes and UX demos. It is not a production-grade biometric matching system.

### 9) Client side, server side, or third-party service?

This is currently client-side only. The face analysis runs in the browser using `face-api.js`, and the camera stream is fetched from the browser with `navigator.mediaDevices.getUserMedia()`.

This means:

- the detection is performed locally on the device
- the model is loaded in the browser
- the actual biometric matching logic is not a true identity match against a server-side database
- sensitive biometric data is not persisted to a backend by default

The code is closer to a UX prototype than a secure production verification service.

### 10) How a match is determined

There is no real biometric matching threshold in this prototype. Instead, the app uses a set of rule-based quality gates rather than a true face similarity computation.

Examples from [src/components/onboarding/Stage2FaceVerification.tsx](src/components/onboarding/Stage2FaceVerification.tsx):

- a face must be detected
- eyes must be open for a certain number of consecutive frames
- the user is guided through movement steps to confirm a live subject is present
- `distanceValid` and `lightingValid` are boolean checks
- `movementsCompleted` and `disclaimerAccepted` are also required

In other words, this is not matching against a stored biometric template. It is a liveness-style quality gating mechanism for a demo flow.

### 11) Format of the facial data stored

The current implementation stores a captured image in the browser as a data URL:

```ts
imageData: string;
```

This is exposed in the `FaceVerificationResult` interface in [src/components/onboarding/Stage2FaceVerification.tsx](src/components/onboarding/Stage2FaceVerification.tsx). The app does not generate or persist a true vector embedding, and it does not store a standardized biometric template.

The actual captured image is held in React state and can be reused in the UI, but there is no secure, server-side biometric database behind it.

### 12) Handling a false negative

A legitimate user who is not recognized is handled as a retry and guidance problem rather than as an automated fallback path.

Current behavior:

- the system asks the user to adjust lighting, keep their face in frame, and complete movement prompts
- it shows warnings such as eye closed, low lighting, or poor framing
- the user can retry the face verification step

This is a good UX pattern for a prototype, but it does not implement a production-quality recovery strategy for edge cases such as aging, severe lighting conditions, glasses, masks, or different camera setups.

### 13) Preventing spoofing

The design includes some anti-spoofing cues, but not robust anti-spoofing.

The current prototype tries to reduce photo/video spoofing by requiring:

- a live camera feed
- blinking/eye-open checks
- motion prompts and repeated center/left/right checks
- a face detection loop over multiple frames

This is a basic liveness check, not a reliable anti-spoofing system. It is not equivalent to passive liveness detection, 3D face depth analysis, challenge-response detection, or secure hardware-backed verification.

### 14) Government ID linkage in technical terms

The government ID flow in [src/components/onboarding/Stage3DocumentUpload.tsx](src/components/onboarding/Stage3DocumentUpload.tsx) performs OCR and heuristic extraction, not true identity verification.

The code uses Tesseract.js:

```ts
const t = await import('tesseract.js');
const worker = await createWorkerFn({ logger: ... });
const { data } = await worker.recognize(imgData);
```

Then it uses regex-based heuristics to extract fields such as:

- fullName
- dob
- docNumber
- address
- issuingAuthority
- docType

This is a prototype OCR layer. It does not call a government or third-party verification API, and it does not validate the document against a live authority or cryptographic document credential.

### 15) ID authenticity validation

The prototype does not validate true identity authenticity. It accepts the document as user-provided input and then runs OCR to extract structured data. There is no:

- MRZ validation
- NFC chip verification
- document checksum checking
- government API cross-check
- cryptographic signature validation

A realistic production system would require stronger document verification and authenticity checks.

### 16) Data structure linking account to facial data and ID record

The main account flow is managed with React state in [src/components/onboarding/AccountCreationFlow.tsx](src/components/onboarding/AccountCreationFlow.tsx):

```ts
const [stage1Data, setStage1Data] = useState<Stage1Data | null>(null);
const [stage2Data, setStage2Data] = useState<FaceVerificationResult | null>(null);
```

The relevant interfaces are:

```ts
export interface Stage1Data {
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  password: string;
}

export interface FaceVerificationResult {
  movementsCompleted: boolean;
  distanceValid: boolean;
  lightingValid: boolean;
  disclaimerAccepted: boolean;
  imageData: string;
}
```

There is no actual relational schema or database join in the prototype. In production, the linkage would be a server-side identity record keyed by user ID, with separate secure tables for:

- user profile
- biometric template or embedding
- identity document metadata
- verification events
- recovery attempts

### 17) QR code generation

The QR code is generated with the `react-qr-code` library in [src/components/onboarding/AccountCreatedSuccess.tsx](src/components/onboarding/AccountCreatedSuccess.tsx):

```tsx
<QRCode id="qr-code" value={JSON.stringify(payload)} size={200} level="H" />
```

The QR payload is a JSON blob containing:

- service
- email
- fullName
- identityCode
- created timestamp
- verification summary
- summaryText

This is a convenience for a prototype identity or service link, not a cryptographically secure verification token.

### 18) Is the QR code signed or encrypted?

No. The QR payload is plain JSON text encoded into the QR code. There is no signature, no HMAC, and no encryption in the QR itself.

The only encryption in the prototype is the in-memory OCR summary encryption using Web Crypto (`AES-GCM`) for local handling of extracted document fields, not for the QR code payload itself.

### 19) How a fraudulent QR could be generated

Because the code is plain text and unsigned, anyone could generate a QR with someone else’s metadata if they knew the format. The current prototype does not prevent this because:

- there is no server-side verification step
- there is no signed identity token
- there is no cryptographic binding between the QR payload and a trusted identity record

Production systems would require signed tokens or server-issued challenge/response data.

### 20) Backend identity-linking logic beyond frontend

The repository includes a mock backend: [server/provision-server.js](server/provision-server.js).

The actual endpoints defined are:

- `POST /api/provision-mailbox`
- `GET /api/debug/mailboxes`
- `GET /api/debug/emails`

The `POST /api/provision-mailbox` endpoint accepts an email and full name, writes a mailbox record to JSON, creates a welcome email, and issues a demo token:

```js
res.json({ ok: true, token, redirectUrl: 'http://localhost:3000/email/inbox', mailboxId: id });
```

This is not a real identity-linking backend. It is a mock provisioning service for email access and demo flow behavior.

### 21) API contract between frontend and backend

The actual contract is minimal and intentionally simple.

Request:

```json
{
  "email": "name@digitalidentity.mail",
  "fullName": "Jane Doe"
}
```

Response:

```json
{
  "ok": true,
  "token": "random-hex-token",
  "redirectUrl": "http://localhost:3000/email/inbox",
  "mailboxId": "generated-id"
}
```

The prototype does not have a real API contract for identity verification or account recovery. The verification data is mostly local and session-scoped, not uploaded to a real server.

### 22) Concurrent recovery attempts on the same account

This is not implemented in the prototype. There is no locking, queueing, or per-account state machine for recovery attempts.

In production, you would need:

- per-account recovery lock
- idempotent recovery requests
- audit timestamps
- risk scoring and attempt counting
- rate-limited waiting windows

### 23) What if the facial verification service is down or slow?

The current app does not implement a real fallback or timeout strategy beyond user-facing error messages when model loading fails or camera access is denied.

Examples:

- if the FaceAPI model fails to load, the app surfaces an error
- if the camera is denied or not available, it shows a direct message
- there is no backend retry, circuit breaker, or fallback provider

This is acceptable for a demo, but not for a production recovery system.

### 24) Rate-limiting on recovery attempts

There is no rate-limiting or brute-force protection in the current implementation.

This is a major limitation because recovery flows are high-risk, and repeated attempts can escalate into fraud or account takeover investigation patterns. A production version would introduce:

- per-user attempt quotas
- exponential backoff
- CAPTCHA or challenge flows
- risk-based step-up verification
- monitoring and alerting for repeated attempts

## Security & Privacy

### 25) Privacy and compliance considerations

Biometric data is highly sensitive personal data and should be treated as such. This project explicitly frames privacy as a core value, but it does not implement a full GDPR-style or privacy-compliance architecture.

The current prototype is better described as privacy-aware than privacy-compliant.

It does not yet include:

- clear informed consent language
- retention/expiry policies
- lawful basis documentation
- data subject request workflows
- deletion or portability mechanisms
- region-aware storage rules

### 26) Where facial data is stored and whether it is encrypted at rest

In this prototype, facial data is primarily held in browser memory and session state. The face capture result is stored in React state and may also be written into `sessionStorage` in a minimal verification summary.

There is in-memory encryption using Web Crypto for extracted ID data, but the app is not persisting a secure biometric database. There is no strong at-rest encryption model or key management infrastructure.

### 27) If the database were breached, what is exposed?

A leaked password hash is bad, but a leaked biometric template or raw face image is significantly worse because biometric data is not replaceable. A person cannot easily “reset” their face the way they can reset a password.

In this prototype, a breach would expose:

- user email and full name
- uploaded document metadata
- OCR-extracted document fields
- captured face image or similar data if stored in a client-side session or future database

This is significantly more sensitive and more difficult to remediate than a password hash leak.

### 28) Raw images vs embeddings

The current prototype stores raw captured image data as a data URL. It does not create a derived face embedding or biometric template.

This matters because:

- raw images are more sensitive and more difficult to minimize
- embeddings are smaller and can be more privacy-preserving if handled properly
- embeddings are still sensitive but are more suitable for structured comparison tasks

A production system should prefer storing only a derived representation when possible, with careful encryption, access control, and policy boundaries.

### 29) User consent for biometric data collection

There is a disclaimer acceptance state in the face verification flow, and the user must allow camera access. That is a helpful UX cue, but this is not a legal or compliance-grade consent system.

In production, consent should include:

- explicitly stated purpose
- clear explanation of what is collected and why
- storage duration and retention details
- ability to revoke or delete biometric data
- separate policy and support contact

### 30) Session or token handling after successful verification

The project does not implement a full secure authentication or session model after verification.

The nearest real implementation is the mock provisioning server in [server/provision-server.js](server/provision-server.js), which issues a token for the mailbox provision flow:

```js
const token = crypto.randomBytes(24).toString('hex');
```

This is a demo token, not a secure JWT/OAuth session. The success flow does not issue a production-grade session or auth cookie following face verification. It simply moves the user into a success state.

### 31) Auditing and logging recovery attempts

There is no meaningful audit trail in the prototype. No attempt logs, no event IDs, no correlation identifiers, and no security monitoring hooks are present.

A production account recovery system would log:

- time of attempt
- user id or reference
- verification channel
- outcome and reason
- device/environment metadata
- risk score
- analyst actions

This is required for fraud investigation, compliance, and secure operations.

## Architecture, Trade-offs & Scale

### 32) If this had to scale to 1 million users, what would break first?

The first thing that would break is not the landing page; it would be the lack of a real backend identity infrastructure.

The current bottlenecks are:

- browser-side face detection only
- CDN model loading dependency
- no server-side verification and storage
- no concurrency control or rate limiting
- no real biometric database or key management

At scale, the system would also need secure identity services, backend APIs, and cloud infrastructure designed for low latency and high availability.

### 33) Why separate facial recognition OR government ID paths rather than requiring both?

This is a deliberate product design choice to reduce friction and to model recovery paths that are useful in different situations.

The idea is that users may not always have both a suitable ID and a face that is easy to verify in the moment. A better production system would usually treat these as separate signals that can be combined with risk scoring rather than as absolute independent requirements.

In a real deployment, multi-factor proofing is usually stronger when both are strongly validated and combined with additional trust signals.

### 34) Typical latency and whether it is acceptable at scale

For a browser-based demo, the pipeline can take several seconds because models must be downloaded and the camera detection loop runs continuously. The actual latency depends on the device, browser, and network connection.

For a prototype, this is acceptable. For scale and real-world account recovery workflows, the latency would need to be carefully managed with:

- optimized model loading
- server-side verification service
- better device handling and timeout policies
- fallback paths for slow or unsupported hardware

### 35) Supporting recovery on devices with no camera

This would require a different recovery journey. An alternative design would use:

- trusted device QR challenge
- email or SMS one-time code
- strong knowledge-based recovery with monitored fallback
- assisted human verification with a call center or branch workflow
- secure kiosk-based verification with a dedicated camera module

The key principle is that the system should not rely on live camera capture when the device or environment cannot support it safely.

### 36) Monitoring and alerting before production

A production readiness checklist would include:

- latency and error monitoring for camera access, OCR, and model loading
- fraud detection dashboards for repeated recovery attempts
- alerting on suspicious spikes in failed verifications
- end-to-end tracing across account recovery events
- security logs for administrator review
- health checks for external services and model endpoints

### 37) Biggest technical risk today

The single biggest technical risk is that the prototype is not a truly secure identity proofing system. The face verification and document review are convincingly designed, but the actual system does not verify authenticity, does not maintain reliable audit records, and does not provide secure biometric storage.

This means the product could look convincing but still be easy to bypass or mis-handle in real life.

### 38) What would be done differently from scratch

If the project started again, the main design changes would be:

- use a real backend identity service with a proper schema
- store only secure, encrypted derived biometric data
- use a trusted document verification provider or real OCR + document authenticity pipeline
- add signed identity tokens for QR and recovery flows
- implement rate limiting, recovery lockouts, and audit logs
- rely on risk-based, multi-step verification rather than a single local browser check

### 39) What is missing from a production identity platform

A production-grade identity platform would need much more than this prototype includes:

- secure biometric storage with encryption at rest and in transit
- KMS and key rotation
- detailed consent UX and legal/privacy review
- document authenticity validation
- server-side verification APIs and signed tokens
- fraud/risk scoring and anomaly detection
- admin audit trails and incident response workflows
- account recovery lock, retry policy, and anti-abuse controls
- compliance review for biometric personal-data handling

## Summary

This project is best understood as a user-centric identity recovery concept, not as a production biometric platform. It demonstrates the look, flow, and emotional tone of a secure recovery experience while deliberately skipping the deeper backend security and governance needed for real-world deployment.

The value of the repository is in its product storytelling, UX clarity, and front-end prototype behavior. The biggest gap is that real identity verification requires a much stricter technical, legal, and operational foundation than what is currently implemented here.

## Quick project commands

```bash
npm install
npm run dev
npm run build
```

For the mock backend:

```bash
node server/provision-server.js
```

## Key implementation files

- [src/App.tsx](src/App.tsx)
- [src/components/onboarding/AccountCreationFlow.tsx](src/components/onboarding/AccountCreationFlow.tsx)
- [src/components/onboarding/Stage1BasicDetails.tsx](src/components/onboarding/Stage1BasicDetails.tsx)
- [src/components/onboarding/Stage2FaceVerification.tsx](src/components/onboarding/Stage2FaceVerification.tsx)
- [src/components/onboarding/Stage3DocumentUpload.tsx](src/components/onboarding/Stage3DocumentUpload.tsx)
- [src/components/onboarding/AccountCreatedSuccess.tsx](src/components/onboarding/AccountCreatedSuccess.tsx)
- [src/lib/faceapi-loader.ts](src/lib/faceapi-loader.ts)
- [server/provision-server.js](server/provision-server.js)

## License and origin

This project was assembled as a front-end design and product prototype and is intended for educational and demonstration purposes. The original design references are contained within the project context and are not treated as production-ready implementation contracts.
