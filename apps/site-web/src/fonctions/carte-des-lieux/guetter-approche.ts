type ConstructeurObservateur = new (rappel: IntersectionObserverCallback, reglages?: IntersectionObserverInit) => Pick<IntersectionObserver, "observe" | "disconnect">;

const MARGE_APPROCHE = "300px 0px";

export function guetterApproche(
  element: Element,
  quandProche: () => void,
  Observateur: ConstructeurObservateur | undefined = typeof IntersectionObserver === "undefined" ? undefined : IntersectionObserver,
): () => void {
  if (!Observateur) return () => {};
  let fini = false;
  const observateur = new Observateur(
    (entrees) => {
      if (fini || !entrees.some((entree) => entree.isIntersecting)) return;
      fini = true;
      observateur.disconnect();
      quandProche();
    },
    { rootMargin: MARGE_APPROCHE },
  );
  observateur.observe(element);
  return () => {
    fini = true;
    observateur.disconnect();
  };
}
