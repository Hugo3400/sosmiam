import { villesFrance } from "@sos-miam/commun/contenus/villes-france";

export function creerHasard(graine) {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOMS = ["Chez Mémé", "Pizzeria du Port", "Le Bistrot Saint-Jean", "Café Cœur", "Bar à Gégé", "Pâtisserie l'Étoile", "Brasserie Œnologie", "Crêperie Fleurie"];
const INFOS = { resto: ["Pizzeria", "Restaurant traditionnel", "Crêperie"], bar: ["Bar à cocktails", "Pub"], patisserie: ["Pâtisserie", "Salon de thé"], sortie: ["Bowling", "Escape game"] };
const TAGS = ["Terrasse", "Pizza au feu de bois", "Cuisine végétarienne", "Fait maison", "Vins naturels", "Brunch"];
const QUARTIERS = ["Le Panier", "Vieux-Port", "Écusson", "", "Croix-Rousse"];
const AUTRES_VILLES = ["Villeneuve-d'Ascq", "Monthieux", "Saint-Tropez", ""];

export function creerLieux(nombre, graine = 1) {
  const hasard = creerHasard(graine);
  const choisir = (liste) => liste[Math.floor(hasard() * liste.length)];
  const types = Object.keys(INFOS);
  return Array.from({ length: nombre }, (_, i) => {
    const type = choisir(types);
    const ville = hasard() < 0.8 ? choisir(villesFrance).nom : choisir(AUTRES_VILLES);
    const avecSos = hasard() < 0.15;
    const ouvre = 8 + Math.floor(hasard() * 10);
    const ferme = (ouvre + 4 + Math.floor(hasard() * 12)) % 24;
    return {
      id: i + 1,
      nom: `${choisir(NOMS)} ${i}`,
      type,
      emoji: "🍽️",
      quartier: choisir(QUARTIERS),
      ville,
      position: hasard() < 0.9 ? { latitude: 42 + hasard() * 8, longitude: -1 + hasard() * 8 } : undefined,
      km: hasard() < 0.5 ? hasard() * 40 : Number.POSITIVE_INFINITY,
      prix: choisir(["€", "€€", "€€€"]),
      prixMoyen: 20,
      info: choisir(INFOS[type]),
      couleurs: ["#F77F00", "#D62828"],
      texte: "",
      rescousses: 0,
      alerte: hasard() < 0.1 ? "Salle calme ce soir" : undefined,
      sos: avecSos ? { places: 1 + Math.floor(hasard() * 6), jusqua: `${String(Math.floor(hasard() * 24)).padStart(2, "0")}:${hasard() < 0.5 ? "00" : "30"}` } : undefined,
      horaires: "",
      ouverture: [{ jours: [0, 1, 2, 3, 4, 5, 6].filter(() => hasard() < 0.8), de: `${String(ouvre).padStart(2, "0")}:00`, a: `${String(ferme).padStart(2, "0")}:30` }],
      plat: hasard() < 0.3 ? "Pizza napolitaine" : "Bouillabaisse",
      tags: TAGS.filter(() => hasard() < 0.3),
      envies: [],
      nouveau: hasard() < 0.1,
      reservable: false,
    };
  });
}
