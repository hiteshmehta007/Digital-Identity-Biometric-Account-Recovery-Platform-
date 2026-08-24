import { useState, useEffect, useRef } from 'react';
import SignInCard from './SignInCard';

type Props = {
  className?: string;
  onSignedIn?: (user?: { name?: string; email?: string }) => void;
};

export default function SignInButton({ className, onSignedIn }: Props) {
  const [open, setOpen] = useState(false);
  // triggerRef was unused and caused a linter warning; removed
  const prevActiveRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // When modal opens, lock body scroll and focus first input; cleanup on close
  useEffect(() => {
    // open: save previously focused element so we can restore focus on close
    prevActiveRef.current = document.activeElement as HTMLElement | null;

    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // focus first input in the modal
    const timer = setTimeout(() => {
      const el = modalRef.current?.querySelector('.signin-modal input[type="text"]') as HTMLElement | null;
      if (el) el.focus();
    }, 50);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }
      // focus trap for Tab
      if (e.key === 'Tab') {
        const container = modalRef.current;
        if (!container) return;
        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute('disabled'));
        if (focusable.length === 0) return;
        const idx = focusable.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey) {
          // move backward
          const next = idx <= 0 ? focusable.length - 1 : idx - 1;
          const nextEl = focusable[next];
          if (nextEl) {
            nextEl.focus();
            e.preventDefault();
          }
        } else {
          const next = idx === -1 || idx === focusable.length - 1 ? 0 : idx + 1;
          const nextEl = focusable[next];
          if (nextEl) {
            nextEl.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prev;
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
      // restore focus to previously active element
      try {
        prevActiveRef.current?.focus();
      } catch (e) {
        // ignore
      }
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        data-slot="button"
        className={
          (className || '') +
          " inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-9 px-4 py-2 has-[&>svg]:px-3 border-teal-700 text-teal-700 hover:bg-teal-50"
        }
        onClick={(e) => {
          e.preventDefault();
          // debug: ensure the click handler runs
          // eslint-disable-next-line no-console
          console.debug('SignInButton clicked');
          setOpen(true);
        }}
        aria-haspopup="dialog"
      >
        Sign In
      </button>

      {open && (
        <div
          ref={modalRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signin-title"
        >
          <div className="w-full max-w-md p-4">
            <div className="bg-white rounded shadow-lg">
              <div className="p-4 signin-modal">
                <div className="flex justify-end">
                  <button
                    type="button"
                    aria-label="Close sign in dialog"
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setOpen(false)}
                  >
                    ×
                  </button>
                </div>
                <SignInCard
                  onSignedIn={(user) => {
                    setOpen(false);
                    onSignedIn?.(user);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
