import React, { useEffect, useState } from 'react';
import { API_URL, api } from '../api';
import backgroundImage from '../assets/background.png';
import sealImage from '../assets/seal.png';
import RequestDocument from '../components/RequestDocument';
import SignaturePad from '../components/SignaturePad';
import SuccessToast from '../components/SuccessToast';
import { AREA_COLORS } from '../components/areaColors';
import { IncidentReportMap } from '../components/IncidentMaps';
import AdminMessages from './AdminMessages';
import AssistedRequest from './AssistedRequest';
import { getRequestDocumentOffice, getRequestDocumentParts } from '../requestDocument';

const printRequestDocument = (request) => {
  const printWindow = window.open('', '_blank', 'width=850,height=1000');
  if (!printWindow) {
    alert('Allow pop-ups to print the request document.');
    return;
  }

  const { title, body } = getRequestDocumentParts(request);
  const documentText = body
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  const documentHtml = documentText.replace(/\[\[(CHAIRMAN|TREASURER)_SIGNATURE\]\]/g, (marker, signer) => {
    const signatureData = signer === 'TREASURER' ? request.treasurerSignatureData : request.signatureData;
    const signerLabel = signer === 'TREASURER' ? 'Treasurer' : 'Chairman';
    return signatureData
      ? `<div class="signature-slot"><img src="${signatureData.replaceAll('"', '&quot;')}" alt="${signerLabel} signature"></div>`
      : '<div class="signature-slot"><span class="signature-line"></span></div>';
  }).replaceAll('\n', '<br>');

  printWindow.onload = () => printWindow.print();
  printWindow.document.write(`<!doctype html>
    <html><head><title>${request.requestType}</title>
    <style>body{max-width:760px;margin:36px auto;color:#172a2d;font:14px/1.65 Georgia,'Times New Roman',serif}.certificate{position:relative;isolation:isolate}.certificate:before{position:absolute;z-index:0;inset:0;background:url('${backgroundImage}') center 58%/500px no-repeat;content:'';opacity:.07;pointer-events:none}.certificate>*{position:relative;z-index:1}.letterhead{display:grid;grid-template-columns:132px 1fr;align-items:center;gap:16px;text-align:center}.letterhead img{width:124px;height:124px;object-fit:contain}.letterhead p{margin:2px}.title{text-align:center;font-size:18px;margin:30px 0}pre{white-space:pre-wrap;font:inherit}.signature-slot{height:70px;display:flex;align-items:flex-end}.signature-slot img{width:210px;height:66px;object-fit:contain;object-position:left bottom}.signature-line{width:240px;border-top:1px solid #172a2d}@media print{body{margin:18mm}}</style>
    </head><body><main class="certificate"><header class="letterhead"><img src="${sealImage}" alt="Barangay 125 seal"><div><p>REPUBLIC OF THE PHILIPPINES</p><p>CITY OF MANILA</p><p>BARANGAY 125</p><p>${getRequestDocumentOffice(request)}</p></div></header><h1 class="title">${title}</h1>${documentHtml}</main></body></html>`);
  printWindow.document.close();
};

const areaMapZones = [
  { area: 'Area A', path: 'M 52 40 L 178 24 L 204 121 L 166 159 L 74 148 L 34 96 Z', x: 116, y: 91 },
  { area: 'Area B', path: 'M 178 24 L 315 41 L 365 96 L 328 148 L 204 121 Z', x: 274, y: 91 },
  { area: 'Area C', path: 'M 74 148 L 166 159 L 204 121 L 215 260 L 148 292 L 69 269 L 30 215 Z', x: 124, y: 220 },
  { area: 'Area D', path: 'M 204 121 L 328 148 L 371 205 L 337 269 L 276 294 L 215 260 Z', x: 292, y: 220 }
];

export default function AdminDashboard({ activeView = 'dashboard' }) {
  const [residents, setResidents] = useState([]);
  const [pendingResidents, setPendingResidents] = useState([]);
  const [reports, setReports] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedRequestFilter, setSelectedRequestFilter] = useState('All');
  const [viewingRequest, setViewingRequest] = useState(null);
  const [signingRequest, setSigningRequest] = useState(null);
  const [signingRole, setSigningRole] = useState('chairman');
  const [viewingEvidence, setViewingEvidence] = useState(null);
  const [viewingLocation, setViewingLocation] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const response = await api.get('/api/requests', { headers });
      setRequests(response.data);
    } catch (err) {
      console.error('Error loading requests', err);
    }
  };

  const fetchAdminData = async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const [resResidents, resReports] = await Promise.all([
        api.get('/api/admin/residents', { headers }),
        api.get('/api/reports', { headers })
      ]);
      setResidents(resResidents.data);
      setPendingResidents(resResidents.data.filter(resident => resident.status === 'pending'));
      setReports(resReports.data);
    } catch (err) {
      console.error('Error loading admin dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (id, status) => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      await api.patch(`/api/admin/residents/${id}`, { status }, { headers });
      setPendingResidents(pendingResidents.filter(resident => resident._id !== id));
      setResidents(residents.map(resident => resident._id === id ? { ...resident, status } : resident));
      alert(`Resident successfully ${status}!`);
    } catch (err) {
      alert('Failed to evaluate resident account.');
    }
  };

  const handleRequestStatus = async (id, status) => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const response = await api.patch(`/api/requests/${id}/status`, { status }, { headers });
      setRequests((current) => current.map((request) => request._id === id
        ? { ...request, ...response.data.request, residentId: request.residentId }
        : request));
      if (status === 'Released') setToastMessage('Request released to the resident successfully.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update request status.');
    }
  };

  const handleAssistedRequestCreated = (request) => {
    setRequests((current) => [request, ...current]);
  };

  const handleReportStatus = async (reportId, status) => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const response = await api.patch(`/api/reports/${reportId}/status`, { status }, { headers });
      setReports((current) => current.map((report) => report._id === reportId ? { ...report, ...response.data.report } : report));
      setToastMessage(`Report status changed to ${status}.`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update report status.');
    }
  };

  const handleRequestSignoff = async (request, field, checked) => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const response = await api.patch(`/api/requests/${request._id}/status`, { [field]: checked }, { headers });
      setRequests((current) => current.map((item) => item._id === request._id
        ? { ...item, ...response.data.request, residentId: item.residentId }
        : item));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save request sign-off.');
    }
  };

  const handleSaveSignature = async (request, signatureData, role) => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const signatureField = role === 'treasurer' ? 'treasurerSignatureData' : 'signatureData';
      const response = await api.patch(`/api/requests/${request._id}/status`, { [signatureField]: signatureData }, { headers });
      setRequests((current) => current.map((item) => item._id === request._id
        ? { ...item, ...response.data.request, residentId: item.residentId }
        : item));
      setSigningRequest(null);
    } catch (err) {
      alert(err.response?.data?.error || `Failed to save ${role} signature.`);
    }
  };

  if (loading) return <div className="text-center py-5 font-semibold text-lg">Loading Admin Command Center...</div>;

  if (activeView === 'assisted-request') {
    return <AssistedRequest residents={residents} onRequestCreated={handleAssistedRequestCreated} />;
  }

  const visibleReports = activeView === 'anonymous-reports'
    ? reports.filter((report) => report.isAnonymous)
    : activeView === 'report'
    ? reports.filter((report) => !report.isAnonymous && ['Report', 'Others'].includes(report.category))
    : activeView === 'emergency' || activeView === 'incident'
    ? reports.filter(report => report.category.toLowerCase() === activeView)
    : reports;

  const requestFilterOptions = [
    'All',
    'Barangay Certificate of Residency',
    'Certificate of Indigency',
    'Barangay Business Clearance (or Permit)',
    'First-Time Jobseeker Barangay Certificate',
    'Certificate of Good Moral Character',
    'Blotter Reports / Incident Records'
  ];

  const filteredRequests = selectedRequestFilter === 'All'
    ? requests
    : requests.filter((request) => request.requestType === selectedRequestFilter);

  const emergencyCount = reports.filter((report) => report.category === 'Emergency').length;
  const incidentCount = reports.filter((report) => report.category === 'Incident').length;
  const anonymousReportCount = reports.filter((report) => report.isAnonymous).length;
  const dashboardMetrics = [
    { label: 'Reports', value: reports.length, detail: 'All filed reports', tone: 'reports' },
    { label: 'Emergencies', value: emergencyCount, detail: 'Emergency reports', tone: 'emergencies' },
    { label: 'Incidents', value: incidentCount, detail: 'Incident reports', tone: 'incidents' },
    { label: 'Anonymous Reports', value: anonymousReportCount, detail: 'Identity hidden from admins', tone: 'anonymous' },
    { label: 'Requests', value: requests.length, detail: 'Resident service requests', tone: 'requests' },
    { label: 'Resident Users', value: residents.length, detail: 'Registered resident accounts', tone: 'users' }
  ];
  const areaActivity = areaMapZones.map((zone) => {
    const { area } = zone;
    const areaReports = reports.filter((report) => report.area === area);
    return {
      ...zone,
      area,
      color: AREA_COLORS[area],
      reports: areaReports.length,
      generalReports: areaReports.filter((report) => ['Report', 'Others'].includes(report.category)).length,
      emergencies: areaReports.filter((report) => report.category === 'Emergency').length,
      incidents: areaReports.filter((report) => report.category === 'Incident').length
    };
  });

  if (activeView === 'requests') {
    return (
      <div className="space-y-8 max-w-7xl mx-auto px-4">
        <SuccessToast message={toastMessage} onClose={() => setToastMessage('')} />
        <section className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-800">Resident Requests ({filteredRequests.length})</h2>
            <select
              value={selectedRequestFilter}
              onChange={(event) => setSelectedRequestFilter(event.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white shadow-sm"
            >
              {requestFilterOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {filteredRequests.length === 0 ? (
            <p className="text-gray-500 italic">No resident requests submitted yet for this filter.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredRequests.map((request) => {
                const isWalkInRequest = !request.residentId;

                return <article key={request._id} className="rounded-xl border border-gray-200 p-4 bg-gray-50 overflow-hidden">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <h3 className="font-bold text-gray-900 break-words">{request.requestType}</h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(request.createdAt).toLocaleDateString()}</span>
                  </div>
                  {isWalkInRequest ? (
                    <fieldset className="request-admin-signoff request-walkin-signoff">
                      <legend>Digital signature</legend>
                      <button
                        type="button"
                        className="secondary-btn admin-signature-button"
                        onClick={() => {
                          setSigningRole('chairman');
                          setSigningRequest(request);
                        }}
                      >
                        {request.signatureData ? 'Update digital signature' : 'Add signature'}
                      </button>
                      {request.requestType === 'Barangay Business Clearance (or Permit)' && (
                        <button
                          type="button"
                          className="secondary-btn admin-signature-button"
                          onClick={() => {
                            setSigningRole('treasurer');
                            setSigningRequest(request);
                          }}
                        >
                          {request.treasurerSignatureData ? 'Update treasurer signature' : 'Add Treasurer Signature (optional)'}
                        </button>
                      )}
                    </fieldset>
                  ) : (
                    <>
                      <label className="request-admin-status-label">
                        <span>Processing status</span>
                        <select
                          className="request-admin-status"
                          value={request.status || 'Pending'}
                          onChange={(event) => handleRequestStatus(request._id, event.target.value)}
                        >
                          {['Released', 'Approved'].includes(request.status) && <option>{request.status}</option>}
                          {['Pending', 'In Progress', 'Ready for Release', 'Rejected'].map((status) => (
                            <option
                              key={status}
                              disabled={['Ready for Release', 'Released'].includes(status) && (!request.adminReviewed || !request.chairmanSigned || !request.sealApplied)}
                            >
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                      <fieldset className="request-admin-signoff">
                        <legend>Required before release</legend>
                        <label>
                          <input
                            type="checkbox"
                            checked={Boolean(request.adminReviewed)}
                            onChange={(event) => handleRequestSignoff(request, 'adminReviewed', event.target.checked)}
                          />
                          Request details have been reviewed
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={Boolean(request.chairmanSigned)}
                            disabled={!request.adminReviewed || (!request.signatureData && !request.chairmanSigned)}
                            onChange={(event) => handleRequestSignoff(request, 'chairmanSigned', event.target.checked)}
                          />
                          Chairman has reviewed and signed
                        </label>
                        <button
                          type="button"
                          className="secondary-btn admin-signature-button"
                          disabled={!request.adminReviewed}
                          onClick={() => {
                            setSigningRole('chairman');
                            setSigningRequest(request);
                          }}
                        >
                          {request.signatureData ? 'Update digital signature' : 'Add signature'}
                        </button>
                        {request.requestType === 'Barangay Business Clearance (or Permit)' && (
                          <button
                            type="button"
                            className="secondary-btn admin-signature-button"
                            disabled={!request.adminReviewed}
                            onClick={() => {
                              setSigningRole('treasurer');
                              setSigningRequest(request);
                            }}
                          >
                            {request.treasurerSignatureData ? 'Update treasurer signature' : 'Add Treasurer Signature (optional)'}
                          </button>
                        )}
                        <label>
                          <input
                            type="checkbox"
                            checked={Boolean(request.sealApplied)}
                            disabled={!request.chairmanSigned}
                            onChange={(event) => handleRequestSignoff(request, 'sealApplied', event.target.checked)}
                          />
                          Official barangay seal has been applied
                        </label>
                      </fieldset>
                    </>
                  )}
                  <p className="text-sm text-gray-700 mb-2 break-words"><strong>{isWalkInRequest ? 'Walk-in requester:' : 'Resident:'}</strong> {request.fullName}</p>
                  <p className="text-sm text-gray-700 mb-2 break-words"><strong>Email:</strong> {request.residentId?.email || request.email || 'N/A'}</p>
                  <p className="text-sm text-gray-700 mb-2 break-words"><strong>Address:</strong> {request.address}</p>
                  <p className="text-sm text-gray-700 mb-2 break-words"><strong>Contact:</strong> {request.contact}</p>
                  <p className="text-sm text-gray-700 mb-2 break-words"><strong>Date Needed:</strong> {request.dateNeeded}</p>
                  <p className="text-sm text-gray-700 mb-2 break-words"><strong>Printed copy:</strong> {request.pickupRequired ? 'Pick up at the barangay' : 'Print at home after release'}</p>
                  {request.purpose && <p className="text-sm text-gray-700 mb-2 break-words"><strong>Purpose:</strong> {request.purpose}</p>}
                  {request.notes && <p className="text-sm text-gray-700 break-words"><strong>Notes:</strong> {request.notes}</p>}
                  <h4 className="request-document-heading">Document draft for chairman's signature and seal</h4>
                  <div className="admin-request-document-actions">
                    <button
                      type="button"
                      className="secondary-btn request-view-button"
                      onClick={() => setViewingRequest(request)}
                      aria-label="View request document"
                      title="View request document"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span>View</span>
                    </button>
                    <button type="button" className="primary-btn request-print-btn" onClick={() => printRequestDocument(request)}>
                      Print document draft
                    </button>
                  </div>
                  {!isWalkInRequest && request.status === 'Ready for Release' && (
                    <button
                      type="button"
                      className="primary-btn request-release-btn"
                      disabled={!request.adminReviewed || !request.chairmanSigned || !request.sealApplied}
                      onClick={() => handleRequestStatus(request._id, 'Released')}
                    >
                      Release to Resident
                    </button>
                  )}
                  {!isWalkInRequest && request.status === 'Released' && <p className="request-release-confirmation">Released to resident account.</p>}
                </article>;
              })}
            </div>
          )}
          {viewingRequest && (
            <div className="resident-document-backdrop" role="presentation" onClick={() => setViewingRequest(null)}>
              <section
                className="resident-document-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-request-document-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="resident-document-dialog-header">
                  <div>
                    <p className="eyebrow">Request document</p>
                    <h2 id="admin-request-document-title">{viewingRequest.requestType}</h2>
                  </div>
                  <button type="button" className="secondary-btn" onClick={() => setViewingRequest(null)}>
                    Close
                  </button>
                </div>
                <RequestDocument request={viewingRequest} />
              </section>
            </div>
          )}
          {signingRequest && (
            <div className="resident-document-backdrop" role="presentation" onClick={() => setSigningRequest(null)}>
              <section
                className="resident-document-dialog signature-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="signature-dialog-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="resident-document-dialog-header">
                  <div>
                    <p className="eyebrow">{signingRole === 'treasurer' ? 'Treasurer signature' : 'Chairman signature'}</p>
                    <h2 id="signature-dialog-title">{signingRequest.requestType}</h2>
                  </div>
                  <button type="button" className="secondary-btn" onClick={() => setSigningRequest(null)}>
                    Close
                  </button>
                </div>
                <SignaturePad
                  key={`${signingRequest._id}-${signingRole}-${signingRole === 'treasurer' ? signingRequest.treasurerSignatureData : signingRequest.signatureData || 'new'}`}
                  signer={signingRole}
                  signature={signingRole === 'treasurer' ? signingRequest.treasurerSignatureData : signingRequest.signatureData}
                  onSave={(signatureData) => handleSaveSignature(signingRequest, signatureData, signingRole)}
                />
              </section>
            </div>
          )}
        </section>
      </div>
    );
  }

  if (activeView === 'messages') return <AdminMessages />;

  if (activeView === 'residence') {
    return (
      <div className="admin-workspace space-y-8 max-w-7xl mx-auto px-4">
        <section className="workspace-section">
          <div className="section-heading">
            <div>
              <p className="welcome-kicker">Resident directory</p>
              <h2>Registered Residents ({residents.length})</h2>
            </div>
            <span className="section-meta">All account statuses</span>
          </div>
          {residents.length === 0 ? (
            <p className="empty-state">No registered residents found.</p>
          ) : (
            <div className="resident-grid">
              {residents.map(resident => (
                <article key={resident._id} className="resident-card">
                  <div>
                    <h3>{resident.fullName}</h3>
                    <p>{resident.email}</p>
                  </div>
                  <span className={`status-pill status-${resident.status}`}>{resident.status}</span>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4">
      <SuccessToast message={toastMessage} onClose={() => setToastMessage('')} />
      {activeView === 'dashboard' ? (
        <div className="admin-overview">
          <header className="admin-dashboard-header">
            <div>
              <p className="dashboard-kicker">Barangay 125 · Administration</p>
              <h1>Operations Overview</h1>
              <p>Track community reports, service requests, and resident activity.</p>
            </div>
            <time dateTime={new Date().toISOString().slice(0, 10)}>
              {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
          </header>

          <section className="dashboard-metrics" aria-label="Barangay activity totals">
            {dashboardMetrics.map((metric) => (
              <article className={`dashboard-metric dashboard-metric--${metric.tone}`} key={metric.label}>
                <p>{metric.label}</p>
                <strong>{metric.value.toLocaleString()}</strong>
                <span>{metric.detail}</span>
              </article>
            ))}
          </section>

          <section className="dashboard-chart" aria-labelledby="dashboard-chart-title">
            <div className="dashboard-chart-heading">
              <div>
                <p className="dashboard-kicker">Area distribution</p>
                <h2 id="dashboard-chart-title">Report Location Summary</h2>
              </div>
              <span>Reports grouped by the area selected when filed.</span>
            </div>
            <div className="area-map-legend" aria-label="Area color legend">
              {areaActivity.map((item) => (
                <span key={item.area}>
                  <i className="area-map-legend-key" style={{ backgroundColor: item.color }} aria-hidden="true" />
                  {item.area}
                </span>
              ))}
            </div>
            <div className="area-map-layout">
              <div className="area-map-visual">
                <p className="area-map-caption">Schematic area map · not to scale</p>
                <svg viewBox="0 0 410 320" role="img" aria-labelledby="area-map-title area-map-description">
                  <title id="area-map-title">Reports by area</title>
                  <desc id="area-map-description">A schematic of Areas A through D. Each area has a distinct color and report count.</desc>
                  {areaActivity.map((item) => (
                    <g key={item.area}>
                      <path d={item.path} fill={item.color} stroke="var(--line)" strokeWidth="3" strokeLinejoin="round" />
                      <text x={item.x} y={item.y} fill="#17313a" textAnchor="middle" className="area-map-label">{item.area}</text>
                      <text x={item.x} y={item.y + 22} fill="#17313a" textAnchor="middle" className="area-map-count">{item.reports} {item.reports === 1 ? 'report' : 'reports'}</text>
                    </g>
                  ))}
                </svg>
              </div>
              <div className="area-map-details">
                {areaActivity.map((item) => (
                  <article className="area-map-detail" key={item.area}>
                    <div>
                      <h3><i className="area-map-legend-key" style={{ backgroundColor: item.color }} aria-hidden="true" />{item.area}</h3>
                      <strong>{item.reports.toLocaleString()} {item.reports === 1 ? 'report' : 'reports'}</strong>
                    </div>
                    <p>{item.emergencies} emergencies · {item.incidents} incidents · {item.generalReports} reports</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white p-6 rounded-2xl shadow-lg">
          <h1 className="text-3xl font-extrabold">🛡️ Barangay Official Command Center</h1>
          <p className="text-blue-200 mt-1">Evaluate pending resident registrations and dispatch support to geo-tagged reports.</p>
        </div>
      )}

      {/* Resident Evaluation Section */}
      {activeView === 'dashboard' && <section className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Pending Resident Evaluations ({pendingResidents.length})</h2>
        {pendingResidents.length === 0 ? (
          <p className="text-gray-500 italic">No pending resident applications.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingResidents.map(res => (
              <div key={res._id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{res.fullName}</h3>
                  <p className="text-sm text-gray-600 mb-3">{res.email}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEvaluate(res._id, 'approved')} className="btn btn-success btn-sm flex-1 font-semibold">Approve</button>
                  <button onClick={() => handleEvaluate(res._id, 'rejected')} className="btn btn-danger btn-sm flex-1 font-semibold">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>}

      {/* Incident Reports Monitoring Feed */}
      <section className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          {activeView === 'anonymous-reports' ? 'Anonymous Reports' : activeView === 'report' ? 'Reports' : activeView === 'emergency' ? 'Emergency Reports' : activeView === 'incident' ? 'Incident Reports' : 'Live Incident Reports Feed'} ({visibleReports.length})
        </h2>
        {visibleReports.length === 0 ? (
          <p className="text-gray-500 italic">No reports filed yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleReports.map(rep => {
              const evidenceImages = rep.imageUrls?.length ? rep.imageUrls : rep.imageUrl ? [rep.imageUrl] : [];
              const hasCoordinates = Number.isFinite(rep.location?.lat) && Number.isFinite(rep.location?.lng);

              return <div key={rep._id} className="rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col justify-between">
                <div>
                  <div className="p-3 bg-gray-100 border-b flex justify-between items-center">
                    <span className="badge bg-danger text-uppercase text-xs">{rep.category}</span>
                    <span className="text-xs text-gray-500">{new Date(rep.createdAt).toLocaleDateString()}</span>
                  </div>
                  {evidenceImages.length > 0 && (
                    <div className={`grid ${evidenceImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {evidenceImages.map((imageUrl, index) => (
                        <button
                          key={imageUrl}
                          type="button"
                          className="evidence-image-button"
                          onClick={() => setViewingEvidence({ imageUrl: `${API_URL}${imageUrl}`, index, count: evidenceImages.length })}
                          aria-label={`View evidence image ${index + 1}`}
                        >
                          <img
                            src={`${API_URL}${imageUrl}`}
                            alt={`Evidence ${index + 1}`}
                            className={`w-full object-cover ${evidenceImages.length > 1 ? 'h-32' : 'h-48'}`}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <p className="text-sm text-gray-800 font-medium">{rep.description}</p>
                    {rep.area && <p className="text-xs text-gray-500">Area: {rep.area}</p>}
                    <p className="text-xs text-gray-500">📍 Place: {rep.place || 'Not provided'}</p>
                    {hasCoordinates && (
                      <>
                        <p className="text-xs text-gray-500">GPS: {rep.location.lat.toFixed(6)}, {rep.location.lng.toFixed(6)}</p>
                        <button type="button" className="report-detail-action" onClick={() => setViewingLocation(rep)}>
                          View exact location
                        </button>
                      </>
                    )}
                    <p className="text-xs text-blue-600 font-bold">{rep.isAnonymous ? 'Filed anonymously' : `Filed by: ${rep.residentId?.fullName || 'Resident'}`}</p>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 border-t flex justify-between items-center gap-3">
                  <span className={`report-status-pill report-status-pill--${(rep.status || 'Pending').toLowerCase().replaceAll(' ', '-')}`}>{rep.status || 'Pending'}</span>
                  <label className="report-status-control">
                    <span className="sr-only">Update report status</span>
                    <select value={rep.status || 'Pending'} onChange={(event) => handleReportStatus(rep._id, event.target.value)}>
                      {['Pending', 'In Progress', 'Resolved'].map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </label>
                </div>
              </div>;
            })}
          </div>
        )}
      </section>

      {viewingEvidence && (
        <div className="report-preview-backdrop" role="presentation" onClick={() => setViewingEvidence(null)}>
          <section className="report-preview-dialog" role="dialog" aria-modal="true" aria-label="Evidence image preview" onClick={(event) => event.stopPropagation()}>
            <div className="report-preview-header">
              <p>Evidence {viewingEvidence.index + 1} of {viewingEvidence.count}</p>
              <button type="button" className="report-preview-close" onClick={() => setViewingEvidence(null)} aria-label="Close image preview">Close</button>
            </div>
            <img src={viewingEvidence.imageUrl} alt={`Report evidence ${viewingEvidence.index + 1}`} />
          </section>
        </div>
      )}

      {viewingLocation && (
        <div className="report-preview-backdrop" role="presentation" onClick={() => setViewingLocation(null)}>
          <section className="report-location-dialog" role="dialog" aria-modal="true" aria-label="Exact incident location" onClick={(event) => event.stopPropagation()}>
            <div className="report-preview-header">
              <div>
                <p>{viewingLocation.area || 'Incident location'} · {viewingLocation.place || 'Pinned position'}</p>
                <small>{viewingLocation.location.lat.toFixed(6)}, {viewingLocation.location.lng.toFixed(6)}</small>
              </div>
              <button type="button" className="report-preview-close" onClick={() => setViewingLocation(null)} aria-label="Close location map">Close</button>
            </div>
            <IncidentReportMap reports={[viewingLocation]} />
          </section>
        </div>
      )}
    </div>
  );
}