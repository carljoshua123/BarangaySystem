import React, { useEffect, useState } from 'react';
import { api } from '../api';

const messageHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function AdminMessages() {
  const [conversations, setConversations] = useState([]);
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [selectedResident, setSelectedResident] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadedThreadId, setLoadedThreadId] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const fetchConversations = async () => {
      try {
        const response = await api.get('/api/messages/conversations', { headers: messageHeaders() });
        if (!active) return;
        setConversations(response.data);
        setSelectedResidentId((current) => current || response.data[0]?.resident?._id || '');
        setError('');
      } catch (fetchError) {
        if (active) setError(fetchError.response?.data?.error || 'Could not load conversations.');
      } finally {
        if (active) setLoadingList(false);
      }
    };

    fetchConversations();
    const refreshInterval = window.setInterval(fetchConversations, 10000);
    return () => {
      active = false;
      window.clearInterval(refreshInterval);
    };
  }, []);

  useEffect(() => {
    if (!selectedResidentId) return undefined;

    let active = true;
    const fetchThread = async () => {
      try {
        const response = await api.get(`/api/messages/conversations/${selectedResidentId}`, { headers: messageHeaders() });
        if (!active) return;
        setSelectedResident(response.data.resident);
        setMessages(response.data.messages);
        setLoadedThreadId(selectedResidentId);
        setError('');
      } catch (fetchError) {
        if (active) {
          setError(fetchError.response?.data?.error || 'Could not load this conversation.');
          setLoadedThreadId(selectedResidentId);
        }
      }
    };

    fetchThread();
    const refreshInterval = window.setInterval(fetchThread, 10000);
    return () => {
      active = false;
      window.clearInterval(refreshInterval);
    };
  }, [selectedResidentId]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !selectedResidentId || sending) return;

    setSending(true);
    setError('');
    try {
      const response = await api.post(
        `/api/messages/conversations/${selectedResidentId}`,
        { content: draft.trim() },
        { headers: messageHeaders() }
      );
      setMessages((current) => [...current, response.data]);
      setDraft('');
      const listResponse = await api.get('/api/messages/conversations', { headers: messageHeaders() });
      setConversations(listResponse.data);
    } catch (sendError) {
      setError(sendError.response?.data?.error || 'Could not send your reply.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-messenger">
      <header className="admin-messenger-header">
        <div>
          <p className="dashboard-kicker">Resident support</p>
          <h1>Messages</h1>
        </div>
        <p>{conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}</p>
      </header>

      <div className="admin-messenger-layout">
        <aside className="admin-conversation-list" aria-label="Resident conversations">
          <h2>Inbox</h2>
          {loadingList ? (
            <p className="admin-message-empty">Loading inbox…</p>
          ) : conversations.length === 0 ? (
            <p className="admin-message-empty">Resident messages will appear here.</p>
          ) : conversations.map((conversation) => {
            const residentId = conversation.resident?._id || conversation._id;
            return (
              <button
                type="button"
                className={`admin-conversation${selectedResidentId === residentId ? ' active' : ''}`}
                key={residentId}
                onClick={() => setSelectedResidentId(residentId)}
              >
                <span className="admin-conversation-avatar" aria-hidden="true">
                  {(conversation.resident?.fullName || 'R').slice(0, 1).toUpperCase()}
                </span>
                <span className="admin-conversation-copy">
                  <strong>{conversation.resident?.fullName || 'Resident'}</strong>
                  <small>{conversation.lastMessage}</small>
                  <time dateTime={conversation.lastMessageAt}>{new Date(conversation.lastMessageAt).toLocaleString()}</time>
                </span>
                {conversation.unreadCount > 0 && <span className="admin-conversation-unread">{conversation.unreadCount}</span>}
              </button>
            );
          })}
        </aside>

        <section className="admin-message-thread" aria-label="Selected conversation">
          {selectedResident ? (
            <>
              <header className="admin-thread-header">
                <div className="admin-conversation-avatar" aria-hidden="true">{selectedResident.fullName.slice(0, 1).toUpperCase()}</div>
                <div>
                  <h2>{selectedResident.fullName}</h2>
                  <p>{selectedResident.email}</p>
                </div>
              </header>
              <div className="admin-thread-messages" aria-live="polite">
                {loadedThreadId !== selectedResidentId ? (
                  <p className="admin-message-empty">Loading conversation…</p>
                ) : messages.map((message) => (
                  <article className={`admin-thread-bubble admin-thread-bubble--${message.senderRole}`} key={message._id}>
                    <p>{message.content}</p>
                    <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time>
                  </article>
                ))}
              </div>
              <form className="admin-thread-composer" onSubmit={handleSend}>
                <textarea
                  rows="2"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={`Reply to ${selectedResident.fullName}…`}
                  maxLength={4000}
                  required
                />
                <div>
                  <small>{draft.length}/4000</small>
                  <button type="submit" disabled={!draft.trim() || sending}>{sending ? 'Sending…' : 'Reply'}</button>
                </div>
              </form>
            </>
          ) : (
            <div className="admin-message-empty admin-message-empty--center">
              <span aria-hidden="true">✉</span>
              <p>Select a resident conversation to read and reply.</p>
            </div>
          )}
          {error && <p className="admin-message-error" role="alert">{error}</p>}
        </section>
      </div>
    </div>
  );
}