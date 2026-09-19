/**
 * Crowdsourced Hazard Radar ("Waze for the Blind")
 * 
 * رادار المخاطر الجماعي التشاركي لتطبيق "نور دهب"
 * يتيح للمكفوفين تسجيل وتنبيه بعضهم البعض استباقياً بالحفر والعوائق الخطيرة في الشوارع.
 */

import { collection, addDoc, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export interface CrowdsourcedHazard {
  id: string;
  lat: number;
  lon: number;
  description: string; // مثل: حفرة، رصيف مكسور، كابل كهرباء مكشوف، عمود
  createdAt: number;
  reportedBy?: string;
}

// كاش محلي للعوائق لتجنب استعلامات متكررة
let localHazardsCache: CrowdsourcedHazard[] = [];
let lastFetchTime = 0;

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * تسجيل خطر أو حفرة جديدة في الشارع لتنبيه بقية المكفوفين
 */
export async function reportCrowdHazard(
  lat: number,
  lon: number,
  description: string,
  reportedBy: string = "كفيف كريم"
): Promise<boolean> {
  try {
    const hazardData = {
      lat,
      lon,
      description,
      reportedBy,
      createdAt: Date.now(),
    };

    await addDoc(collection(db, "crowd_hazards"), hazardData);
    localHazardsCache.push({ id: `h_${Date.now()}`, ...hazardData });
    return true;
  } catch (err) {
    console.warn("Could not save crowd hazard:", err);
    return false;
  }
}

/**
 * فحص المخاطر المسجلة استباقياً على بعد 20 متراً من موقع الكفيف الحالي
 */
export async function checkProactiveNearbyHazards(
  userLat: number,
  userLon: number
): Promise<{ hasHazard: boolean; warningText?: string; distanceMeters?: number }> {
  if (!userLat || !userLon) return { hasHazard: false };

  try {
    // تحديث الكاش كل 5 دقائق (أحدث 100 خطر لحماية الذاكرة وسرعة البحث)
    if (Date.now() - lastFetchTime > 300000 || localHazardsCache.length === 0) {
      const q = query(collection(db, "crowd_hazards"), limit(100));
      const snap = await getDocs(q);
      localHazardsCache = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      lastFetchTime = Date.now();
    }

    for (const h of localHazardsCache) {
      const dist = calculateDistanceMeters(userLat, userLon, h.lat, h.lon);
      if (dist <= 20) {
        return {
          hasHazard: true,
          distanceMeters: dist,
          warningText: `خلي بالك استباقياً: على بعد ${dist} متر قدامك خطر مسجل: "${h.description}". امشِ بحذر.`,
        };
      }
    }
  } catch (err) {
    console.warn("Proactive hazard check error:", err);
  }

  return { hasHazard: false };
}
