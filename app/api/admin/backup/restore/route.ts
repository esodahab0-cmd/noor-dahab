import { NextRequest, NextResponse } from "next/server";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { validateOrigin } from "@/lib/security/cors";

export async function POST(request: NextRequest) {
  // Origin verification
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Unauthorized Origin" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { backupData, adminKey } = body;

    const validAdminKey = process.env.ADMIN_SECRET_KEY || process.env.ADMIN_PASSWORD || "NoorDahab@2024";
    if (adminKey && adminKey !== validAdminKey) {
      return NextResponse.json({ success: false, error: "رمز المشرف غير صحيح" }, { status: 401 });
    }

    if (!backupData || !backupData.collections) {
      return NextResponse.json(
        { success: false, error: "ملف النسخة الاحتياطية غير صالح أو تالف." },
        { status: 400 }
      );
    }

    let restoredUsers = 0;
    let restoredConfigs = 0;

    // 1. Restore Users collection
    if (Array.isArray(backupData.collections.users)) {
      for (const item of backupData.collections.users) {
        if (!item.id) continue;
        const { id, ...data } = item;
        await setDoc(doc(db, "users", id), data, { merge: true });
        restoredUsers++;
      }
    }

    // 2. Restore Config collection
    if (Array.isArray(backupData.collections.config)) {
      for (const item of backupData.collections.config) {
        if (!item.id) continue;
        const { id, ...data } = item;
        await setDoc(doc(db, "config", id), data, { merge: true });
        restoredConfigs++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "تمت استعادة البيانات بنجاح تام!",
      restoredCounts: {
        users: restoredUsers,
        config: restoredConfigs,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "فشل استرجاع النسخة الاحتياطية: " + error.message },
      { status: 500 }
    );
  }
}
