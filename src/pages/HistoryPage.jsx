import React, { useEffect, useState } from 'react';
import { API_URL, api } from '../api';
import { IncidentReportMap } from '../components/IncidentMaps';

const statusOptions = ['All statuses', 'Pending', 'In Progress', 'Resolved', 'Ready for Release', 'Released', 'Approved', 'Rejected'];

export default function HistoryPage() {
  const [activities, setActivities] = useState([]);
  const [typeFilter, setTypeFilter] = useState('All activity');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
        const [reportsResponse, requestsResponse] = await Promise.all([
          api.get('/api/reports', { headers }),
          api.get('/api/requests', { headers })
        ]);
        const reportActivities = reportsResponse.data.map((report) => ({
          id: `report-${report._id}`,
          type: 'Report',
          title: `${report.category} report`,
          record: report,
          status: report.status || 'Pending',
          date: report.createdAt,
          description: report.description,
          location: [report.area, report.place].filter(Boolean).join(' · ')
        }));
        const requestActivities = requestsResponse.data.map((request) => ({
          id: `request-${request._id}`,
          type: 'Request',
          title: request.requestType,
          record: request,
          status: request.status || 'Pending',
          date: request.createdAt,
          description: request.purpose || 'Service request submitted.',
          location: request.address
        }));

        setActivities([...reportActivities, ...requestActivities].sort((first, second) => new Date(second.date) - new Date(first.date)));
      } catch (fetchError) {
        setError(fetchError.response?.data?.error || 'Could not load your activity history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const filteredActivities = activities.filter((activity) => (
    (typeFilter === 'All activity' || activity.type === typeFilter) &&
    (statusFilter === 'All statuses' || activity.status === statusFilter)
  ));

  return (
    <div className="public-page history-page">
      <section className="page-header">
        <p className="eyebrow">Resident account</p>
        <h1>Activity History</h1>
      </section>

      <section className="history-panel" aria-labelledby="history-title">
        <div className="history-heading">
          <div>
            <p className="eyebrow">Your activity</p>
            <h2 id="history-title">Reports &amp; Requests</h2>
          </div>
          <div className="history-filters">
            <label>
              <span>Type</span>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option>All activity</option>
                <option>Report</option>
                <option>Request</option>
              </select>
            </label>
            <label>
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                {statusOptions.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
          </div>
        </div>

        {loading ? (
          <p className="history-empty">Loading your activity...</p>
        ) : error ? (
          <p className="history-empty" role="alert">{error}</p>
        ) : filteredActivities.length === 0 ? (
          <p className="history-empty">No activity matches these filters.</p>
        ) : (
          <ol className="history-list">
            {filteredActivities.map((activity) => (
              <li className="history-entry" key={activity.id}>
                <span className={`history-entry-mark history-entry-mark--${activity.type.toLowerCase()}`} aria-hidden="true" />
                <article>
                  <div className="history-entry-heading">
                    <div>
                      <span className="history-type-label">{activity.type}</span>
                      <h3>{activity.title}</h3>
                    </div>
                    <span className={`history-status history-status--${activity.status.toLowerCase().replaceAll(' ', '-')}`}>
                      {activity.status}
                    </span>
                  </div>
                  <p>{activity.description}</p>
                  {activity.location && <small>{activity.location}</small>}
                  <time dateTime={activity.date}>{new Date(activity.date).toLocaleString()}</time>
                  <button
                    type="button"
                    className="history-detail-button"
                    onClick={() => setSelectedActivity(activity)}
                    aria-label={`View details for ${activity.title}`}
                    title="View details"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </article>
              </li>
            ))}
          </ol>
        )}
      </section>

      {selectedActivity && (
        <div className="history-detail-backdrop" role="presentation" onClick={() => setSelectedActivity(null)}>
          <section
            className="history-detail-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="history-detail-header">
              <div>
                <span className="history-type-label">{selectedActivity.type}</span>
                <h2 id="history-detail-title">{selectedActivity.title}</h2>
              </div>
              <button type="button" className="history-detail-close" onClick={() => setSelectedActivity(null)}>Close</button>
            </header>
            <div className="history-detail-content">
              <p><strong>Status:</strong> {selectedActivity.status}</p>
              <p><strong>Submitted:</strong> {new Date(selectedActivity.date).toLocaleString()}</p>
              {selectedActivity.type === 'Report' ? (
                <>
                  <p><strong>Area:</strong> {selectedActivity.record.area || 'Not specified'}</p>
                  <p><strong>Incident location:</strong> {selectedActivity.record.place || 'Not specified'}</p>
                  <div className="history-detail-copy">
                    <strong>Description</strong>
                    <p>{selectedActivity.record.description || 'No description provided.'}</p>
                  </div>
                  {selectedActivity.record.location && (
                    <>
                      <p><strong>Coordinates:</strong> {selectedActivity.record.location.lat}, {selectedActivity.record.location.lng}</p>
                      <IncidentReportMap reports={[selectedActivity.record]} />
                    </>
                  )}
                  {(selectedActivity.record.imageUrls?.length || selectedActivity.record.imageUrl) && (
                    <div className="history-evidence-grid">
                      {(selectedActivity.record.imageUrls?.length ? selectedActivity.record.imageUrls : [selectedActivity.record.imageUrl]).map((imageUrl, index) => (
                        <figure key={imageUrl}>
                          <img src={`${API_URL}${imageUrl}`} alt={`Report evidence ${index + 1}`} />
                          <figcaption>Evidence {index + 1}</figcaption>
                        </figure>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p><strong>Full name:</strong> {selectedActivity.record.fullName}</p>
                  <p><strong>Address:</strong> {selectedActivity.record.address}</p>
                  <p><strong>Contact:</strong> {selectedActivity.record.contact}</p>
                  <p><strong>Date needed:</strong> {selectedActivity.record.dateNeeded}</p>
                  {selectedActivity.record.purpose && <p><strong>Purpose:</strong> {selectedActivity.record.purpose}</p>}
                  {Object.entries(selectedActivity.record.details || {}).map(([field, value]) => (
                    <p key={field}><strong>{field.replaceAll(/([A-Z])/g, ' $1')}:</strong> {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</p>
                  ))}
                  {selectedActivity.record.notes && <p><strong>Additional information:</strong> {selectedActivity.record.notes}</p>}
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}