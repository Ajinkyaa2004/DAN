import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

/**
 * POST /api/analyse — Proxy to FastAPI analysis endpoint.
 * Forwards the multipart FormData (files, template, revenueTarget, segmentNames).
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const backendRes = await fetch(`${BACKEND_URL}/api/analyse`, {
      method: "POST",
      body: formData,
    });

    if (!backendRes.ok) {
      const errorText = await backendRes.text().catch(() => "Unknown error");
      return NextResponse.json(
        { error: errorText },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
