# SmartRoute AI 🗺️ 🧠

**SmartRoute AI** is an intelligent navigation assistant that finds the best route based on your driving persona (e.g., "Relaxed Driver", "Speed Demon") using OpenRouteService and Google Gemini AI.

## 🚀 Features

* **Interactive Map:** Built with `react-leaflet` and OpenStreetMap.
* **Smart Routing:** Fetches routes via **OpenRouteService (ORS)**.
* **AI Analysis:** Uses **Google Gemini** to analyze routes and recommend the best one.
* **Modern UI:** Tailwind CSS with Light, Dark, and OLED Dark modes.
* **PWA Support:** Installable on Android/iOS as a Progressive Web App.

## 🛠️ Tech Stack

* **Framework:** Next.js 16+ (App Router)
* **Styling:** Tailwind CSS + `next-themes`
* **Maps:** `react-leaflet`, `leaflet`
* **Routing API:** OpenRouteService
* **AI:** Google Gemini (Generative AI SDK)
* **Geocoding:** Nominatim (OSM)
* **PWA:** `next-pwa`

## 📦 Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Cautioncrazy/Smart-Maps.git
    cd Smart-Maps
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the root directory:

    ```bash
    NEXT_PUBLIC_ORS_API_KEY=your_ors_api_key_here
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **Open the app:**
    Navigate to [http://localhost:3000](http://localhost:3000).

## 📝 Usage

1.  Enter Origin and Destination (or click on the map).
2.  Select your Driving Persona.
3.  Click "Find Smart Route".
4.  View the recommended route highlighted in green with AI reasoning.

### PWA Installation
- **Android (Chrome):** Open the menu (three dots) -> "Install App" or "Add to Home Screen".
- **iOS (Safari):** Tap "Share" -> "Add to Home Screen".

## 📄 License

Open Source.
