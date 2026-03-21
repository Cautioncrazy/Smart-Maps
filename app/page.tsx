'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Menu, Mic, Layers, Compass, Crosshair, Plus, Minus, Navigation, Settings2, Wifi, Zap, AlertTriangle } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { useTheme } from 'next-themes';
import { lightMapStyle, darkMapStyle, oledMapStyle } from './utils/mapStyles';

const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;

interface MarkerProps {
  clientPos: { lat: number, lng: number } | null;
  clientAngle: number;
  serverPos: { lat: number, lng: number } | null;
  lastProcessedPacket: Packet | null;
  showGhosts: boolean;
  predictionEnabled: boolean;
}

export interface Packet {
  timestamp: number;
  pos: { lat: number, lng: number };
  vel: { lat: number, lng: number };
  arrivalTime: number;
}

// Custom Marker to handle drawing the navigation arrow and ghosts
const CarMarker = ({ clientPos, clientAngle, serverPos, lastProcessedPacket, showGhosts, predictionEnabled }: MarkerProps) => {
  return (
    <>
      {showGhosts && lastProcessedPacket && serverPos && (
        <>
          {/* True Server Position (Green Ghost) */}
          <AdvancedMarker
            position={{ lat: serverPos.lat, lng: serverPos.lng }}
            zIndex={10}
          >
             <div className="w-4 h-4 rounded-full bg-green-500/40 border-2 border-green-500" />
          </AdvancedMarker>

          {/* Delayed Packet Position (Gray Ghost) */}
          <AdvancedMarker
            position={{ lat: lastProcessedPacket.pos.lat, lng: lastProcessedPacket.pos.lng }}
            zIndex={5}
          >
            <div className="w-4 h-4 rounded-full bg-gray-500/40" />
          </AdvancedMarker>
        </>
      )}

      {/* Predicted Client Car */}
      {clientPos && (
        <AdvancedMarker
          position={{ lat: clientPos.lat, lng: clientPos.lng }}
          zIndex={20}
        >
          <div
            className="relative flex items-center justify-center"
            style={{ transform: `rotate(${clientAngle}rad)` }}
          >
            {predictionEnabled && (
              <div className="absolute w-12 h-12 rounded-full bg-blue-500/15" />
            )}
            {/* Simple CSS arrow for the car */}
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderBottom: '25px solid #4285F4',
                filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.3))'
              }}
            />
          </div>
        </AdvancedMarker>
      )}
    </>
  );
};

const MapController = ({ clientPos }: { clientPos: { lat: number, lng: number } | null }) => {
  const map = useMap();
  useEffect(() => {
    if (map && clientPos) {
      map.panTo({ lat: clientPos.lat, lng: clientPos.lng });
    }
  }, [map, clientPos]);
  return null;
};

export default function App() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;

  const mapStyle = currentTheme === 'oled' ? oledMapStyle :
                   currentTheme === 'dark' ? darkMapStyle :
                   lightMapStyle;

  const [searchQuery, setSearchQuery] = useState('');

  // Settings State
  const [predictionEnabled, setPredictionEnabled] = useState(true);
  const [showGhosts, setShowGhosts] = useState(true);

  // UI State
  const [isExpanded, setIsExpanded] = useState(true);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Stats
  const [ping, setPing] = useState(0);
  const [corrections, setCorrections] = useState(0);

  // Position State
  const [clientPos, setClientPos] = useState<{lat: number, lng: number} | null>(null);
  const [clientAngle, setClientAngle] = useState(0);
  const [serverPos, setServerPos] = useState<{lat: number, lng: number} | null>(null);
  const [lastProcessedPacket, setLastProcessedPacket] = useState<Packet | null>(null);

  // Refs for animation loop
  const simulationRef = useRef({
    time: 0,
    lastTime: 0, // Initialize with 0, update in effect
    packetQueue: [] as Packet[],
    lastProcessedPacket: null as Packet | null,
    clientPos: null as {lat: number, lng: number} | null,
    clientAngle: 0,
    correctionCount: 0,
    serverPos: null as {lat: number, lng: number} | null,
    serverVel: {lat: 0, lng: 0}
  });

  const requestRef = useRef<number>(0);

  useEffect(() => {
    let watchId: number;

    const startTracking = () => {
      if (!('geolocation' in navigator)) {
        setPermissionError("Geolocation is not supported by your browser.");
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setPermissionError(null);
          const { latitude, longitude } = position.coords;

          const now = performance.now();

          if (simulationRef.current.lastTime === 0) {
             simulationRef.current.lastTime = now;
          }

          const newPos = { lat: latitude, lng: longitude };

          // Estimate velocity if speed/heading isn't available from GPS directly
          // For simplicity in this demo, we'll calculate a crude velocity if needed,
          // or use the provided ones if moving.
          let velLat = 0;
          let velLng = 0;

          const sim = simulationRef.current;

          if (sim.serverPos) {
             const dt = (now - sim.time) / 1000; // time in seconds
             if (dt > 0) {
                 velLat = (newPos.lat - sim.serverPos.lat) / dt;
                 velLng = (newPos.lng - sim.serverPos.lng) / dt;
             }
          }

          sim.serverPos = newPos;
          sim.serverVel = { lat: velLat, lng: velLng };
          sim.time = now;
          setServerPos(newPos); // Update react state for ghosts

          // Push to "network" queue for the client to process
          sim.packetQueue.push({
            timestamp: now,
            pos: newPos,
            vel: sim.serverVel,
            arrivalTime: now + 50 // Minimal simulated latency for real GPS
          });

          // First time init
          if (!sim.clientPos) {
              sim.clientPos = newPos;
              setClientPos(newPos);
          }
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setPermissionError("Location permission is required for GPS to work as intended.");
          } else {
             setPermissionError(`GPS Error: ${error.message}`);
          }
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    };

    startTracking();

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);


  // Main Animation Loop
  useEffect(() => {
    const loop = (currentTime: number) => {
      const sim = simulationRef.current;
      if (!sim.serverPos || !sim.clientPos) {
          requestRef.current = requestAnimationFrame(loop);
          return;
      }

      // Process Packets
      let currentPing = 0;
      while (sim.packetQueue.length > 0 && currentTime >= sim.packetQueue[0].arrivalTime) {
        const packet = sim.packetQueue.shift();
        if (!packet) break;

        if (sim.lastProcessedPacket && predictionEnabled) {
          // Calculate error
          const dt = (packet.timestamp - sim.lastProcessedPacket.timestamp) / 1000;
          const predictedLat = sim.lastProcessedPacket.pos.lat + sim.lastProcessedPacket.vel.lat * dt;
          const predictedLng = sim.lastProcessedPacket.pos.lng + sim.lastProcessedPacket.vel.lng * dt;

          // Rough distance check (using lat/lng difference directly for simplicity here, though inaccurate globally)
          const distanceError = Math.hypot(packet.pos.lat - predictedLat, packet.pos.lng - predictedLng);

          if (distanceError > 0.0001) { // Arbitrary threshold
            sim.correctionCount++;
            setCorrections(sim.correctionCount);
          }
        }

        sim.lastProcessedPacket = packet;
        currentPing = Math.round(currentTime - packet.timestamp);
      }

      setLastProcessedPacket(sim.lastProcessedPacket);

      if (Math.random() < 0.05) setPing(currentPing);

      // Client Prediction
      let targetClientPos = { ...sim.serverPos };
      let targetAngle = sim.clientAngle;

      if (sim.lastProcessedPacket) {
        if (predictionEnabled) {
          const dt = (currentTime - sim.lastProcessedPacket.timestamp) / 1000;
          targetClientPos = {
            lat: sim.lastProcessedPacket.pos.lat + sim.lastProcessedPacket.vel.lat * dt,
            lng: sim.lastProcessedPacket.pos.lng + sim.lastProcessedPacket.vel.lng * dt
          };
          if (sim.lastProcessedPacket.vel.lat !== 0 || sim.lastProcessedPacket.vel.lng !== 0) {
              targetAngle = Math.atan2(sim.lastProcessedPacket.vel.lng, sim.lastProcessedPacket.vel.lat);
          }
        } else {
          targetClientPos = sim.lastProcessedPacket.pos;
           if (sim.lastProcessedPacket.vel.lat !== 0 || sim.lastProcessedPacket.vel.lng !== 0) {
              targetAngle = Math.atan2(sim.lastProcessedPacket.vel.lng, sim.lastProcessedPacket.vel.lat);
          }
        }
      }

      // Smooth client movement
      sim.clientPos.lat = lerp(sim.clientPos.lat, targetClientPos.lat, 0.1);
      sim.clientPos.lng = lerp(sim.clientPos.lng, targetClientPos.lng, 0.1);

      // Smooth rotation (handling wrapping not implemented for simplicity)
      sim.clientAngle = lerp(sim.clientAngle, targetAngle, 0.1);

      setClientPos({ ...sim.clientPos });
      setClientAngle(sim.clientAngle);

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [predictionEnabled]);


  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
      <div className="relative w-full h-screen bg-[#f8f9fa] overflow-hidden font-sans text-slate-800 dark:text-slate-200">

        {permissionError && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
            {permissionError}
          </div>
        )}

        <Map
          mapId="main-map"
          defaultCenter={{ lat: 37.7749, lng: -122.4194 }}
          defaultZoom={15}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          styles={mapStyle}
          className="absolute inset-0"
        >
           <MapController clientPos={clientPos} />
           <CarMarker
             clientPos={clientPos}
             clientAngle={clientAngle}
             serverPos={serverPos}
             lastProcessedPacket={lastProcessedPacket}
             showGhosts={showGhosts}
             predictionEnabled={predictionEnabled}
           />
        </Map>

        {/* Modern Top Search Bar */}
        <div className="absolute top-4 left-4 right-4 md:left-4 md:right-auto md:w-[420px] z-10 bg-white dark:bg-slate-900 rounded-full shadow-md flex items-center px-4 py-3 gap-3 transition-transform hover:shadow-lg">
          <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer transition-colors" />
          <input
            type="text"
            placeholder="Search Google Maps"
            className="flex-1 outline-none text-base placeholder:text-slate-400 font-medium bg-transparent text-slate-900 dark:text-slate-100"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
              }
            }}
          />
          <Mic className="w-5 h-5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer transition-colors" />
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold cursor-pointer shadow-sm">
            J
          </div>
        </div>

        {/* Right Floating Actions */}
        <div className="absolute right-4 top-24 md:top-24 flex flex-col gap-2 z-10">
          <button className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-md flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Layers className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
        </div>

        <div className="absolute right-4 bottom-48 md:bottom-32 flex flex-col gap-2 z-10">
          <button className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-md flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors mb-2">
            <Compass className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
          <div className="flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
            <button className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 transition-colors">
              <Plus className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <Minus className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </button>
          </div>
          <button className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-md flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors mt-2">
            <Crosshair className="w-5 h-5 text-blue-500" />
          </button>
        </div>

        {/* Bottom Sheet */}
        <div className="absolute bottom-0 left-0 right-0 md:left-4 md:bottom-4 md:right-auto md:w-[420px] bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-20 overflow-hidden flex flex-col transition-all duration-300">
          <div
            className="bg-emerald-600 text-white cursor-pointer touch-none select-none z-10"
            onClick={() => setIsExpanded(!isExpanded)}
            onPointerDown={(e) => setTouchStartY(e.clientY)}
            onPointerUp={(e) => {
              if (touchStartY === null) return;
              const deltaY = e.clientY - touchStartY;
              if (deltaY > 30) setIsExpanded(false);
              if (deltaY < -30) setIsExpanded(true);
              setTouchStartY(null);
            }}
          >
            <div className="w-full flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-emerald-400/60 rounded-full" />
            </div>

            <div className="px-6 pb-4 pt-1 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Navigation className="w-6 h-6 fill-white" />
                  Live GPS
                </h1>
                <p className="text-emerald-100 font-medium text-sm mt-1">Real-time tracking & prediction</p>
              </div>
              <button
                className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center hover:bg-emerald-400 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Search className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className={`flex flex-col transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[600px] p-6 gap-6 opacity-100' : 'max-h-0 px-6 py-0 gap-0 opacity-0'}`}>
            <div className="flex gap-4">
              <div className={`flex-1 rounded-xl p-3 flex flex-col items-center justify-center ${predictionEnabled ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-800'}`}>
                <Zap className="w-5 h-5 mb-1" />
                <span className="text-xs font-bold uppercase tracking-wider">{predictionEnabled ? 'Predicting' : 'Naive Lag'}</span>
              </div>
              <div className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 flex flex-col items-center justify-center text-slate-700 dark:text-slate-300">
                <Wifi className="w-5 h-5 mb-1 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider">{ping}ms Latency</span>
              </div>
              <div className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 flex flex-col items-center justify-center text-slate-700 dark:text-slate-300">
                <AlertTriangle className="w-5 h-5 mb-1 text-orange-500" />
                <span className="text-xs font-bold uppercase tracking-wider">{corrections} Snaps</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Velocity Prediction</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Extrapolate between 1Hz GPS updates</span>
                </div>
                <button
                  onClick={() => setPredictionEnabled(!predictionEnabled)}
                  className={`w-14 h-8 rounded-full transition-colors relative ${predictionEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${predictionEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Show Ghosts</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">View raw GPS & delayed positions</span>
                </div>
                <button
                  onClick={() => setShowGhosts(!showGhosts)}
                  className={`w-14 h-8 rounded-full transition-colors relative ${showGhosts ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${showGhosts ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-400 text-center flex items-center justify-center gap-1 mt-2">
              <Settings2 className="w-3 h-3" />
              Smoothing animates marker between 1s GPS ticks
            </div>
          </div>
        </div>
      </div>
    </APIProvider>
  );
}
