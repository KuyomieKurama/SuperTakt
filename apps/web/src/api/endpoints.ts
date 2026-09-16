/** Health und globale Suche; fachliche Operationen liegen in features/<merkmal>/api.ts (E-102). */
import { request } from "./client";
import type { SearchResult } from "./types";

export function checkHealth(): Promise<{ status: "ok" }> {
  return request<{ status: "ok" }>("/health");
}

/** Trifft Titel, Call-Nummer und Leistungstexte. Nie den Vermerk (A-7.1). */
export function searchEverything(term: string, limit = 20): Promise<SearchResult> {
  return request<SearchResult>("/search", { query: { q: term, limit } });
}
