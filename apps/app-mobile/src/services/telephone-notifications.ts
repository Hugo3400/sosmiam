import type { ServiceAppareils } from "@sos-miam/commun/client-api/contrat-appareils";
import { deduireChoixTelephone } from "~/fonctions/notifications/deduire-choix-telephone";
import { envoyerChoixTelephone } from "~/fonctions/notifications/envoyer-choix-telephone";
import type { LectureJetonTelephone } from "~/fonctions/notifications/lire-jeton-telephone";
import { renvoiChoixOffres, type EnvoyerOffres } from "~/services/renvoi-choix-offres";
import type { ChoixTelephone } from "~/stockage/choix-offres-a-renvoyer";
import { effacerJetonPush, enregistrerJetonPush, lireJetonPush } from "~/stockage/jeton-push";
import { effacerReglagesNotifications, lireReglagesNotifications } from "~/stockage/reglages-notifications";

type OutilsTelephone = {
  appareils: ServiceAppareils;
  ville: string | null;
  demo: boolean;
  plateforme: string;
  lireJeton: () => Promise<LectureJetonTelephone>;
  demanderAutorisation: () => Promise<void>;
  renvoi?: typeof renvoiChoixOffres;
};

export function creerTelephoneNotifications(o: OutilsTelephone) {
  const renvoi = o.renvoi ?? renvoiChoixOffres;
  const envoyer: EnvoyerOffres = (choix, valable) =>
    envoyerChoixTelephone(
      choix,
      {
        demo: o.demo,
        ville: o.ville,
        plateforme: o.plateforme,
        lireActives: async () => (await lireReglagesNotifications()).actives,
        lireJeton: o.lireJeton,
        lireJetonGarde: lireJetonPush,
        inscrire: (inscription) => o.appareils.inscrire(inscription),
        desinscrire: (jeton) => o.appareils.desinscrire(jeton),
        enregistrerJeton: enregistrerJetonPush,
        effacerJeton: effacerJetonPush,
      },
      valable,
    );
  const choisir = (choix: ChoixTelephone) => renvoi.choisir(choix, envoyer);

  return {
    choisir,
    couper: () => choisir("couper"),
    renvoyer: () => renvoi.renvoyer(envoyer),
    async inscrire() {
      if (o.demo) return;
      await o.demanderAutorisation();
      const reglages = await lireReglagesNotifications();
      await choisir(deduireChoixTelephone(reglages.actives, reglages.types.offre));
    },
    async effacerReglages() {
      await effacerReglagesNotifications();
      void choisir("couper").catch(() => undefined);
    },
  };
}
