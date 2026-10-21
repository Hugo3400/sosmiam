import "../socle/garde-fou.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const { baseDeDonnees } = essai;
const { enregistrerSignalement } = await import("../../src/services/gestion/moderation.ts");
const verifications = creerVerifications();
const { egal } = verifications;
const inserer = (table: string, valeurs: Record<string, unknown>) => insererLigne(essai.db, table, valeurs);

const lieu = await inserer("lieux", { nom: "Restaurant du Capitaine Bouiboui", type: "resto", emoji: "🍝", ville: "Montpellier", statut: "publie" });
const publication = async () => inserer("publications", { lieu_id: lieu, auteur_type: "lieu", legende: "Les frites du jour" });
const suspendue = async (id: number) => (await baseDeDonnees.publication.findUniqueOrThrow({ where: { id }, select: { suspendue: true } })).suspendue;
const signalement = (id: number, masquageAutorise: boolean, raison = "choquant") =>
  enregistrerSignalement({ publicationId: String(id), lieuId: lieu, raison, precision: null, explication: "", masquageAutorise });

const anonyme = await publication();
await signalement(anonyme, false);
egal(await suspendue(anonyme), false, "anonyme : rien n'est masqué");
egal(await baseDeDonnees.signalement.count({ where: { cibleId: String(anonyme) } }), 1, "le signalement est gardé");

const fiable = await publication();
await signalement(fiable, true, "arnaque");
egal(await suspendue(fiable), false, "une autre raison ne masque pas");
await signalement(fiable, true);
egal(await suspendue(fiable), true, "compte fiable et « choquant » : masquée");

const dejaJugee = await publication();
await inserer("signalements", { cible: "publication", cible_id: String(dejaJugee), lieu_id: lieu, raison: "choquant", source: "app", statut: "rejete" });
await signalement(dejaJugee, true);
egal(await suspendue(dejaJugee), false, "un signalement déjà rejeté sur ce contenu : plus de masquage immédiat");

await terminerEssai(import.meta.url, essai, verifications.nombre);
