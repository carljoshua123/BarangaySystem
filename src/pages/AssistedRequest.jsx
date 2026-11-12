import React, { useState } from 'react';
import { api } from '../api';
import SuccessToast from '../components/SuccessToast';
import { requestTypes } from '../requestTypes';

const emptyForm = {
  fullName: '',
  address: '',
  contact: '',
  dateNeeded: '',
  pickupRequired: false,
  purpose: '',
  notes: ''
};

export default function AssistedRequest({ residents, onRequestCreated }) {
  const [residentId, setResidentId] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [details, setDetails] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState('');

  const handleResidentChange = (event) => {
    const nextResidentId = event.target.value;
    const resident = residents.find((item) => item._id === nextResidentId);
    setResidentId(nextResidentId);
    setFormData((current) => ({ ...current, fullName: resident?.fullName || '' }));
    setToastMessage('');
    setError('');
  };

  const handleRequestChange = (event) => {
    const request = requestTypes.find((item) => item.title === event.target.value) || null;
    setSelectedRequest(request);
    setDetails({});
    setFormData((current) => ({ ...current, purpose: '' }));
    setToastMessage('');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedRequest) return;

    setSubmitting(true);
    setToastMessage('');
    setError('');
    try {
      const response = await api.post('/api/requests', {
        ...(residentId && { residentId }),
        requestType: selectedRequest.title,
        ...formData,
        purpose: formData.purpose || '',
        details,
        notes: formData.notes || ''
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      onRequestCreated(response.data.request);
      setToastMessage(`Request submitted for ${formData.fullName}.`);
      setSelectedRequest(null);
      setDetails({});
      setFormData((current) => ({ ...emptyForm, fullName: current.fullName }));
    } catch (submitError) {
      setError(submitError.response?.data?.error || 'Could not submit the assisted request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-workspace assisted-request-page">
      <section className="workspace-section">
        <div className="section-heading">
          <div>
            <p className="welcome-kicker">In-person resident support</p>
            <h2>Create an Assisted Request</h2>
            <p className="assisted-request-intro">Record a service request for a resident who needs help using the online system.</p>
          </div>
        </div>

        <SuccessToast message={toastMessage} onClose={() => setToastMessage('')} />
        {error && <div className="alert alert-danger" role="alert">{error}</div>}

        <form className="assisted-request-form" onSubmit={handleSubmit}>
          <div className="request-form-grid">
            <label className="request-form-field">
              <span>Resident account (optional)</span>
              <select value={residentId} onChange={handleResidentChange}>
                <option value="">No resident account (walk-in)</option>
                {residents.map((resident) => (
                  <option key={resident._id} value={resident._id}>
                    {resident.fullName} · {resident.email} · {resident.status}
                  </option>
                ))}
              </select>
            </label>

            <label className="request-form-field">
              <span>Request type</span>
              <select value={selectedRequest?.title || ''} onChange={handleRequestChange} required>
                <option value="">Choose a service</option>
                {requestTypes.map((request) => <option key={request.title} value={request.title}>{request.title}</option>)}
              </select>
            </label>

            <label className="request-form-field">
              <span>Requester full name</span>
              <input
                value={formData.fullName}
                onChange={(event) => setFormData((current) => ({ ...current, fullName: event.target.value }))}
                required
              />
            </label>

            <label className="request-form-field">
              <span>Address</span>
              <input
                value={formData.address}
                onChange={(event) => setFormData((current) => ({ ...current, address: event.target.value }))}
                required
              />
            </label>

            <label className="request-form-field">
              <span>Contact number</span>
              <input
                type="tel"
                value={formData.contact}
                onChange={(event) => setFormData((current) => ({ ...current, contact: event.target.value }))}
                required
              />
            </label>

            <label className="request-form-field">
              <span>Date needed</span>
              <input
                type="date"
                value={formData.dateNeeded}
                onChange={(event) => setFormData((current) => ({ ...current, dateNeeded: event.target.value }))}
                required
              />
            </label>
          </div>

          <label className="request-form-field request-form-checkbox">
            <span className="request-checkbox-row">
              <input
                type="checkbox"
                checked={formData.pickupRequired}
                onChange={(event) => setFormData((current) => ({ ...current, pickupRequired: event.target.checked }))}
              />
              <span>I will pick up the printed document at the barangay</span>
            </span>
            <small>Leave unchecked if the resident can print the released document at home.</small>
          </label>

          {selectedRequest?.fields.map((field) => (
            <label key={field.name} className={`request-form-field${field.type === 'checkbox' ? ' request-form-checkbox' : ''}`}>
              {field.type === 'checkbox' ? (
                <span className="request-checkbox-row">
                  <input
                    type="checkbox"
                    checked={Boolean(details[field.name])}
                    onChange={(event) => setDetails((current) => ({ ...current, [field.name]: event.target.checked }))}
                    required
                  />
                  <span>{field.label}</span>
                </span>
              ) : (
                <>
                  <span>{field.label}</span>
                  {field.type === 'select' ? (
                    <select
                      value={details[field.name] || ''}
                      onChange={(event) => setDetails((current) => ({ ...current, [field.name]: event.target.value }))}
                      required
                    >
                      <option value="">Select {field.label.toLowerCase()}</option>
                      {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      rows="4"
                      value={details[field.name] || ''}
                      onChange={(event) => setDetails((current) => ({ ...current, [field.name]: event.target.value }))}
                      required
                    />
                  ) : (
                    <input
                      type={field.type || 'text'}
                      min={field.min}
                      value={details[field.name] || ''}
                      onChange={(event) => setDetails((current) => ({ ...current, [field.name]: event.target.value }))}
                      placeholder={field.placeholder || ''}
                      required
                    />
                  )}
                </>
              )}
            </label>
          ))}

          {selectedRequest?.purposeRequired && (
            <label className="request-form-field">
              <span>Purpose / reason</span>
              <textarea
                rows="3"
                value={formData.purpose}
                onChange={(event) => setFormData((current) => ({ ...current, purpose: event.target.value }))}
                required
              />
            </label>
          )}

          <label className="request-form-field">
            <span>Additional information</span>
            <textarea
              rows="3"
              value={formData.notes}
              onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
            />
          </label>

          <div className="request-actions">
            <button type="submit" className="primary-btn" disabled={submitting || residents.length === 0}>
              {submitting ? 'Submitting…' : 'Submit request for resident'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}