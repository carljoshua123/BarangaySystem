import React, { useEffect, useState } from 'react';
import { api } from '../api';
import RequestDocument from '../components/RequestDocument';
import SuccessToast from '../components/SuccessToast';
import { requestTypes } from '../requestTypes';

export default function RequestPage() {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [details, setDetails] = useState({});
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    contact: '',
    purpose: '',
    dateNeeded: '',
    pickupRequired: false,
    notes: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [requests, setRequests] = useState([]);
  const [viewingRequest, setViewingRequest] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await api.get('/api/requests', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setRequests(response.data);
      } catch (error) {
        console.error('Failed to load resident requests.', error);
      }
    };

    fetchRequests();
    const refreshInterval = window.setInterval(fetchRequests, 10000);
    return () => window.clearInterval(refreshInterval);
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedRequest) return;

    try {
      const payload = {
        requestType: selectedRequest.title,
        fullName: formData.fullName,
        address: formData.address,
        contact: formData.contact,
        dateNeeded: formData.dateNeeded,
        pickupRequired: formData.pickupRequired,
        purpose: formData.purpose,
        details,
        notes: formData.notes
      };

      const response = await api.post('/api/requests', payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setRequests((current) => [response.data.request, ...current]);
      setSubmitted(true);
      setToastMessage('Request submitted successfully. You can follow its status in History.');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to submit request.');
    }
  };

  return (
    <div className="public-page">
      <SuccessToast message={toastMessage} onClose={() => setToastMessage('')} />
      <section className="page-header">
        <p className="eyebrow">Barangay services</p>
        <h1>Request &amp; Clearance</h1>
      </section>

      <section className="request-panel">
        <div className="request-header">
          <p className="eyebrow">Resident services</p>
          <h2>Common Types of Requests &amp; Clearances</h2>
        </div>

        <div className="request-dropdown-wrapper">
          <label className="request-dropdown-label" htmlFor="barangay-request-select">
            Select a request type
          </label>
          <select
            id="barangay-request-select"
            className="request-dropdown"
            value={selectedRequest ? selectedRequest.title : ''}
            onChange={(event) => {
              const choice = requestTypes.find((item) => item.title === event.target.value);
              setSelectedRequest(choice || null);
              setDetails({});
              setSubmitted(false);
            }}
          >
            <option value="">Choose a request...</option>
            {requestTypes.map((item) => (
              <option key={item.title} value={item.title}>
                {item.title}
              </option>
            ))}
          </select>
        </div>

        {selectedRequest && !submitted && (
          <div className="request-form-panel">
            <div className="request-header">
              <p className="eyebrow">Selected request</p>
              <h2>{selectedRequest.title}</h2>
            </div>

            <button
              type="button"
              className="secondary-btn request-back-btn"
              onClick={() => {
                setSelectedRequest(null);
                setDetails({});
                setSubmitted(false);
              }}
            >
              ← Choose another request
            </button>

            <form className="request-form" onSubmit={handleSubmit}>
              <div className="request-form-grid">
                <label className="request-form-field">
                  <span>{selectedRequest.title === 'Barangay Certificate of Residency' ? 'Full Name of Resident' : 'Full Name'}</span>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                  />
                </label>

                <label className="request-form-field">
                  <span>{selectedRequest.title === 'Barangay Certificate of Residency' ? 'House No., Street, Purok/Zone' : 'Address'}</span>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder={selectedRequest.title === 'Barangay Certificate of Residency' ? 'Enter house number, street, and purok/zone' : 'House no., street, purok'}
                    required
                  />
                </label>

                <label className="request-form-field">
                  <span>Contact Number</span>
                  <input
                    type="tel"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    placeholder="09XXXXXXXXX"
                    required
                  />
                </label>

                <label className="request-form-field">
                  <span>Request Date Needed</span>
                  <input
                    type="date"
                    name="dateNeeded"
                    value={formData.dateNeeded}
                    onChange={handleInputChange}
                    required
                  />
                </label>
              </div>

              {selectedRequest.fields.map((field) => (
                <label key={field.name} className={`request-form-field${field.type === 'checkbox' ? ' request-form-checkbox' : ''}`}>
                  {field.type === 'checkbox' ? (
                    <span className="request-checkbox-row">
                      <input
                        type="checkbox"
                        name={field.name}
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
                          name={field.name}
                          value={details[field.name] || ''}
                          onChange={(event) => setDetails((current) => ({ ...current, [field.name]: event.target.value }))}
                          required
                        >
                          <option value="">Select {field.label.toLowerCase()}</option>
                          {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          name={field.name}
                          value={details[field.name] || ''}
                          onChange={(event) => setDetails((current) => ({ ...current, [field.name]: event.target.value }))}
                          rows="4"
                          required
                        />
                      ) : (
                        <input
                          type={field.type || 'text'}
                          name={field.name}
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

              {selectedRequest.purposeRequired && <label className="request-form-field request-form-wide">
                <span>{selectedRequest.title === 'Barangay Certificate of Residency' ? 'State Purpose' : 'Purpose / Reason'}</span>
                <textarea
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder={selectedRequest.title === 'Barangay Certificate of Residency'
                    ? 'e.g., local employment or school requirement'
                    : 'State why you are requesting this document or clearance...'}
                  required
                />
              </label>}

              <label className="request-form-field request-form-wide request-form-checkbox">
                <span className="request-checkbox-row">
                  <input
                    type="checkbox"
                    checked={formData.pickupRequired}
                    onChange={(event) => setFormData((current) => ({ ...current, pickupRequired: event.target.checked }))}
                  />
                  <span>I will pick up the printed document at the barangay</span>
                </span>
                <small>Leave unchecked if you can print the released document at home.</small>
              </label>

              <label className="request-form-field request-form-wide">
                <span>Additional Information</span>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Any additional details the barangay office should know..."
                />
              </label>

              <div className="request-actions">
                <button type="submit" className="primary-btn">Submit Request</button>
              </div>
            </form>
          </div>
        )}

        {selectedRequest && submitted && (
          <div className="request-success">
            <h3>Request Submitted</h3>
            <p>
              Your completed request for <strong>{selectedRequest.title}</strong> has been sent to the barangay admin for review, chairman signature, and official seal.
            </p>
            <p>
              Submitted by: <strong>{formData.fullName}</strong><br />
              Address: <strong>{formData.address}</strong><br />
              Contact: <strong>{formData.contact}</strong>
            </p>
          </div>
        )}

        <div className="resident-request-tracking">
          <div className="request-header">
            <p className="eyebrow">Request tracking</p>
            <h2>Your Submitted Requests</h2>
          </div>
          {requests.length === 0 ? (
            <p>No requests submitted yet.</p>
          ) : (
            <div className="resident-request-list">
              {requests.map((request) => (
                <article key={request._id} className="resident-request-row">
                  <div>
                    <h3>{request.requestType}</h3>
                    <p>Submitted {new Date(request.createdAt).toLocaleDateString()}</p>
                    <p>{request.pickupRequired ? 'Printed copy: pick up at the barangay' : 'Printed copy: print at home after release'}</p>
                  </div>
                  <span className={`resident-request-status status-${(request.status || 'Pending').toLowerCase().replaceAll(' ', '-')}`}>
                    {request.status || 'Pending'}
                  </span>
                  {request.status === 'Released' && (
                    <button
                      type="button"
                      className="secondary-btn request-view-button"
                      onClick={() => setViewingRequest(request)}
                      aria-label="View released document"
                      title="View released document"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span>View</span>
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
          <p className="resident-request-note">Documents are released only after admin review, the chairman's signature, and the official seal.</p>
        </div>

        {viewingRequest && (
          <div className="resident-document-backdrop" role="presentation" onClick={() => setViewingRequest(null)}>
            <section
              className="resident-document-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="resident-document-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="resident-document-dialog-header">
                <div>
                  <p className="eyebrow">Released document</p>
                  <h2 id="resident-document-title">{viewingRequest.requestType}</h2>
                </div>
                <button type="button" className="secondary-btn" onClick={() => setViewingRequest(null)}>
                  Close
                </button>
              </div>
              <RequestDocument request={viewingRequest} />
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
