// Test d'assemblage de la partie sociale : chaque méthode des clients de commun (creerServicesSociauxApi, ce que l'app
// appelle) part vers le banc social de l'API, et une route la reconnaît (jamais le 404 « introuvable » des adresses
// inconnues). Les réponses elles-mêmes (refus, données) sont vérifiées par les tests de chaque domaine. Tout en mémoire.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import { creerClientHttp } from "../../../packages/commun/src/client-api/client-http.ts";
import { creerServicesSociauxApi } from "../../../packages/commun/src/client-api/api/creer-services-sociaux-api.ts";
import { creerBancSocial } from "./outils/creer-banc-social.ts";

let banc: Awaited<ReturnType<typeof creerBancSocial>>;
before(async () => {
  banc = await creerBancSocial();
});
after(() => banc.fermer());

const ID = "zzzzzzzzzz";
const demain = () => new Date(banc.horloge.maintenant + 24 * 60 * 60_000).toISOString();
/** Des arguments de la bonne forme ; par défaut, "1" (un identifiant de conversation, de sortie, de liste…) */
const ARGUMENTS: Record<string, () => unknown[]> = {
  "social.modifierReglages": () => [{}], "social.lireProfil": () => [ID], "social.listerLiensDe": () => [ID, "abonnes"], "social.listerListesDe": () => [ID],
  "social.masquer": () => ["activite", "liste:1", true], "social.listerMasques": () => [],
  "cloche.lister": () => [], "cloche.marquerVu": () => [], "cloche.effacerLues": () => [],
  "bande.rejoindre": () => ["lea.gourmande", "abcdefghjkmn", "qr"], "bande.bloquer": () => [ID, true],
  "suivis.suivre": () => [ID, true], "suivis.repondreDemande": () => [ID, true], "suivis.changerConfidentialite": () => [false],
  "suivis.listerAbonnes": () => [], "suivis.listerAbonnements": () => [],
  "messagerie.listerConversations": () => [], "messagerie.lireFil": () => ["1", {}], "messagerie.ouvrirPrive": () => [ID],
  "messagerie.creerGroupe": () => [{ titre: "Les gourmands", emoji: "🍕", invites: [] }, randomUUID()], "messagerie.modifierGroupe": () => ["1", { titre: "Miam" }],
  "messagerie.inviterAuGroupe": () => ["1", [ID]], "messagerie.repondreInvitation": () => ["1", true], "messagerie.retirerMembre": () => ["1", "moi"],
  "messagerie.changerRole": () => ["1", ID, "admin"], "messagerie.couper": () => ["1", true], "messagerie.marquerLu": () => ["1", "1"],
  "messagerie.envoyerTexte": () => ["1", randomUUID(), "Coucou"], "messagerie.envoyerLieu": () => ["1", randomUUID(), 1, null],
  "messagerie.envoyerMedia": () => ["1", randomUUID(), new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), "image/jpeg"],
  "messagerie.preparerLectureMedia": () => ["1", "1"], "messagerie.supprimerMessage": () => ["1", "1"], "messagerie.reagir": () => ["1", "1", "coeur", true],
  "messagerie.modifierMessage": () => ["1", "1", "Coucou"], "messagerie.epingler": () => ["1", true],
  "messagerie.envoyerPhotoGroupe": () => ["1", new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], "messagerie.retirerPhotoGroupe": () => ["1"],
  "messagerie.preparerLecturePhotoGroupe": () => ["1"], "messagerie.listerPartages": () => ["1", "photo"],
  "messagerie.envoyerLieuAPotes": () => [randomUUID(), 1, [ID], null], "messagerie.listerLieuxRecus": () => [], "messagerie.listerLieuxEnvoyes": () => [],
  "sorties.creer": () => [{ titre: "Pizza du jeudi", emoji: "🍕", quand: demain(), finVote: demain(), invites: [], lieux: [] }, randomUUID()],
  "sorties.lire": () => ["1"], "sorties.repondre": () => ["1", true], "sorties.inviter": () => ["1", [ID]], "sorties.proposer": () => ["1", 1],
  "sorties.voter": () => ["1", 1, true], "sorties.retirerParticipant": () => ["1", ID],
  "listes.listerADecouvrir": () => [], "listes.creer": () => [{ titre: "Pizzas", emoji: "🍕", description: "", visibilite: "tous" }, randomUUID()],
  "listes.modifier": () => ["1", { titre: "Miam" }], "listes.basculerLieu": () => ["1", 1, true], "listes.inviterCoAuteur": () => ["1", ID],
  "listes.retirerCoAuteur": () => ["1", "moi"], "listes.suivre": () => ["1", true],
  "commentaires.lister": () => ["1"], "commentaires.commenter": () => ["1", { texte: "Miam !" }], "commentaires.modifier": () => ["1", "Miam"],
  "commentaires.aimer": () => ["1", true], "commentaires.masquerCommeLieu": () => ["1", true],
  "signalements.signaler": () => [{ cible: "profil", cibleId: ID, raison: "autre", explication: "Pour voir" }], "signalements.listerMiens": () => ["message"],
  "moderation.contester": () => ["1", "Je conteste"],
};

test("chaque méthode des clients sociaux de commun trouve sa route dans l'API", async () => {
  const moi = await banc.creerPersonne();
  const demandes: { appel: string; adresse: string; statut: number; erreur: unknown }[] = [];
  let appel = "";
  const versLeBanc = (async (url: string, init: RequestInit) => {
    const { pathname, search } = new URL(url);
    const corps = typeof init.body === "string" ? JSON.parse(init.body) : init.body ? null : undefined;
    const r = await banc.demander(init.method ?? "GET", pathname + search, { jeton: moi.jeton, corps });
    demandes.push({ appel, adresse: `${init.method} ${pathname}`, statut: r.statut, erreur: r.corps?.erreur });
    return new Response(JSON.stringify(r.corps), { status: r.statut, headers: { "Content-Type": "application/json" } });
  }) as unknown as typeof fetch;
  const services = creerServicesSociauxApi(creerClientHttp({ adresse: "http://banc", lireJeton: () => moi.jeton, fetch: versLeBanc }));

  const sansDemande: string[] = [];
  for (const [domaine, service] of Object.entries(services)) {
    for (const [nom, methode] of Object.entries(service as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>)) {
      appel = `${domaine}.${nom}`;
      const avant = demandes.length;
      const r = await methode(...(ARGUMENTS[appel]?.() ?? ["1"]));
      // La lecture d'un média n'envoie rien : elle prépare l'adresse et les en-têtes pour l'outil du téléphone
      if (appel === "messagerie.preparerLectureMedia" || appel === "messagerie.preparerLecturePhotoGroupe") {
        const { pathname } = new URL((r as { url: string }).url);
        const lu = await banc.demander("GET", pathname, { jeton: moi.jeton });
        demandes.push({ appel, adresse: `GET ${pathname}`, statut: lu.statut, erreur: lu.corps?.erreur });
      }
      if (demandes.length === avant) sansDemande.push(appel);
    }
  }
  assert.deepEqual(sansDemande, [], "chaque méthode parle à l'API");
  const sansRoute = demandes.filter((d) => d.statut === 404 && d.erreur === "introuvable").map((d) => `${d.appel} (${d.adresse})`);
  // L'export de tes données (GET /app/social/export) est arrivé avec le lot L7 : plus aucune méthode sans sa route
  assert.deepEqual(sansRoute, []);
  assert.ok(demandes.length >= 80, `${demandes.length} demandes`);
});
