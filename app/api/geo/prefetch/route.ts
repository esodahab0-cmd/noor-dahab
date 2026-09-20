import { NextRequest, NextResponse } from "next/server";
import { validateOrigin } from "@/lib/security/cors";

// ── Overpass API: Download all named streets + POIs within radius ──────────────
// Covers all Egypt (Cairo, Alex, Giza, Aswan, Sinai... everywhere OSM has data)

export async function GET(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const radius = Math.min(parseInt(searchParams.get("radius") || "3000"), 5000); // max 5km

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 });
  }

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  if (isNaN(latNum) || isNaN(lonNum)) {
    return NextResponse.json({ error: "Invalid lat/lon" }, { status: 400 });
  }

  // ── Overpass QL Query ────────────────────────────────────────────────────────
  // Downloads: named streets, alleyways, footpaths + all POIs within radius
  const overpassQuery = `
[out:json][timeout:30];
(
  way["highway"]["name"](around:${radius},${latNum},${lonNum});
  way["highway"]["name:ar"](around:${radius},${latNum},${lonNum});
  node["amenity"]["name"](around:${radius},${latNum},${lonNum});
  node["shop"]["name"](around:${radius},${latNum},${lonNum});
  node["tourism"]["name"](around:${radius},${latNum},${lonNum});
  node["public_transport"]["name"](around:${radius},${latNum},${lonNum});
);
out center tags qt;
`.trim();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 28000);

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "NoorDahabApp/2.0 (info@dahabsoftware.com)",
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      return NextResponse.json({ error: "Overpass API error", status: res.status }, { status: 502 });
    }

    const data = await res.json();
    const elements = data.elements || [];

    // ── Transform to compact format ─────────────────────────────────────────
    interface GeoFeature {
      id: number;
      type: "street" | "poi";
      name: string;
      nameAr: string;
      lat: number;
      lon: number;
      category: string;
      categoryAr: string;
    }

    const CATEGORY_AR: Record<string, string> = {
      // Amenities
      mosque: "مسجد", place_of_worship: "مكان عبادة", church: "كنيسة",
      hospital: "مستشفى", clinic: "عيادة", pharmacy: "صيدلية", doctors: "عيادة",
      school: "مدرسة", university: "جامعة", college: "كلية",
      bank: "بنك", atm: "ماكينة صراف", post_office: "بريد",
      restaurant: "مطعم", cafe: "كافيه", fast_food: "وجبات سريعة",
      fuel: "محطة بنزين", police: "شرطة", fire_station: "إطفاء",
      marketplace: "سوق", bus_station: "موقف أتوبيس", taxi: "موقف تاكسي",
      // Shops
      supermarket: "سوبرماركت", convenience: "بقالة", bakery: "فرن",
      butcher: "جزارة", greengrocer: "خضار", electronics: "إلكترونيات",
      // Transport
      station: "محطة مترو", stop_position: "موقف",
      // Tourism
      hotel: "فندق", museum: "متحف",
      // Roads
      residential: "شارع سكني", primary: "شارع رئيسي",
      secondary: "شارع فرعي", tertiary: "شارع فرعي",
      service: "ممر خدمة", footway: "ممشى", pedestrian: "منطقة مشاة",
      alley: "حارة", living_street: "شارع سكني هادي",
    };

    const features: GeoFeature[] = [];
    const seenNames = new Set<string>();

    for (const el of elements) {
      const tags = el.tags || {};
      // Arabic name first, then fallback to any name
      const nameAr = tags["name:ar"] || tags["name"] || "";
      const name = tags["name"] || tags["name:ar"] || "";
      if (!name && !nameAr) continue;

      const displayName = nameAr || name;
      // Skip duplicate names in same area
      if (seenNames.has(displayName)) continue;
      seenNames.add(displayName);

      // Get coordinates
      let lat2 = el.lat || el.center?.lat;
      let lon2 = el.lon || el.center?.lon;
      if (!lat2 || !lon2) continue;

      // Determine category
      const hw = tags["highway"];
      const am = tags["amenity"];
      const sh = tags["shop"];
      const pt = tags["public_transport"];
      const to = tags["tourism"];

      const rawCategory = hw || am || sh || pt || to || "general";
      const categoryAr = CATEGORY_AR[rawCategory] || rawCategory;

      // Prefix street name correctly in Arabic
      let finalNameAr = nameAr || name;
      if (hw) {
        if (!finalNameAr.startsWith("شارع") && !finalNameAr.startsWith("ميدان") &&
            !finalNameAr.startsWith("طريق") && !finalNameAr.startsWith("كوبري") &&
            !finalNameAr.startsWith("حارة") && !finalNameAr.startsWith("ممر")) {
          finalNameAr = `شارع ${finalNameAr}`;
        }
      }

      features.push({
        id: el.id,
        type: hw ? "street" : "poi",
        name,
        nameAr: finalNameAr,
        lat: lat2,
        lon: lon2,
        category: rawCategory,
        categoryAr,
      });
    }

    // Sort: streets first, then POIs
    features.sort((a, b) => {
      if (a.type === "street" && b.type !== "street") return -1;
      if (a.type !== "street" && b.type === "street") return 1;
      return 0;
    });

    return NextResponse.json({
      success: true,
      center: { lat: latNum, lon: lonNum },
      radiusM: radius,
      count: features.length,
      cachedAt: Date.now(),
      features,
    }, {
      headers: {
        // Cache at edge for 1 hour to avoid hammering Overpass
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      }
    });

  } catch (err: any) {
    if (err.name === "AbortError") {
      return NextResponse.json({ error: "Overpass timeout — area data unavailable" }, { status: 504 });
    }
    console.error("Geo prefetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
