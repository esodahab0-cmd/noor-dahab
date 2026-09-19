import { NextRequest, NextResponse } from "next/server";
import { validateOrigin } from "@/lib/security/cors";

// ── Haversine distance in meters ──────────────────────────────────────────────
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Arabic label per amenity type ─────────────────────────────────────────────
const AMENITY_ARABIC: Record<string, string> = {
  mosque: "مسجد",
  place_of_worship: "مكان عبادة",
  church: "كنيسة",
  hospital: "مستشفى",
  clinic: "عيادة",
  doctors: "عيادة طب",
  pharmacy: "صيدلية",
  school: "مدرسة",
  university: "جامعة",
  college: "كلية",
  bank: "بنك",
  atm: "ماكينة صراف آلي",
  restaurant: "مطعم",
  cafe: "كافيه",
  fast_food: "وجبات سريعة",
  supermarket: "سوبرماركت",
  convenience: "بقالة",
  bakery: "فرن",
  fuel: "محطة بنزين",
  police: "قسم شرطة",
  post_office: "مكتب بريد",
  marketplace: "سوق",
  bus_station: "موقف أتوبيس",
  taxi: "موقف تاكسي",
};

// Priority order for picking best landmark (index 0 = highest priority)
const LANDMARK_PRIORITY = [
  "mosque",
  "hospital",
  "clinic",
  "doctors",
  "pharmacy",
  "school",
  "university",
  "bank",
  "police",
  "restaurant",
  "cafe",
  "supermarket",
  "fast_food",
  "bakery",
  "convenience",
  "fuel",
  "post_office",
  "place_of_worship",
  "bus_station",
];

interface NominatimPOI {
  lat: string;
  lon: string;
  type: string;
  name: string;
  display_name: string;
}

// ── Find nearest landmark using Nominatim search with viewbox ─────────────────
async function findNearbyLandmark(
  lat: number,
  lon: number
): Promise<{ name: string; type: string; arabicType: string; distanceM: number } | null> {
  // viewbox ~350m: 0.003 deg lat ≈ 333m, 0.0035 deg lon ≈ ~310m in Egypt
  const delta = 0.003;
  const viewbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;

  // Build parallel queries for the most useful amenity categories
  const queryGroups = [
    ["mosque", "place_of_worship", "church"],
    ["hospital", "clinic", "doctors"],
    ["pharmacy"],
    ["school", "university"],
    ["bank", "atm"],
    ["restaurant", "cafe", "fast_food"],
    ["supermarket", "convenience", "bakery"],
    ["fuel", "police", "post_office", "bus_station"],
  ];

  const headers = {
    "User-Agent": "NoorDahabApp/2.0 (contact: info@dahabsoftware.com)",
    "Accept-Language": "ar,ar-EG;q=0.9",
  };

  // Fire all groups in parallel with 4s timeout each
  const results = await Promise.allSettled(
    queryGroups.map(async (types) => {
      const typeQuery = types.join("|");
      const url = `https://nominatim.openstreetmap.org/search?format=json&accept-language=ar&amenity=${encodeURIComponent(typeQuery)}&limit=3&viewbox=${viewbox}&bounded=1`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      try {
        const res = await fetch(url, { headers, signal: controller.signal });
        if (!res.ok) return [];
        const data: NominatimPOI[] = await res.json();
        return data;
      } finally {
        clearTimeout(timer);
      }
    })
  );

  // Collect all POIs found
  const allPois: Array<{ name: string; type: string; arabicType: string; distanceM: number }> = [];

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const poi of result.value) {
      const poiLat = parseFloat(poi.lat);
      const poiLon = parseFloat(poi.lon);
      if (isNaN(poiLat) || isNaN(poiLon)) continue;
      const distanceM = haversineMeters(lat, lon, poiLat, poiLon);
      if (distanceM > 400) continue; // strict 400m radius
      const arabicType = AMENITY_ARABIC[poi.type] || poi.type;
      // name can be empty — still useful as type hint
      const name = poi.name?.trim() || "";
      allPois.push({ name, type: poi.type, arabicType, distanceM });
    }
  }

  if (allPois.length === 0) return null;

  // Sort: first by priority index, then by distance
  allPois.sort((a, b) => {
    const pa = LANDMARK_PRIORITY.indexOf(a.type);
    const pb = LANDMARK_PRIORITY.indexOf(b.type);
    const priorityA = pa === -1 ? 99 : pa;
    const priorityB = pb === -1 ? 99 : pb;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return a.distanceM - b.distanceM;
  });

  // Prefer named POIs, but fall back to unnamed if nothing has a name
  const named = allPois.find((p) => p.name);
  return named ?? allPois[0];
}

// ── Build natural Arabic sentence ─────────────────────────────────────────────
function buildSpokenText(
  street: string,
  area: string,
  city: string,
  landmark: { name: string; arabicType: string; distanceM: number } | null
): string {
  // Landmark phrase
  let landmarkPhrase = "";
  if (landmark) {
    const dist = Math.round(landmark.distanceM);
    if (landmark.name) {
      landmarkPhrase = `، بجانب ${landmark.arabicType} ${landmark.name} (على بُعد نحو ${dist} متر)`;
    } else {
      landmarkPhrase = `، بالقرب من ${landmark.arabicType} (على بُعد نحو ${dist} متر)`;
    }
  }

  if (street && area) {
    return `أنت دلوقتي في ${street}${landmarkPhrase}، منطقة ${area}${city ? `، ${city}` : ""}.`;
  } else if (street) {
    return `أنت دلوقتي في ${street}${landmarkPhrase}${city ? `، ${city}` : ""}.`;
  } else if (area) {
    return `أنت دلوقتي في منطقة ${area}${landmarkPhrase}${city ? `، ${city}` : ""}.`;
  } else if (city) {
    if (landmarkPhrase) {
      return `أنت متواجد في ${city}${landmarkPhrase}.`;
    }
    return `أنت متواجد حالياً في ${city}. اسم الشارع الفرعي لم يتم التعرف عليه بدقة بعد.`;
  }
  return "تم رصد إحداثيات موقعك عبر الـ GPS بنجاح، لكن جاري تحديث اسم الشارع.";
}

// ── Main GET handler ───────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Unauthorized Origin" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 });
  }

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  let street = "";
  let area = "";
  let city = "";
  let displayAddress = "";

  // ── 1. Nominatim Reverse Geocode ──────────────────────────────────────────
  const nominatimHeaders = {
    "User-Agent": "NoorDahabApp/2.0 (contact: info@dahabsoftware.com)",
    "Accept-Language": "ar,ar-EG;q=0.9",
  };

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ar&addressdetails=1&namedetails=1`,
      { headers: nominatimHeaders, next: { revalidate: 180 } }
    );

    if (res.ok) {
      const data = await res.json();
      const a = data.address || {};

      // Extract street name — prefer Arabic namedetails alt_name if cleaner
      const rawRoad = a.road || a.pedestrian || a.footway || a.street;
      if (rawRoad) {
        street =
          rawRoad.startsWith("شارع") ||
          rawRoad.startsWith("ميدان") ||
          rawRoad.startsWith("طريق") ||
          rawRoad.startsWith("كوبري")
            ? rawRoad
            : `شارع ${rawRoad}`;
      }

      // Alt name enrichment (Nominatim namedetails)
      const nameDetails = data.namedetails || {};
      const altName = nameDetails["alt_name:ar"] || nameDetails["alt_name"] || "";
      if (altName && altName !== rawRoad && !street.includes(altName)) {
        street = `${street} (المعروف بـ ${altName})`;
      }

      area = a.neighbourhood || a.suburb || a.city_district || a.quarter || a.village || "";
      city = a.city || a.town || a.county || a.state || "";
      displayAddress = data.display_name || "";
    }
  } catch (err) {
    console.warn("Nominatim reverse failed:", err);
  }

  // ── 2. Photon Fallback ────────────────────────────────────────────────────
  if (!street && !area && !city) {
    try {
      const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`);
      if (res.ok) {
        const data = await res.json();
        const props = data?.features?.[0]?.properties || {};
        if (props.street) street = `شارع ${props.street}`;
        else if (props.name) street = props.name;
        area = props.district || props.suburb || "";
        city = props.city || props.state || "";
      }
    } catch (err) {
      console.warn("Photon fallback failed:", err);
    }
  }

  // ── 3. Nearby Landmark Search (Parallel) ─────────────────────────────────
  let landmark: { name: string; arabicType: string; distanceM: number } | null = null;
  try {
    landmark = await findNearbyLandmark(latNum, lonNum);
  } catch (err) {
    console.warn("findNearbyLandmark failed:", err);
  }

  // ── 4. Build natural spoken sentence ────────────────────────────────────
  const spokenText = buildSpokenText(street, area, city, landmark);

  const combinedAddress =
    [street, area, city].filter(Boolean).join("، ") ||
    displayAddress ||
    "موقع محدد عبر الـ GPS";

  return NextResponse.json({
    success: true,
    latitude: latNum,
    longitude: lonNum,
    street,
    area,
    city,
    address: combinedAddress,
    landmark: landmark
      ? {
          name: landmark.name,
          type: landmark.arabicType,
          distanceM: Math.round(landmark.distanceM),
        }
      : null,
    spokenText,
  });
}
