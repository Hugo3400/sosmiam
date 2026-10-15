import assert from "node:assert/strict";
import { test } from "node:test";

import { envoyerAvisAvecPhoto } from "~/fonctions/avis/envoyer-avis-avec-photo";

const PHOTO = { uri: "file:///photo-1.jpg", largeur: 2048, hauteur: 1536 };
const SAISIE = { visiteId: 42, note: 4, texte: "  Des moules à tomber, et un accueil en or.  ", photo: PHOTO };
const AVIS_PUBLIE = { id: 501, note: 4, texte: "Des moules à tomber, et un accueil en or.", photo: "a1.jpg", signature: "Hugo R.", preuve: "addition", mois: "2026-10", reponseLieu: null, verifie: true, repasOffert: false, avecReduction: false };

function monterService({ photos = [], avis = [] } = {}) {
  const appels = { photos: [], avis: [], etapes: [], lectures: [] };
  let numero = 0;
  const service = {
    async envoyerPhotoAvis(fichier) {
      appels.photos.push(fichier);
      const r = photos.shift() ?? { ok: true };
      if (r === "lance") throw new Error("réseau coupé");
      if (!r.ok) return r;
      numero += 1;
      return { ok: true, photo: `photo-${numero}.jpg` };
    },
    async envoyerAvis(nouvel) {
      appels.avis.push(nouvel);
      const r = avis.shift() ?? { ok: true, pointsGagnes: nouvel.photo ? 10 : 0, avis: { ...AVIS_PUBLIE, photo: nouvel.photo } };
      if (r === "lance") throw new Error("réseau coupé");
      return r;
    },
  };
  const entree = (saisie = SAISIE, deposee = null) => ({
    service,
    saisie,
    deposee,
    lireFichier: async (uri) => {
      appels.lectures.push(uri);
      return { octets: uri };
    },
    surEtape: (etape) => appels.etapes.push(etape),
  });
  return { appels, entree };
}

test("la photo part d'abord, puis l'avis la cite par son nom, texte nettoyé", async () => {
  const { appels, entree } = monterService();
  const r = await envoyerAvisAvecPhoto(entree());
  assert.equal(r.ok, true);
  assert.deepEqual(appels.etapes, ["photo", "avis"]);
  assert.deepEqual(appels.lectures, [PHOTO.uri]);
  assert.deepEqual(appels.avis, [{ visiteId: 42, note: 4, texte: "Des moules à tomber, et un accueil en or.", photo: "photo-1.jpg" }]);
  assert.deepEqual(r.deposee, { uri: PHOTO.uri, nom: "photo-1.jpg" });
  assert.equal(r.envoye.pointsGagnes, 10);
  assert.equal(r.envoye.avis.photo, "photo-1.jpg");
});

test("sans photo : l'avis part seul, photo null", async () => {
  const { appels, entree } = monterService();
  const r = await envoyerAvisAvecPhoto(entree({ ...SAISIE, photo: null }));
  assert.equal(r.ok, true);
  assert.equal(appels.photos.length, 0);
  assert.deepEqual(appels.etapes, ["avis"]);
  assert.equal(appels.avis[0].photo, null);
  assert.equal(r.deposee, null);
});

test("un texte trop court ne fait rien partir", async () => {
  const { appels, entree } = monterService();
  const r = await envoyerAvisAvecPhoto(entree({ ...SAISIE, texte: "Bof." }));
  assert.deepEqual(r, { ok: false, refus: { ou: "texte" }, deposee: null });
  assert.equal(appels.photos.length + appels.avis.length, 0);
});

test("l'avis échoue (réseau, panne) : la photo déjà déposée resservira, sans nouvel envoi", async () => {
  const { appels, entree } = monterService({ avis: ["lance", { ok: false, erreur: "erreur-serveur" }] });
  const premier = await envoyerAvisAvecPhoto(entree());
  assert.deepEqual(premier.refus, { ou: "envoi", erreur: "hors-ligne", details: undefined });
  assert.deepEqual(premier.deposee, { uri: PHOTO.uri, nom: "photo-1.jpg" });
  const deuxieme = await envoyerAvisAvecPhoto(entree(SAISIE, premier.deposee));
  assert.equal(deuxieme.refus.ou, "envoi");
  const troisieme = await envoyerAvisAvecPhoto(entree(SAISIE, deuxieme.deposee));
  assert.equal(troisieme.ok, true);
  assert.equal(appels.photos.length, 1);
  assert.deepEqual(appels.avis.map((a) => a.photo), ["photo-1.jpg", "photo-1.jpg", "photo-1.jpg"]);
});

test("une photo déposée qui a trop attendu (avis-invalide photo) repart toute seule, une fois", async () => {
  const { appels, entree } = monterService({ avis: [{ ok: false, erreur: "avis-invalide", champ: "photo" }] });
  const r = await envoyerAvisAvecPhoto(entree(SAISIE, { uri: PHOTO.uri, nom: "vieille.jpg" }));
  assert.equal(r.ok, true);
  assert.equal(appels.photos.length, 1);
  assert.deepEqual(appels.avis.map((a) => a.photo), ["vieille.jpg", "photo-1.jpg"]);
  assert.deepEqual(appels.etapes, ["avis", "photo", "avis"]);
  assert.deepEqual(r.deposee, { uri: PHOTO.uri, nom: "photo-1.jpg" });
});

test("une photo toute neuve refusée par l'avis : on ne boucle pas, et le prochain Publier la renvoie", async () => {
  const refusPhoto = { ok: false, erreur: "avis-invalide", champ: "photo" };
  const { appels, entree } = monterService({ avis: [refusPhoto, refusPhoto, refusPhoto] });
  const r = await envoyerAvisAvecPhoto(entree());
  assert.deepEqual(r.refus, { ou: "photo", erreur: "avis-invalide" });
  assert.equal(r.deposee, null);
  assert.equal(appels.photos.length, 1);
  assert.equal(appels.avis.length, 1);
  const encore = await envoyerAvisAvecPhoto(entree(SAISIE, r.deposee));
  assert.equal(encore.ok, false);
  assert.equal(appels.photos.length, 2);
});

test("une autre photo choisie entre deux essais : elle part à son tour", async () => {
  const { appels, entree } = monterService();
  const autre = { ...PHOTO, uri: "file:///photo-2.jpg" };
  const r = await envoyerAvisAvecPhoto(entree({ ...SAISIE, photo: autre }, { uri: PHOTO.uri, nom: "photo-0.jpg" }));
  assert.equal(r.ok, true);
  assert.deepEqual(appels.lectures, [autre.uri]);
  assert.equal(appels.avis[0].photo, "photo-1.jpg");
});

test("chaque refus de l'envoi de la photo est rangé au bon endroit, et l'avis ne part pas", async () => {
  const cas = [
    [{ ok: false, erreur: "format-refuse" }, { ou: "photo", erreur: "format-refuse" }],
    [{ ok: false, erreur: "media-trop-lourd" }, { ou: "photo", erreur: "media-trop-lourd" }],
    [{ ok: false, erreur: "media-invalide", champ: "dimensions" }, { ou: "photo", erreur: "media-invalide", champ: "dimensions" }],
    [{ ok: false, erreur: "media-invalide", champ: "format" }, { ou: "photo", erreur: "media-invalide", champ: "format" }],
    [{ ok: false, erreur: "stockage-plein" }, { ou: "photo", erreur: "stockage-plein" }],
    [{ ok: false, erreur: "trop-de-demandes", details: { attenteS: 120 } }, { ou: "photo", erreur: "trop-de-demandes", details: { attenteS: 120 } }],
    [{ ok: false, erreur: "introuvable" }, { ou: "photo", erreur: "introuvable" }],
    [{ ok: false, erreur: "compte-limite", details: { jusqua: "2026-10-20T10:00:00.000Z" } }, { ou: "limite" }],
    [{ ok: false, erreur: "connexion-requise" }, { ou: "ecran", erreur: "connexion-requise", details: undefined }],
    [{ ok: false, erreur: "erreur-serveur" }, { ou: "envoi", erreur: "erreur-serveur", details: undefined }],
    ["lance", { ou: "envoi", erreur: "hors-ligne", details: undefined }],
  ];
  for (const [reponse, attendu] of cas) {
    const { appels, entree } = monterService({ photos: [reponse] });
    const r = await envoyerAvisAvecPhoto(entree());
    assert.deepEqual(r.refus, attendu, JSON.stringify(reponse));
    assert.equal(r.deposee, null);
    assert.equal(appels.avis.length, 0, JSON.stringify(reponse));
  }
});

test("un fichier illisible sur le téléphone : refus de la photo, rien n'est envoyé", async () => {
  const { appels, entree } = monterService();
  const e = entree();
  e.lireFichier = async () => {
    throw new Error("fichier disparu");
  };
  const r = await envoyerAvisAvecPhoto(e);
  assert.deepEqual(r.refus, { ou: "photo", erreur: "media-invalide" });
  assert.equal(appels.photos.length + appels.avis.length, 0);
});

test("les refus de l'avis lui-même : plein écran, texte, limite", async () => {
  const cas = [
    [{ ok: false, erreur: "avis-deja-donne" }, "ecran"],
    [{ ok: false, erreur: "avis-ferme" }, "ecran"],
    [{ ok: false, erreur: "membre-du-lieu" }, "ecran"],
    [{ ok: false, erreur: "introuvable" }, "ecran"],
    [{ ok: false, erreur: "avis-invalide" }, "texte"],
    [{ ok: false, erreur: "compte-limite" }, "limite"],
    [{ ok: false, erreur: "trop-de-demandes" }, "envoi"],
  ];
  for (const [reponse, ou] of cas) {
    const { entree } = monterService({ avis: [reponse] });
    const r = await envoyerAvisAvecPhoto(entree());
    assert.equal(r.refus.ou, ou, reponse.erreur);
    assert.deepEqual(r.deposee, { uri: PHOTO.uri, nom: "photo-1.jpg" }, reponse.erreur);
  }
});
