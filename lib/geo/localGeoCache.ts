// ============================================================================
// Noor Dahab — Local Geo Cache (IndexedDB)
// يحمّل جميع شوارع وأماكن المنطقة ويخزنها محلياً للكفيف
// يغطي مصر كلها عبر OpenStreetMap/Overpass بدون أي ملف مضغوط
// ============================================================================

const DB_NAME = "NoorDahabGeoDB";
const DB_VERSION = 1;
const STORE_NAME = "geoCache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MOVE_THRESHOLD_M = 800; // re-fetch if moved > 800m
const RADIUS_M = 3000; // 3km radius

export interface GeoFeature {
  id: number;
  type: "street" | "poi";
  name: string;
  nameAr: string;
  lat: number;
  lon: number;
  category: string;
  categoryAr: string;
}

export interface GeoCacheEntry {
  centerLat: number;
  centerLon: number;
  radiusM: number;
  cachedAt: number;
  features: GeoFeature[];
}

// ── IndexedDB helpers ──────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGet(key: string): Promise<any> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function dbSet(key: string, value: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ key, value });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Haversine distance ─────────────────────────────────────────────────────────

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

// ── Main: Ensure geo cache is fresh ───────────────────────────────────────────

let prefetchInProgress = false;

export async function ensureGeoCached(
  lat: number,
  lon: number,
  onStatus?: (msg: string) => void
): Promise<GeoCacheEntry | null> {
  if (typeof indexedDB === "undefined") return null;
  if (prefetchInProgress) return null;

  try {
    const existing: GeoCacheEntry | null = await dbGet("current_area");

    // Check if we have valid fresh data close enough to current location
    if (existing) {
      const age = Date.now() - existing.cachedAt;
      const dist = haversineMeters(lat, lon, existing.centerLat, existing.centerLon);

      if (age < CACHE_TTL_MS && dist < MOVE_THRESHOLD_M) {
        // Cache is fresh and user hasn't moved much — use it
        return existing;
      }
    }

    // Need to fetch new data
    prefetchInProgress = true;
    onStatus?.("جاري تحميل خريطة منطقتك للمرة الأولى...");

    const res = await fetch(
      `/api/geo/prefetch?lat=${lat}&lon=${lon}&radius=${RADIUS_M}`,
      { signal: AbortSignal.timeout(35000) }
    );

    if (!res.ok) {
      prefetchInProgress = false;
      return null;
    }

    const data = await res.json();
    if (!data.success || !data.features) {
      prefetchInProgress = false;
      return null;
    }

    const entry: GeoCacheEntry = {
      centerLat: lat,
      centerLon: lon,
      radiusM: RADIUS_M,
      cachedAt: Date.now(),
      features: data.features,
    };

    await dbSet("current_area", entry);
    prefetchInProgress = false;

    const streets = entry.features.filter((f) => f.type === "street").length;
    const pois = entry.features.filter((f) => f.type === "poi").length;
    onStatus?.(
      `تم تحميل خريطة منطقتك بنجاح: ${streets} شارع و${pois} مكان داخل ${RADIUS_M / 1000} كيلومتر.`
    );

    return entry;
  } catch (err) {
    prefetchInProgress = false;
    console.warn("LocalGeoCache error:", err);
    return null;
  }
}

// ── Lookup: find nearest streets/POIs to given coordinates ────────────────────

export function findNearbyFromCache(
  cache: GeoCacheEntry,
  lat: number,
  lon: number,
  radiusM = 300,
  maxResults = 5
): GeoFeature[] {
  if (!cache?.features?.length) return [];

  const withDist = cache.features
    .map((f) => ({
      ...f,
      distM: haversineMeters(lat, lon, f.lat, f.lon),
    }))
    .filter((f) => f.distM <= radiusM);

  // Sort: streets first, then by distance
  withDist.sort((a, b) => {
    if (a.type === "street" && b.type !== "street") return -1;
    if (a.type !== "street" && b.type === "street") return 1;
    return a.distM - b.distM;
  });

  return withDist.slice(0, maxResults);
}

// ── Build a rich Arabic location description from local cache ─────────────────

export function buildLocalLocationText(
  cache: GeoCacheEntry | null,
  lat: number,
  lon: number
): string {
  if (!cache) return "";

  const nearby = findNearbyFromCache(cache, lat, lon, 400, 8);
  if (!nearby.length) return "";

  const streets = nearby.filter((f) => f.type === "street");
  const pois = nearby.filter((f) => f.type === "poi");

  let parts: string[] = [];

  if (streets.length > 0) {
    const mainStreet = streets[0];
    parts.push(mainStreet.nameAr);
    if (streets.length > 1) {
      parts.push(`(قريب من ${streets[1].nameAr})`);
    }
  }

  if (pois.length > 0) {
    const poi = pois[0];
    const dist = Math.round(haversineMeters(lat, lon, poi.lat, poi.lon));
    parts.push(`بجانب ${poi.categoryAr} ${poi.nameAr} (${dist} متر)`);
  }

  return parts.join(" ");
}

// ── Get cache stats for admin/debug ───────────────────────────────────────────

export async function getGeoCacheStats(): Promise<{
  hasCachedData: boolean;
  featureCount: number;
  streetsCount: number;
  poisCount: number;
  cachedAt: string;
  ageMinutes: number;
  centerLat: number;
  centerLon: number;
} | null> {
  if (typeof indexedDB === "undefined") return null;
  const entry: GeoCacheEntry | null = await dbGet("current_area");
  if (!entry) return null;

  const streets = entry.features.filter((f) => f.type === "street").length;
  const pois = entry.features.filter((f) => f.type === "poi").length;
  const ageMs = Date.now() - entry.cachedAt;

  return {
    hasCachedData: true,
    featureCount: entry.features.length,
    streetsCount: streets,
    poisCount: pois,
    cachedAt: new Date(entry.cachedAt).toLocaleString("ar-EG"),
    ageMinutes: Math.round(ageMs / 60000),
    centerLat: entry.centerLat,
    centerLon: entry.centerLon,
  };
}
