import type { SectionLegale } from "~/contenus/legal/type-legal";

export const sectionCarteDesLieux: SectionLegale = {
  id: "carte-des-lieux",
  titre: "La carte des lieux",
  blocs: [
    "Sur la page [Les lieux](/lieux), une carte montre où se cachent les restos, les pâtisseries, les bars et les sorties. Son fond de carte (les rues, les parcs, les noms des quartiers) vient d'**OpenFreeMap**, un service gratuit qui le dessine à partir des données d'**OpenStreetMap**, la carte du monde tenue par ses contributeurs.",
    {
      liste: [
        "**Toujours par notre serveur** : ton navigateur ne contacte jamais OpenFreeMap. Il demande les morceaux de carte (avec les polices et les petits dessins qui vont avec) à notre propre serveur, à l'adresse sosmiam.fr/fond-de-carte/, qui va les chercher chez OpenFreeMap et les garde un moment en réserve. OpenFreeMap ne voit donc ni ton adresse IP, ni ton navigateur, ni la zone que tu regardes : seulement notre serveur, qui lui demande des morceaux de carte.",
        "**Pourquoi** : que tu puisses te balader sur la carte sans qu'une entreprise de plus voie passer ta visite. Les épingles des lieux viennent, elles aussi, de notre serveur.",
        "**Ta position n'est jamais envoyée** : la carte ne la demande pas d'elle-même. « Près de moi » marche comme le bouton 📍 du formulaire « Préviens-moi » (voir « [Le formulaire « Préviens-moi »](#formulaire) ») : seulement si tu le touches, et après l'accord demandé par ton navigateur, ta position, arrondie à environ 100 mètres, sert à notre serveur pour trouver ta commune auprès de geo.api.gouv.fr, puis la ville la plus proche qui a des lieux. Rien n'est gardé. « Chercher dans cette zone » fait pareil avec le centre de la carte, jamais avec ta position.",
        "**« Me situer »**, sur la carte en grand : ta position reste dans ton navigateur, qui l'arrondit à environ un kilomètre avant de centrer la carte sur ta zone. Seuls les morceaux de carte de cette zone sont alors demandés à notre serveur, comme pour n'importe quelle zone que tu regardes.",
        "**Rien d'autre** : pas de cookie, et aucun service de cartographie extérieur n'est appelé par la carte. Seul le lien « Itinéraire », si tu le touches, t'emmène sur Google Maps, qui applique alors ses propres règles. Comme toute page, ces demandes passent par Cloudflare et suivent les règles des journaux du serveur (voir « [Les journaux du serveur](#journaux) »).",
      ],
    },
  ],
};
