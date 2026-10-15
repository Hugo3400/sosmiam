import type { EtiquetteSortieMiamis, ParticipantSortieMiamis, SortieMiamis } from "@sos-miam/commun/types/sorties-miamis";
import type { PersonneResume } from "@sos-miam/commun/types/social";
import { LIEUX_MIAMIS_EXEMPLES as LIEUX, MIAMIS_EXEMPLES as M } from "~/contenus/miamis/personnes-miamis-exemples";

const officielles = (...noms: string[]): EtiquetteSortieMiamis[] => noms.map((nom) => ({ nom, officielle: true }));
const libre = (nom: string): EtiquetteSortieMiamis => ({ nom, officielle: false });

const participant = (personne: PersonneResume, details: Partial<Omit<ParticipantSortieMiamis, "personne">> = {}): ParticipantSortieMiamis => ({
  personne,
  habitue: false,
  dansTaBande: false,
  nouveau: false,
  present: false,
  ...details,
});

function prochainJour(maintenant: Date, jourSemaine: number, heure: number, minutes = 0): string {
  const date = new Date(maintenant);
  const ecart = (jourSemaine - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + ecart);
  date.setHours(heure, minutes, 0, 0);
  return date.toISOString();
}

function dansUnMoment(maintenant: Date, minutes: number): string {
  const date = new Date(maintenant.getTime() + minutes * 60_000);
  date.setMinutes(Math.ceil(date.getMinutes() / 15) * 15, 0, 0);
  return date.toISOString();
}

const ilYa = (maintenant: Date, heures: number) => new Date(maintenant.getTime() - heures * 3_600_000).toISOString();

type ChampsCommuns = Omit<SortieMiamis, "id" | "titre" | "quand" | "lieu" | "organisateur" | "etiquettes" | "places" | "participants">;

const base: ChampsCommuns = {
  description: "",
  sortiesTenuesOrganisateur: { tenues: 0, prevues: 0 },
  rescoussesOrganisateur: 0,
  public: { type: "tous" },
  placeGardeePourNouveau: false,
  recurrente: false,
  habitues: 0,
  nombreEnAttente: 0,
  listeAttente: [],
  demandes: [],
  conversationId: null,
  moi: { place: "aucune", rangAttente: null, present: false },
};

export function creerSortiesMiamisExemples(maintenant: Date, moi: PersonneResume): SortieMiamis[] {
  return [
    {
      ...base,
      id: "miamis-ce-soir",
      titre: "Moules du Capitaine",
      description: "On goûte les moules du port en petite bande. Je réserve la grande table près du hublot, vous apportez la bonne humeur.",
      quand: dansUnMoment(maintenant, 40),
      lieu: LIEUX.capitaine,
      organisateur: M.sam,
      sortiesTenuesOrganisateur: { tenues: 6, prevues: 6 },
      rescoussesOrganisateur: 15,
      etiquettes: officielles("Poisson et fruits de mer", "Chill"),
      places: 5,
      participants: [participant(M.sam), participant(moi), participant(M.theo)],
      conversationId: "miamis-ce-soir",
      moi: { place: "accepte", rangAttente: null, present: false },
    },
    {
      ...base,
      id: "miamis-brunch",
      titre: "Brunch des nouveaux arrivants",
      description: "Nouveau ou nouvelle à Montpellier ? Moi aussi, il y a six mois. On brunche, on papote, et chacun repart avec trois adresses à tester. Viens comme tu es !",
      quand: prochainJour(maintenant, 0, 11),
      lieu: LIEUX.bouee,
      organisateur: M.lea,
      sortiesTenuesOrganisateur: { tenues: 4, prevues: 4 },
      rescoussesOrganisateur: 12,
      etiquettes: [...officielles("Nouveaux arrivants", "Végétarien", "LGBT+ friendly"), libre("Fans de brunch salé")],
      places: 6,
      placeGardeePourNouveau: true,
      recurrente: true,
      habitues: 3,
      participants: [participant(M.lea, { dansTaBande: true }), participant(M.malo, { habitue: true }), participant(M.zoe, { habitue: true }), participant(M.sam)],
    },
    {
      ...base,
      id: "miamis-jeux",
      titre: "Soirée jeux de société",
      description: "Des jeux, des tartes salées et zéro pression. Débutantes bienvenues, on explique les règles en riant.",
      quand: prochainJour(maintenant, 5, 20),
      lieu: LIEUX.comptoir,
      organisateur: M.nina,
      sortiesTenuesOrganisateur: { tenues: 3, prevues: 3 },
      rescoussesOrganisateur: 8,
      public: { type: "genre", genre: "femme" },
      etiquettes: officielles("Jeux de société", "Calme", "Sans alcool"),
      places: 6,
      participants: [participant(M.nina), participant(M.rose, { nouveau: true }), participant(M.zoe), participant(M.mila)],
    },
    {
      ...base,
      id: "miamis-moules-frites",
      titre: "Moules-frites entre gars",
      description: "Une marmite, des frites, et le match de pétanque après si la météo suit.",
      quand: prochainJour(maintenant, 5, 19, 30),
      lieu: LIEUX.capitaine,
      organisateur: M.yanis,
      sortiesTenuesOrganisateur: { tenues: 2, prevues: 3 },
      rescoussesOrganisateur: 4,
      public: { type: "genre", genre: "homme" },
      etiquettes: officielles("Petit budget", "Poisson et fruits de mer", "Festif"),
      places: 6,
      participants: [participant(M.yanis), participant(M.theo), participant(M.jo)],
    },
    {
      ...base,
      id: "miamis-pates",
      titre: "Pâtes fraîches et papotage",
      description: "On roule des tagliatelles ensemble, on les mange tout de suite. Ambiance douce garantie.",
      quand: prochainJour(maintenant, 5, 19),
      lieu: LIEUX.cantine,
      organisateur: M.alex,
      sortiesTenuesOrganisateur: { tenues: 5, prevues: 5 },
      rescoussesOrganisateur: 9,
      public: { type: "genre", genre: "autre" },
      etiquettes: officielles("Fait maison", "LGBT+ friendly", "Calme"),
      places: 6,
      participants: [participant(M.alex), participant(M.noe)],
    },
    {
      ...base,
      id: "miamis-crepes",
      titre: "Tournée des crêpes",
      description: "Trois galettes, deux crêpes, un seul objectif : rouler jusqu'à la maison.",
      quand: prochainJour(maintenant, 4, 19, 30),
      lieu: LIEUX.cantine,
      organisateur: M.malo,
      sortiesTenuesOrganisateur: { tenues: 7, prevues: 8 },
      rescoussesOrganisateur: 21,
      etiquettes: officielles("Petit budget", "Sucré", "Festif"),
      places: 6,
      participants: [participant(M.malo), participant(M.lou), participant(M.noe)],
    },
    {
      ...base,
      id: "miamis-pique-nique",
      titre: "Pique-nique des Miamis",
      description: "Chacun apporte un plat maison, la Cantine nous prête la terrasse. Les toutous sont les bienvenus.",
      quand: prochainJour(maintenant, 6, 12),
      lieu: LIEUX.comptoir,
      organisateur: M.zoe,
      sortiesTenuesOrganisateur: { tenues: 9, prevues: 9 },
      rescoussesOrganisateur: 30,
      etiquettes: officielles("Vegan", "Fait maison", "Animaux bienvenus"),
      places: 6,
      participants: [participant(M.zoe), participant(M.nina), participant(M.lou), participant(M.mila), participant(M.alex), participant(M.rose, { nouveau: true })],
      nombreEnAttente: 2,
    },
    {
      ...base,
      id: "miamis-ramen",
      titre: "Ramen et bonne humeur",
      description: "Un bol fumant, des baguettes, et des histoires de voyage. Timides bienvenus, je fais les présentations.",
      quand: prochainJour(maintenant, 6, 19, 30),
      lieu: LIEUX.cantine,
      organisateur: moi,
      etiquettes: [...officielles("Épicé", "Timides bienvenus"), libre("Fans de ramen")],
      places: 4,
      participants: [participant(moi), participant(M.jo)],
      demandes: [
        { personne: M.rose, date: ilYa(maintenant, 2), nouveau: true, sortiesTenues: { tenues: 0, prevues: 0 } },
        { personne: M.theo, date: ilYa(maintenant, 5), nouveau: false, sortiesTenues: { tenues: 5, prevues: 5 } },
      ],
      conversationId: "miamis-ramen",
      moi: { place: "organisateur", rangAttente: null, present: false },
    },
  ];
}
