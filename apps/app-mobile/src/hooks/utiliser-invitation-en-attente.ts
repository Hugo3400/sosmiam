import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";

import { utiliserProfil } from "~/hooks/utiliser-profil";
import { effacerInvitationEnAttente, lireInvitationEnAttente } from "~/stockage/invitation-en-attente";

/** Une fois le compte créé : le lien d'invitation ouvert avant (sosmiam.fr/invitation/…) se rouvre dans « Ajouter un pote ». */
export function utiliserInvitationEnAttente(): void {
  const router = useRouter();
  const { profil } = utiliserProfil();
  const fait = useRef(false);

  useEffect(() => {
    if (!profil || fait.current) return;
    fait.current = true;
    void lireInvitationEnAttente().then(async (lien) => {
      if (!lien) return;
      await effacerInvitationEnAttente();
      router.push({ pathname: "/potes/ajouter", params: { lien } });
    });
  }, [profil, router]);
}
