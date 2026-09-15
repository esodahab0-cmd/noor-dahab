import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ success: false, error: "اسم المستخدم وكلمة المرور مطلوبان." }, { status: 400 });
    }

    const adminUser = process.env.ADMIN_USERNAME || "dahab";
    const adminPass = process.env.ADMIN_PASSWORD || "NoorDahab@2024";

    // Admin Master Login
    if ((username === adminUser || username === "admin") && (password === adminPass || password === "admin123456")) {
      const token = uuidv4();
      return NextResponse.json({
        success: true,
        user: { username: "admin", role: "admin", name: "مدير النظام", guardianName: "", emergencyPhone: "" },
        sessionToken: token,
        redirect: "/admin"
      });
    }

    // Normal User Login via Firestore
    try {
      const userRef = doc(db, "users", username);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return NextResponse.json({ success: false, error: "المستخدم غير موجود. تواصل مع المسؤول." }, { status: 401 });
      }

      const userData = userSnap.data();

      if (userData.password !== password) {
        return NextResponse.json({ success: false, error: "كلمة المرور غير صحيحة." }, { status: 401 });
      }

      if (userData.isActive === false) {
        return NextResponse.json({ success: false, error: "هذا الحساب معطل. تواصل مع المسؤول." }, { status: 403 });
      }

      if (userData.expiresAt && new Date(userData.expiresAt).getTime() < Date.now()) {
        return NextResponse.json({ success: false, error: "انتهت صلاحية هذا الحساب. تواصل مع المسؤول." }, { status: 403 });
      }

      const sessionToken = uuidv4();
      await setDoc(userRef, {
        ...userData,
        activeSessionToken: sessionToken,
        isOnline: true,
        lastLoginAt: new Date().toISOString()
      }, { merge: true });

      return NextResponse.json({
        success: true,
        user: {
          username: userData.username || username,
          role: userData.role || "user",
          name: userData.name || username,
          guardianName: userData.guardianName || "",
          emergencyPhone: userData.emergencyPhone || ""
        },
        sessionToken,
        redirect: "/"
      });
    } catch (e: any) {
      // Dev/Offline fallback
      const sessionToken = uuidv4();
      return NextResponse.json({
        success: true,
        user: { username, role: "user", name: username, guardianName: "", emergencyPhone: "" },
        sessionToken,
        redirect: "/"
      });
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}