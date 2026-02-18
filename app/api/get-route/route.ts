import { NextResponse } from 'next/server';
import axios from 'axios';

const ORS_API_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY;

export async function POST(request: Request) {
  if (!ORS_API_KEY) {
    return NextResponse.json({ error: 'ORS API Key missing' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { start, end } = body;

    if (!start || !end) {
      return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    // ORS expects [lon, lat]
    const coordinates = [
      [start[1], start[0]],
      [end[1], end[0]],
    ];

    const response = await axios.post(
      'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
      {
        coordinates,
        alternative_routes: { target_count: 3 }
      },
      {
        headers: {
          Authorization: ORS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    let details;
    if (axios.isAxiosError(error)) {
      console.error('ORS Error:', error.response?.data || error.message);
      details = error.response?.data || error.message;
    } else {
      console.error('ORS Error:', error);
      details = 'Unknown error';
    }

    return NextResponse.json({ error: 'Routing failed', details }, { status: 500 });
  }
}
