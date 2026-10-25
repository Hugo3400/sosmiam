export function verifierWebgl(): boolean {
  try {
    const toile = document.createElement("canvas");
    return Boolean(toile.getContext("webgl2") ?? toile.getContext("webgl"));
  } catch {
    return false;
  }
}
