import { NextRequest, NextResponse } from "next/server";
import { validateOrigin } from "@/lib/security/cors";

export async function GET(request: NextRequest) {
  // Origin verification
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Unauthorized Origin" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 });
  }

  let street = "";
  let area = "";
  let city = "";
  let displayAddress = "";

  // 1. Primary Provider: OpenStreetMap Nominatim with Egyptian Arabic headers
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ar`,
      {
        headers: {
          "User-Agent": "NoorDahabApp/2.0 (contact: info@dahabsoftware.com)",
          "Accept-Language": "ar,ar-EG;q=0.9",
        },
        next: { revalidate: 180 },
      }
    );

    if (res.ok) {
      const data = await res.json();
      const a = data.address || {};

      // Extract street name
      const rawRoad = a.road || a.pedestrian || a.footway || a.street;
      if (rawRoad) {
        street = rawRoad.startsWith("شارع") || rawRoad.startsWith("ميدان") || rawRoad.startsWith("طريق") || rawRoad.startsWith("كوبري")
          ? rawRoad
          : `شارع ${rawRoad}`;
      }

      // Extract neighbourhood / area
      area = a.neighbourhood || a.suburb || a.city_district || a.quarter || "";

      // Extract city / state
      city = a.city || a.town || a.county || a.state || "";

      displayAddress = data.display_name || "";
    }
  } catch (err) {
    console.warn("Nominatim reverse geocode failed, trying fallback:", err);
  }

  // 2. Fallback Provider: Photon Komoot
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

  // 3. Build Natural Egyptian Spoken Sentence for the Blind User
  let spokenText = "";
  if (street && area) {
    spokenText = `أنت دلوقتي في ${street}، منطقة ${area}${city ? `، ${city}` : ""}.`;
  } else if (street) {
    spokenText = `أنت دلوقتي في ${street}${city ? `، ${city}` : ""}.`;
  } else if (area) {
    spokenText = `أنت دلوقتي في منطقة ${area}${city ? `، ${city}` : ""}.`;
  } else if (city) {
    spokenText = `أنت متواجد حالياً في ${city}. الشارع الفرعي لم يتم التعرف على اسمه بدقة بعد.`;
  } else {
    spokenText = "تم رصد إحداثيات موقعك عبر الـ GPS بنجاح، لكن جاري تحديث اسم الشارع.";
  }

  const combinedAddress = [street, area, city].filter(Boolean).join("، ") || displayAddress || "موقع محدد عبر الـ GPS";

  return NextResponse.json({
    success: true,
    latitude: Number(lat),
    longitude: Number(lon),
    street,
    area,
    city,
    address: combinedAddress,
    spokenText,
  });
}
