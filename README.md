# SmartRoute AI 🗺️ 🧠

**SmartRoute AI** is a web application that revolutionizes navigation by combining real-time Google Maps data with the reasoning capabilities of Google's Gemini AI. Instead of simply finding the *fastest* route, this app analyzes route characteristics to recommend the *smartest* option based on safety, scenery, and driving complexity.

## 🚀 Features

* **Interactive Map:** Fully integrated Google Maps interface using the Maps JavaScript API.
* **Intelligent Routing:** Fetches standard driving directions (fastest, shortest, eco-friendly) via the Directions API.
* **AI Analysis:** Uses Gemini (via Google Generative AI SDK) to "read" the route data—analyzing turn complexity, highway usage, and distance.
* **Smart Recommendations:** Highlights the route that best fits a specific persona (e.g., "The Relaxed Driver" or "The Sightseer") and explains *why* in natural language.
* **Modern UI:** Built with Next.js 14 (App Router) and styled with Tailwind CSS for a responsive experience.

## 🛠️ Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (React)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Maps:** [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript) & `react-google-maps` (or `@googlemaps/js-api-loader`)
* **AI:** [Google Gemini API](https://ai.google.dev/) (Generative AI SDK)

## 📦 Prerequisites

Before running this project, you need API keys from Google:

1.  **Google Maps API Key:**
    * Go to the [Google Cloud Console](https://console.cloud.google.com/).
    * Enable the **Maps JavaScript API** and **Directions API**.
    * Create an API key.
2.  **Gemini API Key:**
    * Go to [Google AI Studio](https://aistudio.google.com/).
    * Create an API key for the Gemini Flash or Pro model.

## ⚡ Getting Started

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/smartroute-ai.git](https://github.com/your-username/smartroute-ai.git)
    cd smartroute-ai
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the root directory and add your keys:

    ```bash
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key_here
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **Open the app:**
    Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

```text
smartroute-ai/
├── app/
│   ├── api/
│   │   └── analyze-route/  # Server endpoint calling Gemini
│   ├── components/
│   │   ├── Map.tsx         # Google Maps rendering logic
│   │   └── RouteForm.tsx   # Input for Origin/Destination
│   ├── page.tsx            # Main layout
│   └── layout.tsx
├── public/
├── .env.local              # API Keys (Do not commit this!)
└── README.md
