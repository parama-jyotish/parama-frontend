export const CITIES: Record<string, { lat: number; lng: number }> = {
  東京: { lat: 35.6762, lng: 139.6503 },
  大阪: { lat: 34.6937, lng: 135.5023 },
  名古屋: { lat: 35.1815, lng: 136.9066 },
  札幌: { lat: 43.0618, lng: 141.3545 },
  福岡: { lat: 33.5902, lng: 130.4017 },
  京都: { lat: 35.0116, lng: 135.7681 },
  横浜: { lat: 35.4437, lng: 139.638 },
  神戸: { lat: 34.6901, lng: 135.1956 },
  仙台: { lat: 38.2682, lng: 140.8694 },
  広島: { lat: 34.3853, lng: 132.4553 },
  さいたま: { lat: 35.8617, lng: 139.6455 },
  千葉: { lat: 35.6073, lng: 140.1063 },
  新潟: { lat: 37.9026, lng: 139.0232 },
  浜松: { lat: 34.7108, lng: 137.7261 },
  静岡: { lat: 34.9756, lng: 138.3828 },
  岡山: { lat: 34.6617, lng: 133.935 },
  熊本: { lat: 32.8032, lng: 130.7079 },
  鹿児島: { lat: 31.5966, lng: 130.5571 },
  那覇: { lat: 26.2124, lng: 127.6809 },
  金沢: { lat: 36.5613, lng: 136.6562 },
};

// デフォルト都市（一致しない場合）
export const DEFAULT_CITY = { lat: 35.6762, lng: 139.6503 }; // 東京

export function findCity(name: string): { lat: number; lng: number } {
  // 完全一致
  if (CITIES[name]) return CITIES[name];

  // 部分一致
  for (const [cityName, coords] of Object.entries(CITIES)) {
    if (name.includes(cityName) || cityName.includes(name)) {
      return coords;
    }
  }

  return DEFAULT_CITY;
}
