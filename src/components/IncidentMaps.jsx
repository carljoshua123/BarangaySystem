import { useEffect } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { AREA_COLORS } from './areaColors';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [14.5995, 120.9842];
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function MapClickHandler({ onLocationChange }) {
  useMapEvents({
    click(event) {
      onLocationChange({
        lat: Number(event.latlng.lat.toFixed(6)),
        lng: Number(event.latlng.lng.toFixed(6))
      });
    }
  });

  return null;
}

function CenterSelectedLocation({ location }) {
  const map = useMap();

  useEffect(() => {
    if (location) map.setView([location.lat, location.lng], Math.max(map.getZoom(), 15));
  }, [location, map]);

  return null;
}

function FitReportLocations({ reports }) {
  const map = useMap();

  useEffect(() => {
    const points = reports
      .filter((report) => Number.isFinite(report.location?.lat) && Number.isFinite(report.location?.lng))
      .map((report) => [report.location.lat, report.location.lng]);

    if (points.length === 1) map.setView(points[0], 15);
    if (points.length > 1) map.fitBounds(points, { padding: [24, 24], maxZoom: 15 });
  }, [map, reports]);

  return null;
}

export function ReportLocationMap({ area, location, onLocationChange }) {
  const color = AREA_COLORS[area] || '#126e6a';

  return (
    <div className="map-frame report-location-map">
      <MapContainer center={DEFAULT_CENTER} zoom={13} scrollWheelZoom={false}>
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <MapClickHandler onLocationChange={onLocationChange} />
        <CenterSelectedLocation location={location} />
        {location && (
          <CircleMarker
            center={[location.lat, location.lng]}
            radius={9}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 3 }}
          >
            <Popup>Incident location · {area || 'Select an area'}</Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}

export function IncidentReportMap({ reports }) {
  const locatedReports = reports.filter((report) => Number.isFinite(report.location?.lat) && Number.isFinite(report.location?.lng));

  return (
    <div className="map-frame incident-report-map">
      <MapContainer center={DEFAULT_CENTER} zoom={12} scrollWheelZoom>
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <FitReportLocations reports={locatedReports} />
        {locatedReports.map((report) => {
          const color = AREA_COLORS[report.area] || '#126e6a';
          return (
            <CircleMarker
              key={report._id}
              center={[report.location.lat, report.location.lng]}
              radius={8}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 2 }}
            >
              <Popup>
                <strong>{report.area || 'Area not set'}</strong><br />
                {report.category}<br />
                {report.place || 'Location details not provided'}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}