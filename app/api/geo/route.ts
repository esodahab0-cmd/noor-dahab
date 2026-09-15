import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ar`,
      {
        headers: { "User-Agent": "NoorDahabApp/2.0" },
        next: { revalidate: 300 }
      }
    );

    if (!res.ok) throw new Error("Nominatim error");
    const data = await res.json();
    const address = data.display_name || "موقع محدد غير مسمى";

    return NextResponse.json({ success: true, address });
  } catch {
    return NextResponse.json({ success: false, address: "تعذر تحديد اسم الشارع تلقائياً" });
  }
}
