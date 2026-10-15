// Applique les effets d'un geste social (services/effets-sociaux-regles.ts) : la cloche AVANT la réponse (l'app la relit
// tout de suite), les notifications sur le téléphone APRÈS, sans être attendues : jamais elles ne retardent une demande ni
// ne la font échouer. Toutes passent par prevenirCompte, hors anti-spam (réponse de Hugo du 14/10/2026, I.15 a), et
// seulement vers les téléphones encore connectés (prevenirCompte filtre sessionId), marquées `social` (canal « messages » sur
// Android). Dans une même conversation, un message sonne ; ceux qui arrivent moins de 30 s après le dernier qui a sonné
// arrivent sans son (une longue rafale sonne donc toutes les 30 s environ). Jamais un texte de message, un jeton ni un
// e-mail au journal.
import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import type { ServicesCloche } from "../services/cloche-regles.ts";
import { DELAI_SANS_SON_MS, type AppliquerEffetsSociaux, type EffetSocial } from "../services/effets-sociaux-regles.ts";
import type { MessagePush } from "../services/notifications/expedier-push.ts";

export type OptionsEffetsSociaux = {
  cloche: Pick<ServicesCloche, "noter">;
  /** prevenirCompte de services/notifications/prevenir-compte.ts */
  prevenirCompte: (compteId: number, message: MessagePush) => Promise<void>;
  /**
   * Relu juste avant l'envoi : ceux qui veulent encore les notifications sociales (RelationsSociales.lirePushSocial). Les
   * services filtrent déjà ; ceci rattrape un réglage coupé entre-temps
   */
  lirePushSocial?: (compteIds: readonly number[]) => Promise<Set<number>>;
  horloge: () => number;
};

type EffetPush = Extract<EffetSocial, { quoi: "push" }>;

export function creerAppliquerEffetsSociaux({ cloche, prevenirCompte, lirePushSocial, horloge }: OptionsEffetsSociaux): AppliquerEffetsSociaux {
  /** Dernier message qui a sonné, par destinataire et par conversation (« <compte>|conversation:<id> » → moment) */
  const derniersSons = new Map<string, number>();
  // Ménage chaque minute (unref : ne retient pas l'arrêt du serveur)
  setInterval(() => {
    const limite = horloge() - DELAI_SANS_SON_MS;
    for (const [cle, moment] of derniersSons) if (moment <= limite) derniersSons.delete(cle);
  }, 60_000).unref();

  /**
   * Toutes `social` (le canal « messages » sur Android, posé ici et nulle part ailleurs) ; sonore faux si un message de la
   * même conversation a sonné chez lui il y a moins de 30 s
   */
  function regler(effet: EffetPush, maintenant: number): MessagePush {
    const message = { ...effet.message, social: true };
    if (effet.sorte !== "message" || !message.regroupement || message.sonore === false) return message;
    const cle = `${effet.compteId}|${message.regroupement}`;
    const dernier = derniersSons.get(cle);
    if (dernier !== undefined && maintenant - dernier < DELAI_SANS_SON_MS) return { ...message, sonore: false };
    derniersSons.set(cle, maintenant);
    return { ...message, sonore: true };
  }

  async function envoyer(pushs: EffetPush[]) {
    const autorises = lirePushSocial ? await lirePushSocial([...new Set(pushs.map((p) => p.compteId))]) : null;
    const maintenant = horloge();
    await Promise.all(
      pushs
        .filter((p) => !autorises || autorises.has(p.compteId))
        .map((p) => prevenirCompte(p.compteId, regler(p, maintenant)).catch((erreur: unknown) => {
          console.error("Notification sociale non envoyée :", resumerErreur(erreur));
        })),
    );
  }

  return async (effets) => {
    const notifications = effets.flatMap((e) => (e.quoi === "cloche" ? [e.notification] : []));
    if (notifications.length > 0) {
      // Le geste est déjà écrit : une cloche qui échoue ne le fait pas échouer (et rien de personnel au journal)
      try {
        await cloche.noter(notifications, new Date(horloge()));
      } catch (erreur) {
        console.error("Cloche : notifications non écrites :", resumerErreur(erreur));
      }
    }
    const pushs = effets.filter((e): e is EffetPush => e.quoi === "push");
    if (pushs.length === 0) return;
    // Après la réponse : le contrôleur répond dès que cette promesse est résolue, l'envoi part au tour suivant
    setImmediate(() => {
      envoyer(pushs).catch((erreur: unknown) => console.error("Notifications sociales :", resumerErreur(erreur)));
    });
  };
}
