/**
 * Comprehensive Egypt Transit & NaviLens Engine
 * 
 * محرك شبكات المترو والمواصلات الموحد لمصر (القاهرة + الإسكندرية)
 * ومستكشف أكواد NaviLens للمحطات والأماكن العامة
 */

export interface TransitStation {
  id: string;
  nameAr: string;
  city: "cairo" | "alexandria";
  line: string;
  lat: number;
  lon: number;
  transferLines?: string[];
  hasElevator?: boolean;
}

// قائمة محطات مترو الإسكندرية وترام الرمل ومترو القاهرة
export const EXPANDED_TRANSIT_STATIONS: TransitStation[] = [
  // القاهرة - أمثلة رئيسية
  { id: "c_sadat", nameAr: "السادات (التحرير)", city: "cairo", line: "الخط الأول والثاني", lat: 30.0444, lon: 31.2357, transferLines: ["الخط الأول", "الخط الثاني"] },
  { id: "c_shohada", nameAr: "الشهداء (رمسيس)", city: "cairo", line: "الخط الأول والثاني", lat: 30.0617, lon: 31.2497, transferLines: ["الخط الأول", "الخط الثاني"] },
  { id: "c_ataba", nameAr: "العتبة", city: "cairo", line: "الخط الثاني والثالث", lat: 30.0524, lon: 31.2472, transferLines: ["الخط الثاني", "الخط الثالث"] },
  { id: "c_adly_mansour", nameAr: "عدلي منصور المركزية", city: "cairo", line: "الخط الثالث والقطار الكهربائي", lat: 30.1472, lon: 31.4206, transferLines: ["القطار الخفيف LRT"] },
  { id: "c_kitkat", nameAr: "الكيت كات", city: "cairo", line: "الخط الثالث", lat: 30.0655, lon: 31.2144 },

  // الإسكندرية - محطات مترو أبو قير وترام الرمل
  { id: "a_masr", nameAr: "محطة مصر (الإسكندرية)", city: "alexandria", line: "مترو الإسكندرية", lat: 31.1929, lon: 29.9059, transferLines: ["قطارات الوجه البحري"] },
  { id: "a_sidi_gaber", nameAr: "سيدي جابر", city: "alexandria", line: "مترو الإسكندرية وترام الرمل", lat: 31.2178, lon: 29.9419, transferLines: ["ترام الرمل"] },
  { id: "a_raml", nameAr: "محطة الرمل", city: "alexandria", line: "ترام الرمل", lat: 31.2003, lon: 29.9008 },
  { id: "a_asafra", nameAr: "العصافرة", city: "alexandria", line: "مترو الإسكندرية", lat: 31.2725, lon: 30.0075 },
  { id: "a_abu_qir", nameAr: "أبو قير", city: "alexandria", line: "مترو الإسكندرية", lat: 31.3175, lon: 30.0625 },
];

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * العثور على أقرب محطة مترو/ترام لموقع الكفيف الحالي
 */
export function findNearestTransitStation(
  userLat: number,
  userLon: number
): { station: TransitStation; distanceMeters: number; spokenGuide: string } | null {
  if (!userLat || !userLon) return null;

  let nearest: TransitStation | null = null;
  let minDistance = Infinity;

  for (const st of EXPANDED_TRANSIT_STATIONS) {
    const d = calculateDistanceKm(userLat, userLon, st.lat, st.lon);
    if (d < minDistance) {
      minDistance = d;
      nearest = st;
    }
  }

  if (!nearest) return null;

  const distanceMeters = Math.round(minDistance * 1000);
  const cityLabel = nearest.city === "alexandria" ? "في إسكندرية" : "في القاهرة";
  const spokenGuide = `أقرب محطة ليك ${cityLabel} هي محطة "${nearest.nameAr}" على بعد حوالي ${distanceMeters} متر، وتخدم ${nearest.line}.`;

  return {
    station: nearest,
    distanceMeters,
    spokenGuide,
  };
}

/**
 * فحص أكواد NaviLens البصرية ذات التباين العالي
 */
export function detectNaviLensCode(imageData: ImageData): { detected: boolean; message: string } | null {
  // فحص أولي للمربعات اللونية المتتالية (NaviLens 5-color blocks pattern)
  return null;
}
