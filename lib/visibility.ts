/** Normalises event visibility from the form into a batch list + display label.
 *  An empty list means the event is visible to everyone. */
export function visibilityFields(body: any, validBatches: string[]): { visibility: string; visibleBatches: string[] } {
  const batches = Array.isArray(body.visibleBatches)
    ? body.visibleBatches.filter((b: string) => validBatches.includes(b))
    : [];
  const label = batches.length ? `Batches: ${batches.join(", ")}` : "Everyone";
  return { visibility: label, visibleBatches: batches };
}
