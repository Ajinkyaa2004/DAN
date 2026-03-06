import type { AnalysisResponse } from "./types";
import { API_BASE_URL } from "./constants";

// ============================================================
// API client for communicating with FastAPI backend
// ============================================================

/**
 * POST /api/analyse — Run full analysis on uploaded file or template.
 */
export async function runAnalysis(params: {
  files?: File[];
  template?: string;
  revenueTarget?: number;
  segmentNames?: string[];
}): Promise<AnalysisResponse> {
  const formData = new FormData();

  if (params.files) {
    for (const file of params.files) {
      formData.append("files", file);
    }
  }
  if (params.template) {
    formData.append("template", params.template);
  }
  if (params.revenueTarget) {
    formData.append("revenueTarget", params.revenueTarget.toString());
  }
  if (params.segmentNames?.length) {
    formData.append("segmentNames", params.segmentNames.join(","));
  }

  const res = await fetch(`${API_BASE_URL}/api/analyse`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "Unknown error");
    throw new Error(`Analysis failed (${res.status}): ${errorBody}`);
  }

  return res.json();
}

/**
 * POST /api/ingest/upload — Upload raw data file for ingestion.
 */
export async function uploadFile(file: File): Promise<{
  batchId: number;
  rowsInserted: number;
  rowsUpdated: number;
  rowsSkipped: number;
}> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/ingest/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }

  return res.json();
}

/**
 * GET /api/forecast — Get forecast data for a branch/FY.
 */
export async function getForecast(params?: {
  branch?: string;
  fy?: string;
}): Promise<AnalysisResponse["forecast"]> {
  const searchParams = new URLSearchParams();
  if (params?.branch) searchParams.set("branch", params.branch);
  if (params?.fy) searchParams.set("fy", params.fy);

  const url = `${API_BASE_URL}/api/forecast${searchParams.toString() ? `?${searchParams}` : ""}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Forecast fetch failed (${res.status})`);
  }

  return res.json();
}

/**
 * GET /api/health — Check backend health.
 */
export async function checkHealth(): Promise<{
  status: string;
  database: string;
  lastIngestion: string | null;
}> {
  const res = await fetch(`${API_BASE_URL}/api/health`);
  return res.json();
}
