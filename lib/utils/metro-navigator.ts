import { CAIRO_METRO_STATIONS, MetroStation } from "@/lib/data/cairo-metro";

export interface NearestMetroResult {
  station: MetroStation;
  distanceMeters: number;
  walkingMinutes: number;
  walkingSteps: number;
  bearingDegrees: number;
  directionAr: string;
  spokenText: string;
}

/**
 * Calculates Great-Circle distance between two GPS coordinates using Haversine formula in meters.
 */
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calculates bearing from point 1 to point 2 in degrees (0 - 360).
 */
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = lat1 * (Math.PI / 180);
  const φ2 = lat2 * (Math.PI / 180);
  const Δλ = (lon2 - lon1) * (Math.PI / 180);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return Math.round(((θ * 180) / Math.PI + 360) % 360);
}

function bearingToDirectionAr(bearing: number): string {
  if (bearing >= 337.5 || bearing < 22.5) return "الشمال";
  if (bearing >= 22.5 && bearing < 67.5) return "الشمال الشرقي";
  if (bearing >= 67.5 && bearing < 112.5) return "الشرق";
  if (bearing >= 112.5 && bearing < 157.5) return "الجنوب الشرقي";
  if (bearing >= 157.5 && bearing < 202.5) return "الجنوب";
  if (bearing >= 202.5 && bearing < 247.5) return "الجنوب الغربي";
  if (bearing >= 247.5 && bearing < 292.5) return "الغرب";
  return "الشمال الغربي";
}

/**
 * Finds the nearest Cairo metro station to given user coordinates.
 */
export function findNearestMetroStation(
  userLat: number,
  userLon: number,
  userHeading?: number
): NearestMetroResult | null {
  if (!userLat || !userLon) return null;

  let minDistance = Infinity;
  let nearestStation: MetroStation | null = null;
  let targetBearing = 0;

  for (const station of CAIRO_METRO_STATIONS) {
    const dist = calculateDistanceMeters(userLat, userLon, station.lat, station.lon);
    if (dist < minDistance) {
      minDistance = dist;
      nearestStation = station;
      targetBearing = calculateBearing(userLat, userLon, station.lat, station.lon);
    }
  }

  if (!nearestStation) return null;

  // Average walking speed: 80 meters/min (~1.3 m/s), ~1.3 steps per meter
  const walkingMinutes = Math.max(1, Math.round(minDistance / 75));
  const walkingSteps = Math.round(minDistance * 1.3);
  const directionAr = bearingToDirectionAr(targetBearing);

  // Relative clock direction if user heading is provided
  let relativeDirection = "";
  if (userHeading !== undefined && !isNaN(userHeading)) {
    const diff = (targetBearing - userHeading + 360) % 360;
    if (diff <= 25 || diff >= 335) {
      relativeDirection = "قدامك مباشرة";
    } else if (diff > 25 && diff < 160) {
      relativeDirection = "على يمينك";
    } else if (diff >= 160 && diff <= 200) {
      relativeDirection = "وراك";
    } else {
      relativeDirection = "على شمالك";
    }
  }

  // Format Egyptian Spoken Text
  let distancePhrase = "";
  if (minDistance < 50) {
    distancePhrase = "أنت قدام مدخل المحطة تقريباً، على بعد خطوات بسيطة";
  } else if (minDistance < 1000) {
    distancePhrase = `على بعد حوالي ${minDistance} متر (حوالي ${walkingMinutes} دقائق مشي)`;
  } else {
    const km = (minDistance / 1000).toFixed(1);
    distancePhrase = `على بعد ${km} كيلو متر`;
  }

  const directionPhrase = relativeDirection ? `، وهي ${relativeDirection}` : `، في اتجاه ${directionAr}`;
  const interchangePhrase = nearestStation.isInterchange ? " (محطة تبادلية بين الخطوط)" : "";

  const spokenText = `أقرب محطة مترو ليك هي محطة ${nearestStation.nameAr}${interchangePhrase}، ${nearestStation.lineNameAr}، ${distancePhrase}${directionPhrase}.`;

  return {
    station: nearestStation,
    distanceMeters: minDistance,
    walkingMinutes,
    walkingSteps,
    bearingDegrees: targetBearing,
    directionAr,
    spokenText
  };
}
