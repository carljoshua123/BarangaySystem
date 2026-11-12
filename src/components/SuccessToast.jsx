import React, { useEffect } from 'react';

export default function SuccessToast({ message, onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timeout = window.setTimeout(onClose, 4500);
    return () => window.clearTimeout(timeout);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="success-toast" role="status" aria-live="polite">
      <span className="success-toast-icon" aria-hidden="true">✓</span>
      <div>
        <strong>Success</strong>
        <p>{message}</p>
      </div>
      <button type="button" onClick={onClose} aria-label="Dismiss success message">×</button>
    </div>
  );
}