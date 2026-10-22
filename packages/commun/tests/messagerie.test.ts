import { test } from "node:test";
import assert from "node:assert/strict";

import { convertirCodeEnReaction } from "../src/fonctions/messagerie/convertir-code-en-reaction.ts";
import { convertirReactionEnCode } from "../src/fonctions/messagerie/convertir-reaction-en-code.ts";
import { peutAdministrerGroupe } from "../src/fonctions/messagerie/peut-administrer-groupe.ts";
import { CODES_REACTIONS } from "../src/regles/chat.ts";
import { REACTIONS_CHAT } from "../src/types/conversations.ts";
import type { MembreGroupe } from "../src/types/messagerie.ts";
import { estIdClient } from "../src/validation/est-id-client.ts";
import { validerNouveauGroupe } from "../src/validation/valider-nouveau-groupe.ts";

test("réactions : ❤️ coeur, 😂 rire, 😋 miam, 👍 pouce, 😮 surprise, dans les deux sens", () => {
  assert.deepEqual(REACTIONS_CHAT.map(convertirReactionEnCode), ["coeur", "rire", "miam", "pouce", "surprise"]);
  assert.deepEqual(CODES_REACTIONS.map(convertirCodeEnReaction), [...REACTIONS_CHAT]);
  assert.equal(convertirReactionEnCode("❤"), "coeur");
  assert.equal(convertirReactionEnCode("😋"), "miam");
  assert.equal(convertirReactionEnCode("🍕"), null);
  assert.equal(convertirCodeEnReaction("bisou"), null);
});

test("idClient : un UUID v4 en minuscules, rien d'autre", () => {
  assert.equal(estIdClient("3f0c2b1e-8d4a-4c5e-9f6a-1b2c3d4e5f60"), true);
  assert.equal(estIdClient("3F0C2B1E-8D4A-4C5E-9F6A-1B2C3D4E5F60"), false);
  assert.equal(estIdClient("3f0c2b1e-8d4a-1c5e-9f6a-1b2c3d4e5f60"), false);
  assert.equal(estIdClient("3f0c2b1e-8d4a-4c5e-7f6a-1b2c3d4e5f60"), false);
  assert.equal(estIdClient("3f0c2b1e8d4a4c5e9f6a1b2c3d4e5f60"), false);
  assert.equal(estIdClient(42), false);
  assert.equal(estIdClient(undefined), false);
});

const groupe = { titre: " Les gourmands ", emoji: " 🍜 ", invites: ["k7mq2x9pa4", "abcdefghij"] };

test("nouveau groupe : nettoyé et rendu ; titre de 40 caractères, sans mot interdit, et un emoji", () => {
  assert.deepEqual(validerNouveauGroupe(groupe), { ok: true, groupe: { titre: "Les gourmands", emoji: "🍜", invites: ["k7mq2x9pa4", "abcdefghij"] } });
  assert.equal(validerNouveauGroupe({ ...groupe, titre: "t".repeat(40) }).ok, true);
  assert.deepEqual(validerNouveauGroupe({ ...groupe, titre: "t".repeat(41) }), { ok: false, champ: "titre" });
  assert.deepEqual(validerNouveauGroupe({ ...groupe, titre: "" }), { ok: false, champ: "titre" });
  assert.deepEqual(validerNouveauGroupe({ ...groupe, titre: "Les connards" }), { ok: false, champ: "titre", raison: "mot-interdit" });
  assert.deepEqual(validerNouveauGroupe({ ...groupe, emoji: "" }), { ok: false, champ: "emoji" });
});

test("nouveau groupe : 1 à 19 invités (20 avec toi), identifiants publics sans doublon", () => {
  const dixNeuf = Array.from({ length: 19 }, (_, i) => `personne${String.fromCharCode(97 + i)}${String.fromCharCode(97 + i)}`);
  assert.equal(validerNouveauGroupe({ ...groupe, invites: dixNeuf }).ok, true);
  assert.deepEqual(validerNouveauGroupe({ ...groupe, invites: [...dixNeuf, "personnezz"] }), { ok: false, champ: "invites" });
  assert.deepEqual(validerNouveauGroupe({ ...groupe, invites: [] }), { ok: false, champ: "invites" });
  assert.deepEqual(validerNouveauGroupe({ ...groupe, invites: ["k7mq2x9pa4", "k7mq2x9pa4"] }), { ok: false, champ: "invites" });
  assert.deepEqual(validerNouveauGroupe({ ...groupe, invites: ["moi"] }), { ok: false, champ: "invites" });
  assert.deepEqual(validerNouveauGroupe({ titre: "Les gourmands", emoji: "🍜" }), { ok: false, champ: "invites" });
});

const membre = (id: string, depuis: string, role: MembreGroupe["role"] = "membre", statut: MembreGroupe["statut"] = "accepte"): MembreGroupe => ({
  id,
  role,
  depuis,
  statut,
});

test("administrer : toujours faux pour un privé ou une sortie, même pour le plus ancien membre", () => {
  const membres = [membre("lea", "2026-10-01T10:00:00Z"), membre("tom", "2026-10-02T10:00:00Z")];
  assert.equal(peutAdministrerGroupe("prive", "lea", membres), false);
  assert.equal(peutAdministrerGroupe("sortie", "lea", membres), false);
  assert.equal(peutAdministrerGroupe("sortie", "lea", [membre("lea", "2026-10-01T10:00:00Z", "admin")]), false);
  assert.equal(peutAdministrerGroupe("groupe", "lea", membres), true);
});

test("administrer un groupe : les admins ; sans admin, le plus ancien membre ; jamais un invité qui n'a pas accepté", () => {
  const membres = [
    membre("lea", "2026-10-01T10:00:00Z"),
    membre("tom", "2026-10-02T10:00:00Z", "admin"),
    membre("ines", "2026-10-03T10:00:00Z", "admin"),
  ];
  assert.equal(peutAdministrerGroupe("groupe", "tom", membres), true);
  assert.equal(peutAdministrerGroupe("groupe", "ines", membres), true);
  assert.equal(peutAdministrerGroupe("groupe", "lea", membres), false);
  assert.equal(peutAdministrerGroupe("groupe", "inconnu", membres), false);
  // Un invité en attente arrivé « avant » ne passe pas devant : il n'est pas encore membre
  const sansAdmin = [
    membre("sofia", "2026-09-01T10:00:00Z", "membre", "invite"),
    membre("lea", "2026-10-02T10:00:00Z"),
    membre("tom", "2026-10-01T10:00:00Z"),
  ];
  assert.equal(peutAdministrerGroupe("groupe", "tom", sansAdmin), true);
  assert.equal(peutAdministrerGroupe("groupe", "lea", sansAdmin), false);
  assert.equal(peutAdministrerGroupe("groupe", "sofia", sansAdmin), false);
  // Un admin qui a refusé ou pas encore accepté ne compte pas : le plus ancien membre reprend la main
  assert.equal(peutAdministrerGroupe("groupe", "sofia", [membre("sofia", "2026-09-01T10:00:00Z", "admin", "invite")]), false);
  assert.equal(peutAdministrerGroupe("groupe", "tom", [membre("lea", "2026-09-01T10:00:00Z", "admin", "refuse"), membre("tom", "2026-10-01T10:00:00Z")]), true);
  // À égalité d'arrivée, le plus petit identifiant
  const egalite = [membre("tom", "2026-10-01T10:00:00Z"), membre("lea", "2026-10-01T10:00:00Z")];
  assert.equal(peutAdministrerGroupe("groupe", "lea", egalite), true);
  assert.equal(peutAdministrerGroupe("groupe", "tom", egalite), false);
});
