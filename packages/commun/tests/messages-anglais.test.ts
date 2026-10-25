import { test } from "node:test";
import assert from "node:assert/strict";
import { MESSAGES_CARRIERE_ANGLAIS } from "../src/contenus/anglais/messages-carriere.ts";
import { MESSAGES_CONNEXION_QR_ANGLAIS } from "../src/contenus/anglais/messages-connexion-qr.ts";
import { MESSAGES_RESERVATIONS_ANGLAIS } from "../src/contenus/anglais/messages-reservations.ts";
import { MESSAGES_SECURITE_ANGLAIS } from "../src/contenus/anglais/messages-securite.ts";
import { MESSAGES_SERVICES_COMMUNAUTE_ANGLAIS } from "../src/contenus/anglais/messages-services-communaute.ts";
import { MESSAGES_SERVICES_SOCIAUX_ANGLAIS } from "../src/contenus/anglais/messages-services-sociaux.ts";
import { MESSAGES_CARRIERE } from "../src/contenus/messages-carriere.ts";
import { MESSAGES_CONNEXION_QR } from "../src/contenus/messages-connexion-qr.ts";
import { MESSAGES_RESERVATIONS } from "../src/contenus/messages-reservations.ts";
import { MESSAGES_SECURITE } from "../src/contenus/messages-securite.ts";
import type { MessageService } from "../src/contenus/messages-services.ts";
import { MESSAGES_SERVICES_COMMUNAUTE } from "../src/contenus/messages-services-communaute.ts";
import { MESSAGES_SERVICES_SOCIAUX } from "../src/contenus/messages-services-sociaux.ts";

const PAIRES: [string, Readonly<Record<string, MessageService>>, Readonly<Record<string, MessageService>>][] = [
  ["sécurité", MESSAGES_SECURITE, MESSAGES_SECURITE_ANGLAIS],
  ["carrière", MESSAGES_CARRIERE, MESSAGES_CARRIERE_ANGLAIS],
  ["connexion par QR", MESSAGES_CONNEXION_QR, MESSAGES_CONNEXION_QR_ANGLAIS],
  ["communauté", MESSAGES_SERVICES_COMMUNAUTE, MESSAGES_SERVICES_COMMUNAUTE_ANGLAIS],
  ["réservations", MESSAGES_RESERVATIONS, MESSAGES_RESERVATIONS_ANGLAIS],
  ["partie sociale", MESSAGES_SERVICES_SOCIAUX, MESSAGES_SERVICES_SOCIAUX_ANGLAIS],
];

const accolades = (texte: string) => [...texte.matchAll(/\{[a-zA-Z]+\}/g)].map((m) => m[0]).sort();
const FRANCAIS_OUBLIE = /[àâçéèêëîïôûùüÿœ«»]|\s[?!:;]|\b(tu|ton|ta|tes|le|la|les|un|une|des|du|et|ou|est|pas|avec|pour)\b/i;

test("messages anglais : mêmes codes, même ordre et même emoji que le français", () => {
  for (const [nom, fr, en] of PAIRES) {
    assert.deepEqual(Object.keys(en), Object.keys(fr), nom);
    for (const code of Object.keys(fr)) assert.equal(en[code].emoji, fr[code].emoji, `${nom} : ${code}`);
  }
});

test("messages anglais : les mêmes valeurs entre accolades que le français, dans le titre comme dans le texte", () => {
  for (const [nom, fr, en] of PAIRES)
    for (const code of Object.keys(fr)) {
      assert.deepEqual(accolades(en[code].titre), accolades(fr[code].titre), `${nom} : ${code} (titre)`);
      assert.deepEqual(accolades(en[code].texte), accolades(fr[code].texte), `${nom} : ${code} (texte)`);
    }
});

test("messages anglais : aucun mot ni signe français oublié, rien de vide, pas d'espace avant la ponctuation", () => {
  for (const [nom, , en] of PAIRES)
    for (const [code, message] of Object.entries(en))
      for (const champ of ["titre", "texte"] as const) {
        const texte = message[champ];
        assert.ok(texte.trim().length > 0, `${nom} : ${code} (${champ}) vide`);
        assert.equal(FRANCAIS_OUBLIE.test(texte), false, `${nom} : ${code} (${champ}) : « ${texte} »`);
        assert.equal(texte, texte.trim(), `${nom} : ${code} (${champ}) : espaces en trop`);
      }
});
