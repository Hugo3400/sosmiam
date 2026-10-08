import type { BilanMois, ChiffresMois } from "../../services/statistiques.ts";

const echapper = (texte: string) => texte.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const nombre = new Intl.NumberFormat("fr-FR");
const nomDuMois = (mois: string) => new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(`${mois}-15T12:00:00`));

type Ligne = { libelle: string; cle: Exclude<keyof ChiffresMois, "mois" | "bigSos"> };
const PARTIES: { titre: string; lignes: Ligne[] }[] = [
  { titre: "Le site", lignes: [{ libelle: "Visiteurs", cle: "visiteurs" }, { libelle: "Visites", cle: "visites" }, { libelle: "Pages vues", cle: "vues" }] },
  { titre: "La communauté", lignes: [{ libelle: "Inscrits à la newsletter", cle: "inscrits" }, { libelle: "Comptes créés", cle: "comptes" }, { libelle: "Ambassadeurs validés", cle: "ambassadeurs" }, { libelle: "Missions faites", cle: "missions" }] },
  { titre: "Les lieux", lignes: [{ libelle: "Lieux ajoutés", cle: "lieux" }, { libelle: "Publications parues", cle: "publications" }, { libelle: "Demandes de lieux reçues", cle: "demandes" }] },
  { titre: "Contact et modération", lignes: [{ libelle: "Mails envoyés", cle: "mails" }, { libelle: "Notifications reçues", cle: "notifications" }, { libelle: "Signalements traités", cle: "signalements" }] },
];

function evolution(actuel: number, avant: number): string {
  if (avant === 0) return actuel === 0 ? "=" : "nouveau";
  const ecart = Math.round(((actuel - avant) / avant) * 100);
  return ecart === 0 ? "=" : `${ecart > 0 ? "+" : ""}${ecart} %`;
}

/** Le bilan d'un mois en page HTML imprimable (A4) : à enregistrer en PDF depuis la fenêtre d'impression. */
export function creerHtmlBilan({ actuel, precedent, totaux }: BilanMois, genereLe = new Date()): string {
  const titre = `Bilan de SOS Miam · ${nomDuMois(actuel.mois)}`;
  const parties = PARTIES.map((partie) => `
    <section><h2>${partie.titre}</h2><div class="tuiles">${partie.lignes.map(({ libelle, cle }) => `
      <div class="tuile"><p class="libelle">${libelle}</p><p class="valeur">${nombre.format(actuel[cle])}</p>
      <p class="ecart">${evolution(actuel[cle], precedent[cle])} <span>vs ${nomDuMois(precedent.mois)} (${nombre.format(precedent[cle])})</span></p></div>`).join("")}
    </div></section>`).join("");
  const bigSos = actuel.bigSos.length === 0
    ? "<p class=\"vide\">Aucun BIG SOS à la une ce mois-ci.</p>"
    : `<ul class="big-sos">${actuel.bigSos.map((b) => `<li><strong>${echapper(b.lieu.nom)}</strong> (${echapper(b.lieu.ville)}), à la une le ${new Date(b.debutLe).toLocaleDateString("fr-FR")}${
      b.objectifCible ? ` · ${echapper(b.objectifTitre ?? "objectif")} : ${nombre.format(b.objectifAtteint)} / ${nombre.format(b.objectifCible)}` : ""}${b.bilan ? `<br><em>${echapper(b.bilan)}</em>` : ""}</li>`).join("")}</ul>`;
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>${echapper(titre)}</title>
<style>
  @page { size: A4; margin: 16mm; }
  body { font-family: Inter, Arial, Helvetica, sans-serif; color: #1A1A1A; margin: 0; }
  header { border-bottom: 4px solid #FFD60A; padding-bottom: 10px; margin-bottom: 18px; }
  h1 { font-size: 26px; margin: 0; } header p { margin: 4px 0 0; color: #5C5A55; font-size: 13px; }
  h2 { font-size: 16px; margin: 18px 0 8px; }
  .tuiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .tuile { border: 1px solid #EDE6D3; border-radius: 10px; padding: 8px 10px; break-inside: avoid; }
  .libelle { margin: 0; font-size: 11px; color: #5C5A55; } .valeur { margin: 2px 0; font-size: 22px; font-weight: 800; }
  .ecart { margin: 0; font-size: 11px; font-weight: 700; } .ecart span { font-weight: 400; color: #5C5A55; }
  .totaux { margin-top: 20px; padding: 10px 12px; background: #FFF8E7; border-radius: 10px; font-size: 13px; }
  .big-sos { font-size: 13px; padding-left: 18px; } .big-sos li { margin-bottom: 6px; } .vide { font-size: 13px; color: #5C5A55; }
  footer { margin-top: 24px; font-size: 11px; color: #5C5A55; }
</style></head>
<body>
  <header><h1>🛟 ${echapper(titre)}</h1><p>Généré le ${genereLe.toLocaleDateString("fr-FR")} depuis le logiciel de gestion. Visites comptées sans cookie, seulement des totaux.</p></header>
  ${parties}
  <section><h2>BIG SOS</h2>${bigSos}</section>
  <p class="totaux">Aujourd'hui : <strong>${nombre.format(totaux.lieuxEnLigne)}</strong> lieux en ligne · <strong>${nombre.format(totaux.inscrits)}</strong> inscrits à la newsletter ·
    <strong>${nombre.format(totaux.ambassadeursActifs)}</strong> ambassadeurs actifs · <strong>${nombre.format(totaux.comptes)}</strong> comptes.</p>
  <footer>SOS Miam · sosmiam.fr</footer>
</body></html>`;
}
