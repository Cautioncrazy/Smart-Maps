# SmartRoute AI Architecture

## Major Architectural Shift

The SmartRoute AI application has undergone a complete rewrite of its frontend mapping infrastructure. The application previously utilized `react-leaflet` with OpenStreetMap tiles. This has been entirely replaced with the Google Maps API, utilizing the `@vis.gl/react-google-maps` React wrapper.

This change provides a more robust, recognizable mapping experience and supports modern, high-performance features like `AdvancedMarker`. The OpenRouteService logic has also been removed in favor of focusing purely on real-time live GPS tracking on the Google Maps background.

## API Dependencies

The application now requires a Google Maps API key to function.

*   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Must be set in `.env.local`. This key needs to have the Maps JavaScript API enabled in the Google Cloud Console.

## Data Flow: Real-time Geolocation & Smoothing

Because real-world GPS (`navigator.geolocation.watchPosition()`) typically only fires at about 1Hz (once per second), instantly snapping the marker to each new position creates a jerky, unpleasant user experience.

To solve this, the application implements a custom physics simulation loop using `requestAnimationFrame` that handles **velocity prediction** and **linear interpolation (lerp)** to smoothly animate the marker between those 1Hz ticks.

The data flow works as follows:

1.  **Hardware GPS Polling:** `watchPosition` retrieves the user's real location.
2.  **Velocity Calculation:** When a new position arrives, the system calculates the velocity vector based on the difference between the new position and the last known position over time.
3.  **Network Simulation (Optional):** The new GPS position is pushed to a `packetQueue` to simulate arriving data packets.
4.  **Prediction Engine (`loop`):** Running at 60fps via `requestAnimationFrame`:
    *   It checks the last processed GPS position.
    *   If **Prediction is Enabled**, it uses the calculated velocity to extrapolate *forward* in time, predicting where the user should be right now between the 1Hz updates.
    *   If Prediction is disabled (Naive Lag), it targets the raw, un-extrapolated last known GPS point.
5.  **Smoothing (Lerp):** The client's visible map marker (`clientPos`) does not snap instantly to the predicted target. Instead, it uses `lerp` to smoothly slide towards the target position every frame.
6.  **Rendering:** The `<CarMarker>` component renders the visible car, and optionally renders "Ghosts" (the raw server position and the last processed un-extrapolated packet) to visualize the netcode and smoothing math in real-time.