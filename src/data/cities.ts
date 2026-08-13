// 座標は Nominatim の行政区画ノード（「○○市」で検索）と突合済み（2026-08-13）。
// jyoti-app/test_reading.py に同名の CITIES があり、内容がドリフトしている（要同期・別セッション管轄）。
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
  北九州: { lat: 33.883, lng: 130.8749 },
  堺: { lat: 34.5737, lng: 135.4829 },
  新潟: { lat: 37.9164, lng: 139.0365 },
  浜松: { lat: 34.7108, lng: 137.7261 },
  静岡: { lat: 34.9756, lng: 138.3828 },
  岡山: { lat: 34.6554, lng: 133.9195 },
  熊本: { lat: 32.8032, lng: 130.7079 },
  鹿児島: { lat: 31.5966, lng: 130.5571 },
  那覇: { lat: 26.2124, lng: 127.6809 },
  金沢: { lat: 36.5613, lng: 136.6562 },
};

// デフォルト都市（一致しない場合）
export const DEFAULT_CITY = { lat: 35.6762, lng: 139.6503 }; // 東京

export function findCity(name: string): { lat: number; lng: number } {
  // 緯経度入力（例: "35.68, 139.76"）。全角数字・区切りの混入や過剰な小数桁も許容。
  const normalized = name
    // 全角数字 → 半角
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    // 和文読点・全角カンマ → 半角カンマ
    .replace(/[、，]/g, ",")
    // 全角ピリオド → 半角ピリオド
    .replace(/．/g, ".")
    // 全角マイナス → 半角マイナス
    .replace(/[－−]/g, "-")
    // 全角スペース → 半角スペース
    .replace(/　/g, " ");
  const coordMatch = normalized.match(
    /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/
  );
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      // 小数点以下4桁に丸め（Google 座標の長い桁対策。浮動小数点誤差を避けるため toFixed を使用）
      const cut = (v: number) => parseFloat(v.toFixed(4));
      return { lat: cut(lat), lng: cut(lng) };
    }
  }

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
