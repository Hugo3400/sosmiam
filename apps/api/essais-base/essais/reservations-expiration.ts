import "../socle/garde-fou.ts";
import type { MessagePush } from "../../src/services/notifications/expedier-push.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const { creerDepotVisites } = await import("../../src/services/visites.ts");
const { brancherReponsesReservations } = await import("../../src/services/reponses-reservations.ts");
const { creerPassageExpirationReservations } = await import("../../src/taches/expirer-reservations.ts");
const verifications = creerVerifications();
const { egal } = verifications;

const T = new Date("2026-10-09T17:30:00Z");
const MINUTE = 60_000;
const dans = (minutes: number) => new Date(T.getTime() + minutes * MINUTE);
const inserer = (table: string, valeurs: Record<string, unknown>) => insererLigne(essai.db, table, valeurs);
const attendreEnvois = () => new Promise<void>((fini) => setImmediate(() => setImmediate(fini)));

const LEA = await inserer("comptes", { email: "lea@exemple.fr", prenom: "Léa" });
const SAM = await inserer("comptes", { email: "sam@exemple.fr", prenom: "Sam" });
const LIEU = await inserer("lieux", { nom: "Restaurant du Capitaine Bouiboui", type: "resto", emoji: "🍝", ville: "Montpellier", statut: "publie" });
const reserver = (compteId: number, creneau: Date, statut = "demandee") =>
  inserer("reservations", { compte_id: compteId, lieu_id: LIEU, personnes: 2, creneau, statut, cree_le: dans(-300) });

const aTemps = await reserver(LEA, dans(30));
const tropTard = await reserver(SAM, dans(-60));
const plusTard = await reserver(SAM, dans(31));
const acceptee = await reserver(LEA, dans(10), "acceptee");
const statuts = async () => (await essai.sql("SELECT id, statut FROM reservations ORDER BY id")).map((l) => [Number(l.id), l.statut]);

const recus: { compteId: number; message: MessagePush }[] = [];
const prevenirCompte = async (compteId: number, message: MessagePush) => void recus.push({ compteId, message });
const depot = creerDepotVisites();

const { depot: suivi } = brancherReponsesReservations({ depot, prevenirCompte }, () => T.getTime());
let annulee = false;
try {
  await suivi.ecrire(async (t) => {
    egal((await t.expirerReservations(T)).length, 2, "dans la transaction : les deux demandes à 30 min ou moins");
    throw new Error("annulée");
  });
} catch {
  annulee = true;
}
await attendreEnvois();
egal([annulee, recus.length], [true, 0], "transaction annulée : personne n'est prévenu");
egal(await statuts(), [[aTemps, "demandee"], [tropTard, "demandee"], [plusTard, "demandee"], [acceptee, "acceptee"]], "et rien n'a changé");

const passer = creerPassageExpirationReservations({ depot, prevenirCompte, horloge: () => T.getTime() });
egal((await Promise.all([passer(), passer()])).sort(), [0, 2], "deux passages en même temps : chaque demande expire une fois");
egal(await statuts(), [[aTemps, "expiree"], [tropTard, "expiree"], [plusTard, "demandee"], [acceptee, "acceptee"]], "statuts écrits");
egal(await passer(), 0, "un second passage ne trouve plus rien");
await attendreEnvois();
egal(recus.map((r) => [r.compteId, r.message.titre, r.message.lien]), [[LEA, "Pas de réponse à temps 😴", "/reservations"]], "seule la demande encore à venir prévient");
egal(recus[0]!.message.texte, "Restaurant du Capitaine Bouiboui n'a pas pu répondre à temps pour ce soir à 20h. Ta demande s'est endormie, pas ton appétit : tente un autre créneau !");

const lues = await depot.lire((t) => t.expirerReservations(dans(1)));
egal(lues.map((r) => [r.id, r.compteId, r.lieuId, r.statut, r.creneau.toISOString(), r.motifRefus]), [[plusTard, SAM, LIEU, "expiree", dans(31).toISOString(), null]], "hors transaction : la ligne rendue, telle qu'écrite");

await terminerEssai(import.meta.url, essai, verifications.nombre);
