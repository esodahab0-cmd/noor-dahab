import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    if (username && username !== "admin") {
      try {
        await updateDoc(doc(db, "users", username), {
          activeSessionToken: null,
          isOnline: false,
        });
      } catch (e) {
        console.warn("Logout Firestore update failed:", e);
      }
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}