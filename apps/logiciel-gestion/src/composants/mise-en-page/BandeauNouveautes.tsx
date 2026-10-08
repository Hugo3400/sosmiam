import { CircleCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

import { lireVersion } from "~/services/mises-a-jour.ts";
import { lireMiseAJourInstallee, type NouveautesInstallees } from "~/stockage/nouveautes.ts";

/** Juste après une mise à jour : « Logiciel à jour en version X », avec ses nouveautés. */
export function BandeauNouveautes() {
  const [nouveautes, setNouveautes] = useState<NouveautesInstallees | null>(null);
  useEffect(() => {
    void lireVersion().then((version) => version && setNouveautes(lireMiseAJourInstallee(version)));
  }, []);
  if (!nouveautes) return null;
  return (
    <div role="status" className="flex items-start gap-3 border-b-2 border-encre bg-vert-clair px-8 py-2.5 text-sm text-vert">
      <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p className="flex-1">
        <strong>Logiciel à jour : version {nouveautes.version}.</strong>
        {nouveautes.notes && <span className="block text-encre">{nouveautes.notes}</span>}
      </p>
      <button type="button" onClick={() => setNouveautes(null)} aria-label="Fermer" className="rounded-full p-1 hover:bg-white/60">
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
