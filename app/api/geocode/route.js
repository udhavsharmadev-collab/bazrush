export async function GET(request) {
  try {
    const url = new URL(request.url);
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');

    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Using Open Street Map Nominatim API (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'User-Agent': 'Bazrush-Seller-App/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch address from geolocation service');
    }

    const data = await response.json();

    let address = '';
    if (data.address) {
      const addressParts = [
        data.address.shop || data.address.building || '',
        data.address.road || '',
        data.address.suburb || data.address.neighbourhood || '',
        data.address.city || data.address.town || '',
        data.address.state || '',
        data.address.postcode || '',
      ].filter(Boolean);

      address = addressParts.join(', ');
    }

    if (!address) {
      address = `${lat}, ${lng}`;
    }

    return new Response(JSON.stringify({ address }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get address from location' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
