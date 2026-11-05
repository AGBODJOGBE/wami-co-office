"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * Fenêtre modale basée sur l'élément natif <dialog> (focus, Échap et
 * arrière-plan inerte gérés par le navigateur).
 */
export function Dialog({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-[min(520px,calc(100vw-32px))] rounded-2xl border border-line bg-white p-0 text-ink backdrop:bg-night/40"
    >
      {open ? (
        <div className="flex flex-col gap-4 p-5">
          <h2 id={titleId} className="text-base font-bold">
            {title}
          </h2>
          <div className="flex flex-col gap-3">{children}</div>
          {footer ? <div className="flex flex-wrap justify-end gap-2">{footer}</div> : null}
        </div>
      ) : null}
    </dialog>
  );
}
