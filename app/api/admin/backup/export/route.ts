import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { validateOrigin } from "@/lib/security/cors";

export async function GET(request: NextRequest) {
  // Origin verification
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Unauthorized Origin" }, { status: 403 });
  }

  try {
    // 1. Fetch all users
    const usersSnap = await getDocs(collection(db, "users"));
    const usersData = usersSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // 2. Fetch all system configs
    const configSnap = await getDocs(collection(db, "config"));
    const configData = configSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    const backupPayload = {
      version: "2.0.0",
      system: "Noor Dahab Core Backup",
      timestamp: new Date().toISOString(),
      counts: {
        users: usersData.length,
        config: configData.length,
      },
      collections: {
        users: usersData,
        config: configData,
      },
    };

    const fileName = `noor-dahab-backup-${new Date().toISOString().split("T")[0]}-${Date.now()}.json`;

    return new NextResponse(JSON.stringify(backupPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "فشل إنشاء النسخة الاحتياطية: " + error.message },
      { status: 500 }
    );
  }
}
