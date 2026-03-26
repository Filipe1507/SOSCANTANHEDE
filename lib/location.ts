type Point = { lat: number; lng: number };

const CANTANHEDE_POLYGON: Point[] = [
  { lat: 40.4800, lng: -8.7200 },
  { lat: 40.4900, lng: -8.6200 },
  { lat: 40.4700, lng: -8.5200 },
  { lat: 40.4200, lng: -8.4500 },
  { lat: 40.3500, lng: -8.4400 },
  { lat: 40.2800, lng: -8.4800 },
  { lat: 40.2600, lng: -8.5600 },
  { lat: 40.2900, lng: -8.6500 },
  { lat: 40.3500, lng: -8.7100 },
  { lat: 40.4200, lng: -8.7400 },
  { lat: 40.4800, lng: -8.7200 },
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

export function isInCantanhede(lat: number, lng: number): boolean {
  return isPointInPolygon({ lat, lng }, CANTANHEDE_POLYGON);
}

/**
 * Valida uma morada escrita manualmente.
 * Faz geocoding via Nominatim e verifica se está no concelho de Cantanhede.
 * Devolve as coordenadas se válida, ou null se fora do concelho ou não encontrada.
 */
export async function validateManualAddress(address: string): Promise<{
  lat: number;
  lng: number;
  displayAddress: string;
} | null> {
  try {
    const query = encodeURIComponent(address + ", Cantanhede, Portugal");
    const url =
      "https://nominatim.openstreetmap.org/search?q=" +
      query +
      "&format=json&limit=1&accept-language=pt";

    const response = await fetch(url);
    const results = await response.json();

    if (!results || results.length === 0) return null;

    const { lat, lon, display_name } = results[0];
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lon);

    if (!isInCantanhede(latNum, lngNum)) return null;

    return { lat: latNum, lng: lngNum, displayAddress: display_name };
  } catch {
    return null;
  }
}

export const OUT_OF_BOUNDS_MESSAGE =
  "A localização indicada está fora do concelho de Cantanhede. " +
  "Só é possível reportar ocorrências dentro do concelho.";

export const ADDRESS_NOT_FOUND_MESSAGE =
  "Não foi possível encontrar essa morada no concelho de Cantanhede. " +
  "Tenta ser mais específico (ex: Rua X, Cantanhede).";