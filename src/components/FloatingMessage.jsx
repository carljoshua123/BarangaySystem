import React, { useEffect, useState } from 'react';
import { api } from '../api';
import SuccessToast from './SuccessToast';

export default function FloatingMessage() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return undefined;

    let active = true;
    const fetchMessages = async () => {
      try {
        const response = await api.get('/api/messages', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (active) {
          setMessages(response.data);
          setError('');
          setHasLoaded(true);
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError.response?.data?.error || 'Could not load your messages.');
          setHasLoaded(true);
        }
      }
    };

    fetchMessages();
    const refreshInterval = window.setInterval(fetchMessages, 10000);
    return () => {
      active = false;
      window.clearInterval(refreshInterval);
    };
  }, [open]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    setError('');
    try {
      const response = await api.post('/api/messages', { content: message.trim() }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessages((current) => [...current, response.data]);
      setMessage('');
      setToastMessage('Message sent successfully. The barangay office will reply here.');
    } catch (sendError) {
      setError(sendError.response?.data?.error || 'Could not send your message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="floating-message">
      <SuccessToast message={toastMessage} onClose={() => setToastMessage('')} />
      {open && (
        <section className="floating-message-panel" aria-labelledby="floating-message-title">
          <header>
            <div>
              <p>Barangay office</p>
              <h2 id="floating-message-title">Messages</h2>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close message panel">×</button>
          </header>
          <div className="floating-message-thread" aria-live="polite">
            {!hasLoaded ? (
              <p className="floating-message-empty">Loading conversation…</p>
            ) : messages.length === 0 ? (
              <p className="floating-message-empty">Send a message to start a conversation with the barangay office.</p>
            ) : messages.map((item) => (
              <article className={`floating-message-bubble floating-message-bubble--${item.senderRole}`} key={item._id}>
                <p>{item.content}</p>
                <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>
              </article>
            ))}
          </div>
          <form onSubmit={handleSubmit}>
            <label htmlFor="floating-message-body">Reply</label>
            <textarea
              id="floating-message-body"
              rows="4"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write a message..."
              required
            />
            {error && <p className="floating-message-error" role="alert">{error}</p>}
            <button type="submit" disabled={!message.trim() || sending}>{sending ? 'Sending…' : 'Send message'}</button>
          </form>
        </section>
      )}
      <button
        className="floating-message-trigger"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? 'Close message panel' : 'Open message panel'}
        aria-expanded={open}
        title="Message the barangay"
      >
        {open ? (
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v11H9l-5 3v-14Z" /><path d="M8 10h8M8 13.5h5" /></svg>
        )}
      </button>
    </div>
  );
}