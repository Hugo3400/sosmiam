// Tests de l'applicateur des effets sociaux (controleurs/effets-sociaux.ts) : la cloche avant la réponse, le téléphone
// après et sans jamais faire échouer la demande, tout par prevenirCompte (hors anti-spam, réponse de Hugo du 14/10/2026),
// rien pour qui a coupé les notifications sociales, sans son dans les 30 s d'une même conversation. Tout en mémoire.
import assert from "node:assert/strict";
import { test } from "node:test";

import { creerAppliquerEffetsSociaux } from "../src/controleurs/effets-sociaux.ts";
import type { NouvelleNotificationCloche, EffetSocial, MessagePushSocial } from "../src/services/effets-sociaux-regles.ts";

const tourSuivant = () => new Promise<void>((fini) => setImmediate(() => setImmediate(fini)));

function preparer(o: { echec?: boolean; clocheEnPanne?: boolean; sansPush?: number[] } = {}) {
  const horloge = { maintenant: Date.parse("2026-10-14T10:00:00Z") };
  const cloche: NouvelleNotificationCloche[] = [];
  const envois: { compteId: number; message: MessagePushSocial }[] = [];
  const appliquer = creerAppliquerEffetsSociaux({
    cloche: {
      noter: async (n) => {
        if (o.clocheEnPanne) throw Object.assign(new Error("panne avec lea@exemple.fr dedans"), { code: "P1001" });
        cloche.push(...n);
      },
    },
    prevenirCompte: async (compteId, message) => {
      if (o.echec) throw new Error("Apple ne répond pas");
      envois.push({ compteId, message });
    },
    lirePushSocial: async (ids) => new Set(ids.filter((id) => !(o.sansPush ?? []).includes(id))),
    horloge: () => horloge.maintenant,
  });
  return { horloge, cloche, envois, appliquer };
}

const message = (compteId: number, conversation: number): EffetSocial => ({
  quoi: "push", compteId, sorte: "message",
  message: { titre: "💬 Léa", texte: "Nouveau message. Viens voir !", lien: `/potes/discussion/${conversation}`, regroupement: `conversation:${conversation}` },
});

test("la cloche est écrite avant la réponse ; le téléphone part après, au tour suivant", async () => {
  const { cloche, envois, appliquer } = preparer();
  await appliquer([
    { quoi: "cloche", notification: { compteId: 2, type: "bande-ajout", acteurId: 1 } },
    { quoi: "push", compteId: 2, sorte: "bande-ajout", message: { titre: "🤝 Léa a rejoint ta bande", texte: "Grâce à ton lien. Dis-lui bonjour !", lien: "/potes/profil/abcdefghij" } },
  ]);
  assert.equal(cloche.length, 1, "la cloche est déjà là quand le contrôleur répond");
  assert.equal(envois.length, 0, "le téléphone n'est pas encore prévenu : la réponse part d'abord");
  await tourSuivant();
  assert.deepEqual(envois.map((e) => e.compteId), [2]);
});

test("messages ET notifications de bande ou de sortie passent par prevenirCompte (hors anti-spam)", async () => {
  const { envois, appliquer } = preparer();
  const sortes = ["bande-ajout", "bande-acceptee", "invitation-sortie", "sortie-lieu-choisi"] as const;
  await appliquer([message(5, 1), ...sortes.map((sorte, i): EffetSocial => ({ quoi: "push", compteId: 10 + i, sorte, message: { titre: "🎉", texte: "Tu viens ?", lien: "/potes" } }))]);
  await tourSuivant();
  assert.deepEqual(envois.map((e) => e.compteId).sort((a, b) => a - b), [5, 10, 11, 12, 13]);
});

test("un envoi qui échoue, ou une cloche en panne, ne font jamais échouer la demande (et rien de personnel au journal)", async () => {
  const journal: string[] = [];
  const erreurAvant = console.error;
  console.error = (...morceaux: unknown[]) => void journal.push(morceaux.map(String).join(" "));
  try {
    const enEchec = preparer({ echec: true });
    await enEchec.appliquer([message(5, 1)]);
    await tourSuivant();
    const enPanne = preparer({ clocheEnPanne: true });
    await enPanne.appliquer([{ quoi: "cloche", notification: { compteId: 2, type: "mention", acteurId: 1 } }]);
  } finally {
    console.error = erreurAvant;
  }
  assert.equal(journal.length, 2);
  assert.ok(journal.every((ligne) => !ligne.includes("lea@exemple.fr") && !ligne.includes("Viens voir") && !ligne.includes("Apple ne répond pas")), journal.join("\n"));
});

test("pushSocial coupé : rien sur le téléphone (la cloche, elle, se remplit)", async () => {
  const { cloche, envois, appliquer } = preparer({ sansPush: [7] });
  await appliquer([message(7, 1), message(8, 1), { quoi: "cloche", notification: { compteId: 7, type: "bande-acceptee", acteurId: 8 } }]);
  await tourSuivant();
  assert.deepEqual(envois.map((e) => e.compteId), [8]);
  assert.equal(cloche.length, 1);
});

test("sonore faux dans les 30 s d'une même conversation, pour chaque destinataire", async () => {
  const { horloge, envois, appliquer } = preparer();
  await appliquer([message(5, 1), message(6, 1)]);
  await tourSuivant();
  horloge.maintenant += 10_000;
  await appliquer([message(5, 1), message(5, 2)]);
  await tourSuivant();
  horloge.maintenant += 25_000;
  await appliquer([message(5, 1)]);
  await tourSuivant();
  assert.deepEqual(envois.map((e) => [e.compteId, e.message.regroupement, e.message.sonore]), [
    [5, "conversation:1", true], [6, "conversation:1", true],
    [5, "conversation:1", false], [5, "conversation:2", true],
    [5, "conversation:1", true],
  ]);
});
