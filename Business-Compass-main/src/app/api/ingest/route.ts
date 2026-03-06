import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

/**
 * POST /api/ingest — Proxy file upload to FastAPI ingestion endpoint.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const backendRes = await fetch(`${BACKEND_URL}/api/ingest/upload`, {
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
