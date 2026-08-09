// --- Helper function to geocode address via OpenStreetMap ---
const fetchCoordinates = async (address, city, venueName) => {
  try {
    const headers = { "User-Agent": "ShowBookingApp/1.0" };

    // Attempt 1: Full details
    let query = encodeURIComponent(`${venueName}, ${city}`);
    let response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
      { headers }
    );
    let data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }

    // Attempt 2: Just Address & City
    // query = encodeURIComponent(`${address}, ${city}`);
    // response = await fetch(
    //   `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
    //   { headers }
    // );
    // data = await response.json();

    // if (Array.isArray(data) && data.length > 0) {
    //   return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    // }

    // Attempt 3: Just City (Broadest fallback to guarantee base coordinates)
    // query = encodeURIComponent(`${city}`);
    // response = await fetch(
    //   `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
    //   { headers }
    // );
    // data = await response.json();

    // if (Array.isArray(data) && data.length > 0) {
    //   return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    // }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

export default fetchCoordinates;