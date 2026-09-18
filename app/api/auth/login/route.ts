import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { checkLoginLockout, recordLoginFailure, resetLoginFailures } from "@/lib/security/rate-limiter";
import { validateOrigin, getCorsHeaders } from "@/lib/security/cors";

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);

  if (!validateOrigin(request)) {
    return NextResponse.json(
      { success: false, error: "طلب غير مصرح به: النطاق غير معتمد." },
      { status: 403, headers: corsHeaders }
    );
  }

  // 1. Check IP Lockout
  const lockout = checkLoginLockout(request);
  if (lockout.isLocked) {
    return NextResponse.json(
      {
        success: false,
        error: `تم قفل محاولات تسجيل الدخول مؤقتاً لحماية الحساب بعد تكرار الخطأ. يرجى الانتظار ${lockout.minutesRemaining} دقيقة والمحاولة لاحقاً.`,
        isLocked: true,
        minutesRemaining: lockout.minutesRemaining,
      },
      { status: 429, headers: corsHeaders }
    );
  }

  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "اسم المستخدم وكلمة المرور مطلوبان." },
        { status: 400, headers: corsHeaders }
      );
    }

    const adminUser = process.env.ADMIN_USERNAME || "dahab";
    const adminPass = process.env.ADMIN_PASSWORD || "NoorDahab@2024";

    // Admin Master Login
    if (username === adminUser && password === adminPass) {
      resetLoginFailures(request);
      const token = uuidv4();
      return NextResponse.json(
        {
          success: true,
          user: { username: "dahab", role: "admin", name: "مدير النظام (دهب)", guardianName: "", emergencyPhone: "" },
          sessionToken: token,
          redirect: "/admin"
        },
        { headers: corsHeaders }
      );
    }

    // Normal User Login via Firestore
    const userRef = doc(db, "users", username);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const fail = recordLoginFailure(request);
      const lockMsg = fail.isNowLocked
        ? "تم تجاوز الحد الأقصى للمحاولات الخاطئة. تم قفل الحساب لمدة 15 دقيقة."
        : `اسم المستخدم غير موجود (${5 - fail.failures} محاولات متبقية).`;
      return NextResponse.json(
        { success: false, error: lockMsg },
        { status: 401, headers: corsHeaders }
      );
    }

    const userData = userSnap.data();

    if (userData.password !== password) {
      const fail = recordLoginFailure(request);
      const lockMsg = fail.isNowLocked
        ? "تم تجاوز الحد الأقصى للمحاولات الخاطئة. تم قفل الحساب لمدة 15 دقيقة."
        : `كلمة المرور غير صحيحة (${5 - fail.failures} محاولات متبقية).`;
      return NextResponse.json(
        { success: false, error: lockMsg },
        { status: 401, headers: corsHeaders }
      );
    }

    if (userData.isActive === false) {
      return NextResponse.json(
        { success: false, error: "هذا الحساب معطل. تواصل مع إدارة دهب سوفتوير." },
        { status: 403, headers: corsHeaders }
      );
    }

    if (userData.expiresAt && new Date(userData.expiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: "انتهت صلاحية هذا الحساب. تواصل مع إدارة دهب سوفتوير." },
        { status: 403, headers: corsHeaders }
      );
    }

    // Successful login: reset failures
    resetLoginFailures(request);

    const sessionToken = uuidv4();
    await setDoc(userRef, {
      ...userData,
      activeSessionToken: sessionToken,
      isOnline: true,
      lastLoginAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json(
      {
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
      },
      { headers: corsHeaders }
    );
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || "فشل تسجيل الدخول." },
      { status: 500, headers: corsHeaders }
    );
  }
}