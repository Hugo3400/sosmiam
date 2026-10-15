// Essai sur base (PGlite, toutes les migrations du dépôt) de « Je suis sur place » dans l'espace ambassadeur
// (services/gestion/missions-messages.ts : missionsDuCompte, noterPresence, terminerMission) par le client global de l'API
// (connexion.ts) : ce que l'espace lit d'une mission (le lieu, son emoji et sa position, ou null), les refus (pas la sienne,
// lieu sans position, hors zone arrondi à 100 m, position simulée, périmée ou imprécise), le rayon du lieu qui compte comme
// pour les visites, l'heure écrite une seule fois, une mission terminée qui n'est plus à faire ; jamais la position du
// téléphone, ni écrite ni renvoyée. Porté du scratchpad (presence, où une base PGlite servie sur :5577 tenait lieu de vraie
// base). Aucune vraie base.
import "../socle/garde-fou.ts";
import { missionsDuCompte, noterPresence, terminerMission } from "../../src/services/gestion/missions-messages.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const b = essai.baseDeDonnees;
const verifications = creerVerifications();
const { egal, vrai } = verifications;
/** Ce que l'API enverrait (les dates en texte ISO) */
const r = (x: unknown) => JSON.parse(JSON.stringify(x));

const lieuCommun = { type: "bar", emoji: "🍸", info: "Bar", texte: "Des figues.", quartier: "Écusson", ville: "Montpellier", prix: "€", horaires: "Soir", plat: "Cocktail" };
const place = await b.lieu.create({ data: { ...lieuCommun, nom: "La Figue Pressée", latitude: 43.6108, longitude: 3.8767 } });
const large = await b.lieu.create({ data: { ...lieuCommun, nom: "Au Grand Rayon", latitude: 43.62, longitude: 3.88 } });
await b.validationLieu.create({ data: { lieuId: large.id, codePublic: "abcd2345", rayonM: 500 } });
const nonPlace = await b.lieu.create({ data: { ...lieuCommun, nom: "Sans Épingle" } });
const moi = await b.compte.create({ data: { email: "a@exemple.fr", motDePasse: "x", prenom: "Léa", cguVersion: "1" } });
const autre = await b.compte.create({ data: { email: "b@exemple.fr", motDePasse: "x", prenom: "Sam", cguVersion: "1" } });
const mission = (lieuId: number | null, compteId = moi.id) => b.missionAmbassadeur.create({ data: { compteId, titre: "Vérifier", lieuId, type: "verifier-lieu" } });

const mPlace = await mission(place.id);
const mLarge = await mission(large.id);
const mSans = await mission(nonPlace.id);
const mSansLieu = await mission(null);
const mAutre = await mission(place.id, autre.id);

const ici = { latitude: 43.6108 + 30 / 111_195, longitude: 3.8767, precision: 15, ageMs: 500, simulee: false };
const loin = { latitude: 43.6108 + 1234 / 111_195, longitude: 3.8767, precision: 15, ageMs: 500, simulee: false };

// Ce que l'espace lit
const liste = r(await missionsDuCompte(moi.id));
egal(liste.length, 4, "les siennes seulement");
const vue = liste.find((m: { id: number }) => m.id === mPlace.id);
egal(Object.keys(vue).sort(), ["compteRendu", "creeLe", "detail", "echeance", "faiteLe", "id", "lieu", "presenceVerifieeLe", "statut", "titre", "type"]);
egal(vue.lieu, { id: place.id, nom: "La Figue Pressée", ville: "Montpellier", emoji: "🍸", position: { latitude: 43.6108, longitude: 3.8767 } });
egal(liste.find((m: { id: number }) => m.id === mSans.id).lieu.position, null, "lieu pas encore placé");
egal(liste.find((m: { id: number }) => m.id === mSansLieu.id).lieu, null, "mission sans lieu");

// Refus
egal(await noterPresence(moi.id, mAutre.id, ici), { ok: false, erreur: "introuvable" }, "la mission d'un autre");
egal(await noterPresence(moi.id, 99999, ici), { ok: false, erreur: "introuvable" });
egal(await noterPresence(moi.id, mSans.id, ici), { ok: false, erreur: "lieu-sans-position" });
egal(await noterPresence(moi.id, mSansLieu.id, ici), { ok: false, erreur: "lieu-sans-position" });
egal(await noterPresence(moi.id, mPlace.id, loin), { ok: false, erreur: "hors-zone", details: { distanceM: 1200, lieu: "La Figue Pressée" } }, "distance arrondie à 100 m");
egal(await noterPresence(moi.id, mPlace.id, { ...ici, simulee: true }), { ok: false, erreur: "position-simulee" });
egal(await noterPresence(moi.id, mPlace.id, { ...ici, ageMs: 120_000 }), { ok: false, erreur: "position-perimee" });
egal(await noterPresence(moi.id, mPlace.id, { ...ici, precision: 900 }), { ok: false, erreur: "position-imprecise", details: { precisionM: 900 } });
egal(await noterPresence(moi.id, mPlace.id, { ...ici, precision: null }), { ok: false, erreur: "position-imprecise" });
// Le rayon du lieu (500 m) compte, comme pour les visites : à 400 m (précision 15), c'est bon ; ailleurs (200 m), non
const a400 = { ...ici, latitude: 43.62 + 400 / 111_195, longitude: 3.88 };
egal((await noterPresence(moi.id, mLarge.id, a400)).ok, true, "dans le rayon du lieu (500 m)");
egal((await noterPresence(moi.id, mPlace.id, { ...ici, latitude: 43.6108 + 400 / 111_195 })).ok, false, "hors du rayon ordinaire");
egal((await b.missionAmbassadeur.findUnique({ where: { id: mPlace.id } }))!.presenceVerifieeLe, null, "aucun refus n'écrit l'heure");

// Sur place
const heure = new Date("2026-10-14T13:42:00Z");
const ok = r(await noterPresence(moi.id, mPlace.id, ici, heure));
egal(ok.ok, true);
egal(ok.mission.presenceVerifieeLe, "2026-10-14T13:42:00.000Z");
egal(ok.mission.statut, "a-faire", "pointée, toujours à faire");
egal(ok.mission.lieu.position, { latitude: 43.6108, longitude: 3.8767 }, "la position du lieu, pas celle du téléphone");
vrai(!JSON.stringify(ok).includes(String(ici.latitude)), "la lecture du téléphone ne ressort pas");
// Deux fois : l'heure ne bouge pas
egal(await noterPresence(moi.id, mPlace.id, ici, new Date("2026-10-14T15:00:00Z")), { ok: false, erreur: "deja-sur-place" });
egal((await b.missionAmbassadeur.findUnique({ where: { id: mPlace.id } }))!.presenceVerifieeLe!.toISOString(), "2026-10-14T13:42:00.000Z");
// Mission terminée : plus à faire
egal(await terminerMission(moi.id, mSans.id, "Lieu bien réel."), true);
egal(await noterPresence(moi.id, mSans.id, ici), { ok: false, erreur: "transition-interdite" });
// Aucune colonne de position dans la mission
const colonnes = (await essai.sql(`SELECT column_name FROM information_schema.columns WHERE table_name = 'missions_ambassadeurs'`)).map((c) => String(c.column_name));
egal(colonnes.filter((c) => /latitude|longitude|position|precision/.test(c)), [], "la mission ne garde aucune position");
await terminerEssai(import.meta.url, essai, verifications.nombre);
