import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

/**
 * GET /api/forecast — Proxy to FastAPI forecast endpoint.
 * Forwards optional query params: branch, fy.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const params = new URLSearchParams();

    const branch = searchParams.get("branch");
    const fy = searchParams.get("fy");
    if (branch) params.set("branch", branch);
    if (fy) params.set("fy", fy);

    const url = `${BACKEND_URL}/api/forecast${params.toString() ? `?${params}` : ""}`;
    const backendRes = await fetch(url);

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
