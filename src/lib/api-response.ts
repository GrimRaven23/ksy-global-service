import { NextResponse } from "next/server";
import { getStatusCode, getErrorMessage, isAppError, newCorrelationId } from "@/lib/errors";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function apiCreated<T>(data: T) {
  return apiSuccess(data, 201);
}

export function apiError(error: unknown) {
  const status = getStatusCode(error);
  const message = getErrorMessage(error);
  const body: Record<string, unknown> = { ok: false, error: message };

  if (isAppError(error) && "fields" in error) {
    body.fields = (error as { fields: Record<string, string[]> }).fields;
  }

  if (process.env.NODE_ENV !== "production" && error instanceof Error) {
    body.stack = error.stack;
  }

  return NextResponse.json(body, { status });
}

export function apiUnauthorized(message = "Non authentifié") {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

export function apiForbidden(message = "Accès refusé") {
  return NextResponse.json({ ok: false, error: message }, { status: 403 });
}

export function apiNotFound(message = "Ressource non trouvée") {
  return NextResponse.json({ ok: false, error: message }, { status: 404 });
}

export function apiRateLimited(retryAfter: number) {
  return NextResponse.json(
    { ok: false, error: "Trop de requêtes. Réessayez plus tard." },
    {
      status: 429,
      headers: { "Retry-After": Math.ceil(retryAfter).toString() },
    }
  );
}

export function apiServerError(error: unknown, context: string) {
  const reference = newCorrelationId();
  console.error(`${context} [${reference}]:`, error);
  return NextResponse.json({ error: "Erreur serveur", reference }, { status: 500 });
}
