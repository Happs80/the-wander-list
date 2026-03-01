const geocodeCache: Record<string, { lat: number; lng: number } | null> = {};

async function tryGeocode(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return { lat: data.results[0].latitude, lng: data.results[0].longitude };
    }
    return null;
  } catch {
    return null;
  }
}

export async function geocodeLocationName(name: string): Promise<{ lat: number; lng: number } | null> {
  const key = name.trim().toLowerCase();
  if (key in geocodeCache) {
    return geocodeCache[key];
  }

  const fullName = name.trim();
  let result = await tryGeocode(fullName);

  if (!result) {
    const parts = fullName.split(/[,\-]+/).map(p => p.trim()).filter(Boolean);
    for (const part of parts) {
      result = await tryGeocode(part);
      if (result) break;
    }
  }

  if (!result) {
    const words = fullName.replace(/[,\-]+/g, ' ').split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      result = await tryGeocode(words[words.length - 1]);
    }
  }

  geocodeCache[key] = result;
  return result;
}
