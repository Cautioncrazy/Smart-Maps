'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import RouteForm from '@/components/RouteForm';
import axios from 'axios';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-card text-foreground/50">Loading Map...</div>
});

export default function Home() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [startCoords, setStartCoords] = useState<[number, number] | null>(null);
  const [endCoords, setEndCoords] = useState<[number, number] | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to geocode
  const geocode = async (query: string) => {
    // If query looks like coords "lat, lng", parse it
    const coordMatch = query.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      return [parseFloat(coordMatch[1]), parseFloat(coordMatch[3])] as [number, number];
    }

    try {
      const res = await axios.get(`/api/geocode?q=${encodeURIComponent(query)}`);
      return [res.data.lat, res.data.lon] as [number, number];
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const handleSearch = async (originText: string, destText: string, persona: string) => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setRoutes([]);
    setSelectedRouteIndex(null);

    try {
      // Geocode
      const start = await geocode(originText);
      const end = await geocode(destText);

      if (!start) {
        setError(`Could not find location: "${originText}"`);
        setIsLoading(false);
        return;
      }
      if (!end) {
        setError(`Could not find location: "${destText}"`);
        setIsLoading(false);
        return;
      }

      setStartCoords(start);
      setEndCoords(end);

      // Get Routes
      const routeRes = await axios.post('/api/get-route', { start, end });

      // ORS response structure: check features
      const features = routeRes.data.features;

      if (!features || features.length === 0) {
        setError('No routes found between these locations.');
        setIsLoading(false);
        return;
      }

      setRoutes(features);

      // Analyze
      try {
        const analysisRes = await axios.post('/api/analyze-route', {
            routes: features,
            persona
        });

        const { recommended_route_index, reasoning } = analysisRes.data;
        // Ensure index is valid
        const index = typeof recommended_route_index === 'number' && recommended_route_index >= 0 && recommended_route_index < features.length
            ? recommended_route_index
            : 0;

        setSelectedRouteIndex(index);
        setAnalysis(reasoning);
      } catch (analysisErr) {
        console.error('Analysis failed', analysisErr);
        setSelectedRouteIndex(0);
        setAnalysis("AI Analysis failed. Showing the first route.");
      }

    } catch (err: unknown) {
      console.error(err);
      let msg = 'An error occurred during routing.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.error || err.message || msg;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    const coordString = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    if (!origin || (origin && destination)) {
      // Set start if origin is empty or both are full (restart)
      if (origin && destination) {
          setDestination('');
          setEndCoords(null);
          setRoutes([]);
          setAnalysis(null);
          setSelectedRouteIndex(null);
      }
      setOrigin(coordString);
      setStartCoords([lat, lng]);
    } else {
      // Set destination
      setDestination(coordString);
      setEndCoords([lat, lng]);
    }
  };

  return (
    <main className="flex flex-col h-screen md:flex-row bg-background text-foreground transition-colors">
      <div className="w-full md:w-1/3 p-6 overflow-y-auto z-10 relative flex flex-col gap-6 border-r border-card-border shadow-xl bg-card">
        <div>
            <h1 className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">SmartRoute AI 🗺️</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Intelligent Navigation with Gemini</p>
        </div>

        <RouteForm
          onSearch={handleSearch}
          isLoading={isLoading}
          origin={origin}
          destination={destination}
          setOrigin={setOrigin}
          setDestination={setDestination}
        />

        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {analysis && (
          <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-sm transition-all animate-in fade-in slide-in-from-bottom-4">
            <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2">
                <span>🤖</span> AI Recommendation
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{analysis}</p>
          </div>
        )}

        <div className="mt-auto pt-6 text-xs text-gray-400 dark:text-gray-600 border-t border-gray-200 dark:border-gray-800">
           <p>Powered by OpenRouteService, OpenStreetMap & Google Gemini.</p>
        </div>
      </div>

      <div className="w-full md:w-2/3 h-[50vh] md:h-full relative">
        <Map
          start={startCoords}
          end={endCoords}
          routes={routes}
          selectedRouteIndex={selectedRouteIndex}
          onMapClick={handleMapClick}
        />
        {/* Helper text overlay */}
        {!startCoords && !endCoords && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-black/80 backdrop-blur px-4 py-2 rounded-full shadow-lg text-sm text-gray-600 dark:text-gray-300 z-[400] pointer-events-none">
                Click map to select start & end points
            </div>
        )}
      </div>
    </main>
  );
}
