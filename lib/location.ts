type Point = { lat: number; lng: number };

const CANTANHEDE_POLYGON: Point[] = [
  { lat: 40.4900, lng: -8.6800 },
  { lat: 40.4900, lng: -8.5800 },
  { lat: 40.4500, lng: -8.4600 },
  { lat: 40.3800, lng: -8.4300 },
  { lat: 40.3000, lng: -8.4600 },
  { lat: 40.2500, lng: -8.5000 },
  { lat: 40.2300, lng: -8.5800 },
  { lat: 40.2500, lng: -8.6800 },
  { lat: 40.2900, lng: -8.7500 },
  { lat: 40.3500, lng: -8.7600 },
  { lat: 40.4200, lng: -8.7500 },
  { lat: 40.4900, lng: -8.6800 },
];

function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  const { lat: y, lng: x } = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

export async function isInCantanhede(lat: number, lng: number): Promise<boolean> {
  return isPointInPolygon({ lat, lng }, CANTANHEDE_POLYGON);
}

export async function validateManualAddress(address: string): Promise<{
  lat: number;
  lng: number;
  displayAddress: string;
} | null> {
  try {
    const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

    if (!GOOGLE_KEY) {
      console.warn("Google Maps key não configurada");
      return null;
    }

    const query = encodeURIComponent(address + ", Cantanhede, Portugal");
    const url =
      "https://maps.googleapis.com/maps/api/geocode/json?address=" +
      query +
      "&key=" +
      GOOGLE_KEY +
      "&region=pt&language=pt";

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      console.log("Google Geocoding sem resultados:", data.status);
      return null;
    }

    for (const result of data.results) {
      const { lat, lng } = result.geometry.location;

      // Verifica se está dentro do polígono do concelho
      if (!isPointInPolygon({ lat, lng }, CANTANHEDE_POLYGON)) continue;

      return {
        lat,
        lng,
        displayAddress: result.formatted_address,
      };
    }

    // Nenhum resultado dentro do concelho
    return null;
  } catch (e) {
    console.log("Erro no geocoding:", e);
    return null;
  }
}

export const OUT_OF_BOUNDS_MESSAGE =
  "A localização indicada está fora do concelho de Cantanhede. " +
  "Só é possível reportar ocorrências dentro do concelho.";

export const ADDRESS_NOT_FOUND_MESSAGE =
  "Não foi possível encontrar essa morada no concelho de Cantanhede. " +
  "Tenta ser mais específico (ex: Rua X, Cantanhede).";