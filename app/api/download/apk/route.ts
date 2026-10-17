import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const GITHUB_APK_RELEASE_URL =
    "https://github.com/esodahab0-cmd/noor-dahab/releases/download/v2.0.0-apk/NoorDahab.apk";

  return NextResponse.redirect(GITHUB_APK_RELEASE_URL, 302);
}
