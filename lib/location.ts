export async function isInCantanhede(lat: number, lng: number): Promise<boolean> {
  try {
    const url = "https://nominatim.openstreetmap.org/reverse?lat=" + lat + "&lon=" + lng + "&format=json&accept-language=pt";
    const response = await fetch(url);
    const data = await response.json();
    const address = data?.address ?? {};
    const city = (address.city ?? "").toLowerCase();
    const cityDistrict = (address.city_district ?? "").toLowerCase();
    const municipality = (address.municipality ?? "").toLowerCase();
    return (
      city.includes("cantanhede") ||
      cityDistrict.includes("cantanhede") ||
      municipality.includes("cantanhede")
    );
  } catch {
    return false;
  }
}

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

    const valid = await isInCantanhede(latNum, lngNum);
    if (!valid) return null;

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