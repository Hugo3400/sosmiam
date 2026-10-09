// Tests du rattachement d'un compte à son lieu (espace pro) : « Chercher mon lieu », demander à gérer un lieu (preuve,
// SIRET, lieu masqué, doublon, redemande après refus, limites), `compte.pro` et la liste de ses rattachements.
// Tout en mémoire : aucune base de données n'est touchée.
import assert from "node:assert/strict";
import { after, test } from "node:test";

import { LIMITE_RATTACHEMENTS } from "../src/routes/comptes.ts";
import { creerBancPro } from "./outils/creer-banc-pro.ts";

const { banc, memoire, demander, creerCompte, ajouterLieu } = await creerBancPro();
after(() => banc && memoire && Promise.resolve());
const banc2 = await creerBancPro();
after(banc2.fermer);
after(async () => (await import("./outils/creer-banc-pro.ts")) && undefined);
