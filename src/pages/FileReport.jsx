import React, { useState } from 'react';
import { api } from '../api';
import { ReportLocationMap } from '../components/IncidentMaps';
import SuccessToast from '../components/SuccessToast';

export default function FileReport({ initialCategory }) {
  const [category, setCategory] = useState(initialCategory || 'Emergency');
  const [area, setArea] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [description, setDescription] = useState('');
  const [place, setPlace] = useState('');
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) return alert('Please upload at least one image evidence file.');
    if (!anonymous && !location) return alert('Pin the incident location on the map before submitting.');

    setLoading(true);
    setToastMessage('');

    const formData = new FormData();
    formData.append('category', category);
    formData.append('area', area);
    formData.append('isAnonymous', String(anonymous));
    formData.append('description', description);
    formData.append('place', place);
    if (!anonymous && location) {
      formData.append('lat', String(location.lat));
      formData.append('lng', String(location.lng));
    }
    images.forEach((image) => formData.append('image', image));

    try {
      await api.post('/api/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setToastMessage('Report submitted successfully. Barangay officials will review it.');
      setDescription('');
      setPlace('');
      setArea('');
      setLocation(null);
      setImages([]);
      setAnonymous(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to file report.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return alert('Location access is not available in this browser.');

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ lat: coords.latitude, lng: coords.longitude });
        setLocating(false);
      },
      () => {
        alert('Could not get your current location. You can place the pin directly on the map.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
      <SuccessToast message={toastMessage} onClose={() => setToastMessage('')} />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">📢 File an Official Barangay Report</h2>
      <p className="text-sm text-gray-500 mb-6">Provide accurate details, describe where the incident happened, and attach photo evidence for immediate action.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">Report Category</label>
          <select 
            className="form-select p-2.5 rounded-lg border border-gray-300 w-full"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              if (!['Report', 'Others'].includes(e.target.value)) setAnonymous(false);
            }}
          >
            <option value="Emergency">🚨 Emergency</option>
            <option value="Incident">⚠️ Incident</option>
            <option value="Report">📋 Report</option>
            <option value="Others">📌 Others</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">Area Where Incident Happened</label>
          <select
            className="form-select p-2.5 rounded-lg border border-gray-300 w-full"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            required
          >
            <option value="">Select incident area</option>
            {['Area A', 'Area B', 'Area C', 'Area D'].map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {['Report', 'Others'].includes(category) && (
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => {
                  setAnonymous(e.target.checked);
                  if (e.target.checked) setLocation(null);
                }}
              />
              Submit this report anonymously
            </label>
            <small className="text-sm text-gray-500">Your name and email will be hidden from admins for this report.</small>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">Incident Location</label>
          <input
            type="text"
            className="form-control p-2.5 rounded-lg border border-gray-300 w-full"
            placeholder="Street, purok/zone, or nearby landmark"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            required
          />
        </div>

        {anonymous ? (
          <p className="anonymous-location-note">
            Your report will not request or save GPS coordinates. Provide a street, area, or landmark above so officials can respond.
          </p>
        ) : (
          <div>
            <div className="report-map-heading">
              <label className="block text-sm font-semibold text-gray-700">Pin the exact incident location</label>
              <button type="button" className="location-use-button" onClick={handleUseCurrentLocation} disabled={locating}>
                {locating ? 'Locating…' : 'Use my location'}
              </button>
            </div>
            <p className="report-map-instructions">Click the map to place or move the pin. A pin is required to submit.</p>
            <ReportLocationMap area={area} location={location} onLocationChange={setLocation} />
            <small className="text-sm text-gray-500">
              {location ? `Pinned at ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : 'No map location selected.'}
            </small>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">Detailed Description</label>
          <textarea 
            rows="3"
            className="form-control p-2.5 rounded-lg border border-gray-300 w-full"
            placeholder="Explain precisely what happened..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">Upload Image Evidence</label>
          <input 
            type="file" 
            accept="image/*"
            multiple
            className="form-control p-2.5 rounded-lg border border-gray-300 w-full"
            onChange={(e) => {
              const selectedImages = Array.from(e.target.files || []);
              if (selectedImages.length > 5) {
                alert('You can upload up to 5 images.');
                e.target.value = '';
                setImages([]);
                return;
              }
              setImages(selectedImages);
            }}
            required
          />
          <small className="text-sm text-gray-500">Upload up to 5 images, 5 MB each.</small>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn btn-success w-full py-3 font-bold shadow-md bg-green-600 hover:bg-green-700 transition"
        >
          {loading ? 'Transmitting Report...' : 'Submit Report to Officials'}
        </button>
      </form>
    </div>
  );
}