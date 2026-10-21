import "../socle/garde-fou.ts";
import { crc32, deflateSync } from "node:zlib";
import { creerChiffrementDonnees } from "../../src/services/chiffrement-donnees.ts";
import { creerChiffrementSecurite } from "../../src/services/chiffrement-securite.ts";
import { creerStockageSignalementsSecuriteEnMemoire } from "../../src/services/stockage-signalements-securite.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const { baseDeDonnees } = essai;
const { creerDepotSecurite } = await import("../../src/services/securite-base.ts");
const { creerSecurite } = await import("../../src/services/securite-services.ts");
const verifications = creerVerifications();
const { egal, vrai } = verifications;

const JOUR = 86_400_000;
const T = Date.parse("2026-10-22T10:00:00Z");
const horloge = { maintenant: T };
const cle1 = new Uint8Array(32).fill(4);
const bloc = (type: string, donnees: Buffer) => {
  const longueur = Buffer.alloc(4);
  longueur.writeUInt32BE(donnees.length);
  const corps = Buffer.concat([Buffer.from(type, "latin1"), donnees]);
  const controle = Buffer.alloc(4);
  controle.writeUInt32BE(crc32(corps));
  return Buffer.concat([longueur, corps, controle]);
};
const png = (texte: string) => {
  const entete = Buffer.alloc(13);
  entete.writeUInt32BE(2, 0);
  entete.writeUInt32BE(2, 4);
  entete.set([8, 2, 0, 0, 0], 8);
  const brut = Buffer.from([0, 1, 2, 3, 4, 5, 6, 0, 7, 8, 9, 10, 11, 12]);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), bloc("IHDR", entete), bloc("tEXt", Buffer.from(`Comment\0${texte}`, "latin1")),
    bloc("IDAT", deflateSync(brut)), bloc("IEND", Buffer.alloc(0)),
  ]);
};
const nettoyerJpeg = async () => null;
const depot = creerDepotSecurite(baseDeDonnees);
const stockage = creerStockageSignalementsSecuriteEnMemoire({ horloge: () => horloge.maintenant });
const servicesAvec = (chiffrement: ReturnType<typeof creerChiffrementSecurite>) => creerSecurite({ depot, stockage, chiffrement, nettoyerJpeg, horloge: () => horloge.maintenant });
const securite = servicesAvec(creerChiffrementSecurite(creerChiffrementDonnees(cle1)));

const signalement = (email: string, o: Record<string, unknown> = {}) => ({
  nom: "Zoé Martin", email, cible: "api" as const, titre: "Une route rend l'e-mail des autres",
  description: "En changeant l'identifiant dans l'adresse, on lit l'e-mail d'un autre compte.", lien: "https://exemple.fr/zoe",
  majeur: true as const, reglesAcceptees: true as const, nomTableauHonneur: "Zoé M.", images: [{ nomFichier: "a.png", base64: png(email).toString("base64") }], ...o,
});
egal(await securite.deposerSignalement(signalement("zoe@exemple.fr")), { ok: true });
horloge.maintenant += 60_000;
egal(await securite.deposerSignalement(signalement("Zoe@Exemple.fr ", { images: [], nomTableauHonneur: null, lien: null })), { ok: true });
horloge.maintenant += 60_000;
egal(await securite.deposerSignalement(signalement("zoe@exemple.fr")), { ok: true });
egal(await securite.deposerSignalement(signalement("zoe@exemple.fr")), { ok: false, erreur: "trop-de-demandes", reessayerDans: 86_400 - 120 }, "3 par jour et par e-mail, comptés dans la base");
horloge.maintenant += 60_000;
egal(await securite.deposerSignalement(signalement("ada@exemple.fr", { nomTableauHonneur: "Ada" })), { ok: true });

const lignes = await essai.sql("SELECT id, nom_chiffre, email_chiffre, titre_chiffre, description_chiffree, lien_chiffre, nom_tableau_chiffre, images, email_empreinte, statut FROM signalements_securite");
egal(lignes.length, 4);
egal(lignes.every((l) => String(l.titre_chiffre).startsWith("v1:") && String(l.description_chiffree).startsWith("v1:") && l.statut === "nouveau"), true, "chiffrés dans la base");
egal(lignes.some((l) => JSON.stringify(l).includes("Zoé") || JSON.stringify(l).toLowerCase().includes("zoe@")), false, "rien en clair");
egal(new Set(lignes.map((l) => l.email_empreinte)).size, 2, "même empreinte quelle que soit la casse");
const liste = await securite.listerSignalementsSecurite();
egal(liste.length, 4);
egal(liste.map((s) => s.email), ["ada@exemple.fr", "zoe@exemple.fr", "zoe@exemple.fr", "zoe@exemple.fr"], "les plus récents d'abord");
egal(liste.map((s) => s.images), [1, 1, 0, 1], "tableau d'images relu par Prisma");
const ada = liste[0]!;
const zoe = liste[1]!;
const image = await securite.lireImageSignalementSecurite(zoe.id, 0);
egal(image?.typeMime, "image/png");
vrai(image !== null && !image.octets.includes("zoe@exemple.fr"), "le bloc tEXt est parti");

egal((await securite.changerSignalementSecurite(zoe.id, { statut: "en-cours", gravite: "haute" })).ok, true);
egal((await securite.listerSignalementsSecurite()).map((s) => s.id).at(-1), zoe.id, "les nouveaux en tête");
egal((await securite.listerSignalementsSecurite({ statut: "en-cours" })).map((s) => s.id), [zoe.id]);
const clos = await securite.changerSignalementSecurite(ada.id, { statut: "corrige", auTableauHonneur: true }, new Date(T));
egal(clos.ok && [clos.signalement.clotureLe, clos.signalement.auTableauHonneur, clos.signalement.effaceLe], [new Date(T).toISOString(), true, "2028-10-22T10:00:00.000Z"]);
egal(await securite.listerTableauHonneur(), [{ nom: "Ada", mois: "2026-10" }]);
egal((await securite.changerSignalementSecurite(ada.id, { auTableauHonneur: true })).ok, true, "deux fois : ON CONFLICT DO NOTHING");
egal((await essai.sql("SELECT count(*) AS n FROM tableau_honneur_securite"))[0]?.n, "1");

const compteZoe = await insererLigne(essai.db, "comptes", { email: "zoe@exemple.fr", email_verifie_le: null, pseudo: "zoe" });
const compteAda = await insererLigne(essai.db, "comptes", { email: "ada@exemple.fr", email_verifie_le: new Date(T), pseudo: "ada" });
egal(await securite.donnerBadgeSignalementSecurite(zoe.id), { ok: false, erreur: "compte-introuvable" }, "e-mail pas confirmé");
egal(await securite.donnerBadgeSignalementSecurite(ada.id), { ok: true, nouveau: true });
egal(await securite.donnerBadgeSignalementSecurite(ada.id), { ok: true, nouveau: false });
egal((await essai.sql("SELECT compte_id, badge FROM badges_comptes")).map((l) => [Number(l.compte_id), l.badge]), [[compteAda, "chasseur-de-bugs"]]);
const adaLue = await securite.lireSignalementSecurite(ada.id);
egal([adaLue?.badgeDonne, adaLue?.compteTrouve, (await securite.lireSignalementSecurite(zoe.id))?.compteTrouve], [true, true, false]);
vrai(compteZoe > 0);

const lireFichiers = async (id?: string) => (await essai.sql(`SELECT unnest(images) AS f FROM signalements_securite${id ? " WHERE id = $1" : ""}`, id ? [id] : [])).map((l) => String(l.f));
const anciensFichiers = new Set(await lireFichiers());
egal(anciensFichiers.size, 3);
egal(await depot.listerImagesCitees([...anciensFichiers, "0f2b8c1e-7a4b-4c1d-9e2f-3a4b5c6d7e8f.bin"]), anciensFichiers);
egal((await depot.listerSignalementsApres(null, 2)).length, 2);

const cle2 = new Uint8Array(32).fill(5);
const pendant = servicesAvec(creerChiffrementSecurite(creerChiffrementDonnees(cle2, { version: 2, anciennes: [{ version: 1, cle: cle1 }] })));
const nuit = await pendant.menager();
egal([nuit.rechiffres, nuit.illisibles, nuit.signalements], [4, 0, 0], "changement de clé : tout est rechiffré");
const apres = await essai.sql("SELECT description_chiffree, images FROM signalements_securite");
egal(apres.every((l) => String(l.description_chiffree).startsWith("v2:")), true);
egal([...anciensFichiers].some((f) => stockage.fichiers.has(f)), false, "les anciennes captures sont parties");
const seule2 = servicesAvec(creerChiffrementSecurite(creerChiffrementDonnees(cle2, { version: 2 })));
egal((await seule2.lireSignalementSecurite(ada.id))?.nom, "Zoé Martin", "lisible sans l'ancienne clé");
egal((await seule2.lireImageSignalementSecurite(zoe.id, 0))?.typeMime, "image/png");

horloge.maintenant = T + 733 * JOUR;
const fichiersAda = await lireFichiers(ada.id);
egal(fichiersAda.length, 1);
const bilan = await seule2.menager();
egal([bilan.signalements, bilan.images], [1, 1], "2 ans après la clôture, effacé avec sa capture (RETURNING images)");
egal(await baseDeDonnees.signalementSecurite.count(), 3, "les ouverts restent");
vrai(!stockage.fichiers.has(fichiersAda[0]!), "sa capture est partie");
egal((await essai.sql("SELECT nom, signalement_id FROM tableau_honneur_securite")).map((l) => [l.nom, l.signalement_id]), [["Ada", null]], "ON DELETE SET NULL : le nom reste");
egal(await seule2.listerTableauHonneur(), [{ nom: "Ada", mois: "2026-10" }]);
const [entree] = await seule2.listerEntreesTableauHonneur();
egal(await seule2.retirerEntreeTableauHonneur(entree!.id), true);
egal(await seule2.listerTableauHonneur(), []);
egal(await seule2.supprimerSignalementSecurite(zoe.id), true);
egal(await baseDeDonnees.signalementSecurite.count(), 2);

await terminerEssai(import.meta.url, essai, verifications.nombre);
