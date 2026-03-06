import { NextResponse } from "next/server";

const BACKEND_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

/**
 * GET /api/health — Proxy to FastAPI health endpoint.
 * Returns backend health + DB + last ingestion timestamp.
 */
export async function GET() {
  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/health`);

    if (!backendRes.ok) {
      return NextResponse.json(
        { status: "unhealthy", error: `Backend returned ${backendRes.status}` },
        { status: 502 }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        status: "unreachable",
        error:
          error instanceof Error ? error.message : "Cannot reach backend",
      },
      { status: 502 }
    );
  }
}
