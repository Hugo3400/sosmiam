import { habillerCourriel } from "../courriels/habiller-courriel.ts";

const echeanceEnLettres = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

const PIEDS: Record<string, string> = {
  app: "Tu reçois ce mail parce que la case de la newsletter était cochée à la création d'un compte SOS Miam avec cette adresse. Sans ton clic, tu ne recevras aucune newsletter.",
  site: "Tu reçois ce mail parce que cette adresse a été tapée dans le formulaire « Préviens-moi » de sosmiam.fr. Sans ton clic, tu ne recevras aucune newsletter.",
};

export function composerCourrielConfirmation({ lien, expireLe, source }: { lien: string; expireLe: Date; source: string }) {
  return {
    objet: "Un petit clic pour confirmer ta newsletter 🛟",
    ...habillerCourriel({
      titre: "Encore un petit clic, et tu es des nôtres !",
      paragraphes: [
        "Quelqu'un (toi, on espère !) vient de demander la newsletter de SOS Miam avec cette adresse : les nouveaux lieux, les nouvelles villes et les BIG SOS près de chez toi.",
        "Avant de t'écrire, on préfère vérifier que c'est bien toi. Un clic sur le bouton, et tu rejoins les Miamis.",
        `Le lien marche jusqu'au ${echeanceEnLettres.format(expireLe)}, une seule fois. Déjà inscrit ? Il met simplement tes infos à jour.`,
        "Tu n'as rien demandé ? Ignore ce mail : sans clic, la demande s'efface toute seule au bout de 7 jours, et le Capitaine Bouiboui retourne à sa sieste.",
      ],
      bouton: { texte: "Je confirme mon inscription", adresse: lien },
      pied: PIEDS[source] ?? PIEDS.site,
    }),
  };
}
