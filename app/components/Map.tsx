'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import L from 'leaflet';

interface MapProps {
  start: [number, number] | null; // [lat, lng]
  end: [number, number] | null;   // [lat, lng]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  routes: any[]; // ORS Route Features
  selectedRouteIndex: number | null;
  onMapClick?: (lat: number, lng: number) => void;
}

// Component to handle map clicks
function MapEvents({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onClick) onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to fit bounds
function MapBounds({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

export default function Map({ start, end, routes, selectedRouteIndex, onMapClick }: MapProps) {

  const bounds = useMemo(() => {
    if (!start && !end && routes.length === 0) return null;

    const b = L.latLngBounds([]);
    if (start) b.extend(start);
    if (end) b.extend(end);

    routes.forEach(route => {
      if (route.geometry && route.geometry.coordinates) {
        route.geometry.coordinates.forEach((coord: number[]) => {
          // GeoJSON is [lng, lat], Leaflet needs [lat, lng] for bounds?
          // Actually latLngBounds takes [lat, lng].
          b.extend([coord[1], coord[0]]);
        });
      }
    });

    return b.isValid() ? b : null;
  }, [start, end, routes]);

  return (
    <MapContainer
      center={[51.505, -0.09]}
      zoom={13}
      className="h-full w-full rounded-lg shadow-lg z-0"
      style={{ minHeight: '400px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEvents onClick={onMapClick} />
      <MapBounds bounds={bounds} />

      {start && <Marker position={start}><Popup>Origin</Popup></Marker>}
      {end && <Marker position={end}><Popup>Destination</Popup></Marker>}

      {routes.map((route, index) => {
        // ORS GeoJSON coordinates are [lng, lat]. Leaflet Polyline needs [lat, lng].
        const positions = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]) as [number, number][];

        // If a route is selected, dim others. If none selected (null), show all equally?
        // Or if selectedRouteIndex is passed, highlight it.
        // Assuming selectedRouteIndex might be 0, 1...
        const isSelected = selectedRouteIndex === index;
        const isAnySelected = selectedRouteIndex !== null;

        let color = 'gray';
        let weight = 4;
        let opacity = 0.6;
        // let zIndex = 1;

        if (isSelected) {
            color = '#10b981'; // emerald-500
            weight = 7;
            opacity = 1;
            // zIndex = 10;
        } else if (isAnySelected) {
            color = '#9ca3af'; // gray-400
            opacity = 0.4;
        } else {
            // Default colors for different routes if none selected?
            // Maybe just blue.
            color = '#3b82f6'; // blue-500
        }

        return (
           <Polyline
             key={index}
             positions={positions}
             pathOptions={{ color, weight, opacity }}
             eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ weight: weight + 2 }); },
                mouseout: (e) => { e.target.setStyle({ weight: weight }); }
             }}
           />
        );
      })}
    </MapContainer>
  );
}
