'use client';

import { useState } from 'react';

interface RouteFormProps {
  onSearch: (origin: string, destination: string, persona: string) => void;
  isLoading: boolean;
  origin: string;
  destination: string;
  setOrigin: (val: string) => void;
  setDestination: (val: string) => void;
}

export default function RouteForm({ onSearch, isLoading, origin, destination, setOrigin, setDestination }: RouteFormProps) {
  const [persona, setPersona] = useState('Relaxed Driver');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(origin, destination, persona);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-card-border p-6 rounded-lg shadow-md space-y-4 transition-colors">
      <h2 className="text-xl font-bold mb-4 text-foreground">Plan Your Journey</h2>

      <div>
        <label htmlFor="origin" className="block text-sm font-medium text-foreground/80">Origin</label>
        <input
          id="origin"
          type="text"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="e.g. Times Square, NY"
          className="mt-1 block w-full rounded-md border-card-border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-input text-foreground"
          required
        />
      </div>

      <div>
        <label htmlFor="destination" className="block text-sm font-medium text-foreground/80">Destination</label>
        <input
          id="destination"
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="e.g. Central Park, NY"
          className="mt-1 block w-full rounded-md border-card-border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-input text-foreground"
          required
        />
      </div>

      <div>
        <label htmlFor="persona" className="block text-sm font-medium text-foreground/80">Driving Persona</label>
        <select
          id="persona"
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          className="mt-1 block w-full rounded-md border-card-border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-input text-foreground"
        >
          <option value="Relaxed Driver">Relaxed Driver (Safety & Scenery)</option>
          <option value="Speed Demon">Early Bird (Fastest & Efficient)</option>
          <option value="Sightseer">Sightseer (Scenic Route)</option>
          <option value="Cautious Driver">Cautious Driver (Avoid Complexity)</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
          isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
        }`}
      >
        {isLoading ? 'Analyzing Routes...' : 'Find Smart Route'}
      </button>
    </form>
  );
}
