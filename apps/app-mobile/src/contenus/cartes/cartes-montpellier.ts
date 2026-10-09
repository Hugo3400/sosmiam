import type { CarteLieu } from "@sos-miam/commun/types/carte";

/** Cartes des lieux d'exemple de Montpellier (identifiants 0 à 8, et 18 : le Restaurant du Capitaine Bouiboui, lieu de la démo pro). */
export const cartesMontpellier: Partial<Record<number, CarteLieu>> = {
  18: {
    sections: [
      {
        titre: "Pour commencer",
        elements: [
          { nom: "Petite tielle du mousse", description: "Poulpe, tomate et pâte dorée, comme à Sète", prix: 6, etiquettes: ["fait-maison", "local"] },
          { nom: "Accras de la Brigade", description: "Morue, piment doux et citron vert", prix: 7, etiquettes: ["epice", "fait-maison"] },
        ],
      },
      {
        titre: "Les plats du Capitaine",
        elements: [
          { nom: "Moules du Capitaine", description: "Moules de Bouzigues, crème à l'ail des ours, frites maison", prix: 14, signature: true, etiquettes: ["fait-maison", "local"] },
          { nom: "Pêche du jour", description: "Selon l'arrivage du matin, avec les légumes du marché", prix: 18, etiquettes: ["local"] },
          { nom: "Risotto de la vigie", description: "Champignons, parmesan et huile d'olive du coin", prix: 15, etiquettes: ["vege"] },
        ],
      },
      {
        titre: "Desserts",
        elements: [
          { nom: "Île flottante du Capitaine", description: "Crème anglaise à la vanille, caramel au beurre salé", prix: 6.5, signature: true, etiquettes: ["vege", "fait-maison"] },
          { nom: "Mousse au chocolat", description: "À partager… ou pas", prix: 6, etiquettes: ["vege", "sans-gluten"] },
        ],
      },
      {
        titre: "À boire",
        elements: [
          { nom: "Limonade maison", description: "Citron, menthe et une pointe de gingembre", prix: 4, unite: "le verre", etiquettes: ["vegan", "fait-maison"] },
          { nom: "Sirop à l'eau du mousse", description: "Fraise, menthe, grenadine ou citron", prix: 2.5, unite: "le verre", etiquettes: ["vegan"] },
          { nom: "Picpoul de Pinet", prix: 5, unite: "le verre", alcool: true, etiquettes: ["local"] },
          { nom: "Bière blonde du port", description: "Brassée à Montpellier", prix: 6, unite: "la pinte", alcool: true, etiquettes: ["local"] },
        ],
      },
    ],
    majLe: "2026-10-02",
  },
  0: {
    sections: [
      {
        titre: "Les pâtes fraîches",
        elements: [
          { nom: "Cacio e pepe", description: "Tonnarelli, pecorino romano et poivre noir concassé", prix: 12, signature: true, etiquettes: ["vege", "fait-maison"] },
          { nom: "Lasagnes de Nonna", description: "Ragù mijoté 6 heures, béchamel, parmesan", prix: 14, etiquettes: ["fait-maison"] },
        ],
      },
      { titre: "Pour commencer", elements: [{ nom: "Burrata", description: "Tomates du marché, basilic, huile d'olive", prix: 9, etiquettes: ["vege"] }] },
      { titre: "Desserts", elements: [{ nom: "Tiramisu", description: "Mascarpone, café serré, cacao", prix: 6, etiquettes: ["vege", "fait-maison"] }] },
      { titre: "À boire", elements: [{ nom: "Spritz maison", prix: 7, unite: "le verre", alcool: true }] },
    ],
  },
  1: {
    sections: [
      {
        titre: "Les douceurs de Clémence",
        elements: [
          { nom: "Grisettes de Montpellier", description: "Miel de garrigue et réglisse, cuites au chaudron en cuivre", prix: 4.5, unite: "le sachet", signature: true, etiquettes: ["vege", "fait-maison", "local"] },
          { nom: "Nougat au miel de garrigue", description: "Tendre, aux amandes et au miel du coin", prix: 3.5, unite: "la barre", etiquettes: ["vege", "fait-maison", "local"] },
          { nom: "Pâtes de fruits à la figue", description: "Figues de pays et zeste d'orange", prix: 3.9, unite: "la barquette de 6", etiquettes: ["vegan", "sans-gluten", "fait-maison"] },
          { nom: "Caramels à la fleur de sel", description: "Beurre salé et fleur de sel de Camargue", prix: 3.5, unite: "le sachet", etiquettes: ["vege", "fait-maison"] },
          { nom: "Croquants aux amandes", description: "Fins et croustillants, à tremper dans ton café", prix: 3.9, unite: "le sachet", etiquettes: ["vege", "fait-maison"] },
        ],
      },
      {
        titre: "À offrir (ou à garder pour toi)",
        elements: [
          { nom: "Boîte de grisettes en fer", description: "La recette de la grand-mère, dans une jolie boîte", prix: 9.9, unite: "la boîte de 200 g", etiquettes: ["vege", "fait-maison", "local"] },
          { nom: "Coffret de Clémence", description: "Grisettes, nougat, caramels et pâtes de fruits", prix: 12.9, unite: "le coffret", signature: true, etiquettes: ["vege", "fait-maison"] },
        ],
      },
      {
        titre: "Boissons chaudes",
        elements: [
          { nom: "Chocolat chaud à la réglisse", description: "Chocolat noir fondu et une pointe de réglisse", prix: 3.5, etiquettes: ["vege"] },
          { nom: "Infusion de garrigue", description: "Thym, romarin et verveine du coin", prix: 2.5, etiquettes: ["vegan", "local"] },
          { nom: "Café serré", description: "Pour accompagner une grisette (ou trois)", prix: 2, etiquettes: ["vegan"] },
        ],
      },
    ],
  },
  2: {
    sections: [
      {
        titre: "Cocktails maison",
        elements: [
          { nom: "Spritz au Picpoul", description: "Picpoul de Pinet, amer à l'orange et bulles", prix: 8, unite: "le verre", signature: true, alcool: true, etiquettes: ["local"] },
          { nom: "La Figue Pressée", description: "Gin, figue rôtie, citron et sirop de thym", prix: 8, unite: "le verre", signature: true, alcool: true, etiquettes: ["fait-maison"] },
          { nom: "Garrigue Mule", description: "Vodka, ginger beer, citron vert et romarin", prix: 8, unite: "le verre", alcool: true },
          { nom: "Le cocktail mystère", description: "Donne ton humeur, le barman improvise", prix: 8, unite: "le verre", alcool: true },
        ],
      },
      {
        titre: "Bières et vins",
        elements: [
          { nom: "Blonde de l'Hérault", description: "Brassée à quelques kilomètres, servie bien fraîche", prix: 7, unite: "la pinte", alcool: true, etiquettes: ["local"] },
          { nom: "Rouge du Pic Saint-Loup", description: "Fruits rouges et garrigue", prix: 5.5, unite: "le verre", alcool: true, etiquettes: ["local"] },
        ],
      },
      {
        titre: "Sans alcool (et pas sans goût)",
        elements: [
          { nom: "Virgin Figue", description: "Figue rôtie, citron, tonic et thym", prix: 6, unite: "le verre", etiquettes: ["vegan", "fait-maison"] },
          { nom: "Citronnade maison", description: "Citrons pressés minute et feuilles de menthe", prix: 4, unite: "le verre", etiquettes: ["vegan", "fait-maison"] },
        ],
      },
      {
        titre: "À grignoter",
        elements: [
          { nom: "Olives de Lucques", description: "Les vertes croquantes de l'Hérault", prix: 4.5, etiquettes: ["vegan", "sans-gluten", "local"] },
          { nom: "Houmous maison", description: "Pois chiches, tahini, citron et pain pita grillé", prix: 5.5, etiquettes: ["vegan", "fait-maison"] },
          { nom: "Planche du quiz", description: "Charcuterie, fromages et pain : de quoi tenir 4 manches", prix: 13, unite: "pour 2 ou 3" },
        ],
      },
    ],
  },
  3: {
    sections: [
      {
        titre: "Les baos",
        elements: [
          { nom: "Bao porc braisé", description: "Poitrine braisée au soja, cacahuètes et coriandre", prix: 6, signature: true, etiquettes: ["fait-maison"] },
          { nom: "Bao poulet croustillant", description: "Poulet frit, mayo pimentée et pickles maison", prix: 6, etiquettes: ["epice", "fait-maison"] },
          { nom: "Bao tofu shiitaké", description: "Tofu laqué, champignons sautés et oignon frit", prix: 5.5, etiquettes: ["vege", "fait-maison"] },
        ],
      },
      {
        titre: "À picorer",
        elements: [
          { nom: "Poulet pop-corn", description: "Comme aux marchés de nuit de Taipei, sel au poivre", prix: 6.5, etiquettes: ["epice"] },
          { nom: "Concombre pimenté", description: "Ail, vinaigre noir et huile de piment", prix: 3.5, etiquettes: ["vegan", "epice"] },
        ],
      },
      {
        titre: "Douceurs",
        elements: [
          { nom: "Gâteau à l'ananas", description: "Petit sablé fondant, la recette de leur grand-mère", prix: 3, etiquettes: ["vege", "fait-maison"] },
          { nom: "Mantou frit au lait concentré", description: "Petit pain vapeur doré, nappé de lait concentré", prix: 3.5, etiquettes: ["vege"] },
        ],
      },
      {
        titre: "À boire",
        elements: [
          { nom: "Thé au lait maison", description: "Thé noir infusé minute, perles au sucre brun", prix: 4.5, signature: true, etiquettes: ["vege", "fait-maison"] },
          { nom: "Thé glacé au jasmin", description: "Peu sucré, très frais", prix: 3.5, etiquettes: ["vegan"] },
          { nom: "Bière de Taïwan", description: "Blonde légère, parfaite avec les baos", prix: 4.5, unite: "la bouteille", alcool: true },
        ],
      },
    ],
  },
  4: {
    sections: [
      {
        titre: "Les choux garnis minute",
        elements: [
          { nom: "Chou praliné", description: "Crème praliné noisette et éclats caramélisés", prix: 3, signature: true, etiquettes: ["vege", "fait-maison"] },
          { nom: "Chou de la semaine", description: "Cette semaine : figue rôtie et miel de garrigue", prix: 3.5, signature: true, etiquettes: ["vege", "fait-maison", "local"] },
          { nom: "Chou vanille", description: "Crème pâtissière à la vanille, garnie devant toi", prix: 2.5, etiquettes: ["vege", "fait-maison"] },
          { nom: "Chou chocolat", description: "Crème au chocolat noir et grué de cacao", prix: 3, etiquettes: ["vege", "fait-maison"] },
          { nom: "Chou sans gluten", description: "Pâte à la farine de riz, parfum au choix", prix: 3.5, etiquettes: ["vege", "sans-gluten", "fait-maison"] },
        ],
      },
      {
        titre: "À emporter",
        elements: [
          { nom: "Boîte de 6 choux", description: "Six parfums au choix, garnis au dernier moment", prix: 16, unite: "la boîte", etiquettes: ["vege", "fait-maison"] },
          { nom: "Chouquettes", description: "Sucre perlé, légères comme tout", prix: 3.5, unite: "le sachet de 10", etiquettes: ["vege", "fait-maison"] },
        ],
      },
      {
        titre: "Boissons chaudes",
        elements: [
          { nom: "Espresso", description: "Pour faire passer le troisième chou", prix: 2, etiquettes: ["vegan"] },
          { nom: "Chocolat chaud", description: "Lait entier et chocolat noir fondu", prix: 3.5, etiquettes: ["vege"] },
          { nom: "Thé ou infusion", description: "Thé vert, earl grey ou verveine", prix: 3, etiquettes: ["vegan"] },
        ],
      },
    ],
  },
  5: {
    sections: [
      {
        titre: "Les blancs",
        elements: [
          { nom: "Verre de Picpoul de Pinet", description: "Vif et iodé, il a grandi au bord de l'étang de Thau", prix: 5, signature: true, alcool: true, etiquettes: ["local"] },
          { nom: "Vin orange du Languedoc", description: "Macéré sur peaux, notes d'abricot sec", prix: 7, unite: "le verre", alcool: true, etiquettes: ["local"] },
        ],
      },
      {
        titre: "Les rouges",
        elements: [
          { nom: "Pic Saint-Loup nature", description: "Fruits noirs et garrigue, léger et gourmand", prix: 6.5, unite: "le verre", alcool: true, etiquettes: ["local"] },
          { nom: "Terrasses du Larzac", description: "Plus charpenté, pour les amateurs de rouge", prix: 8, unite: "le verre", alcool: true, etiquettes: ["local"] },
          { nom: "Bouteille du moment", description: "Mimi te raconte son vigneron, elle change chaque semaine", prix: 32, unite: "la bouteille", alcool: true, etiquettes: ["local"] },
        ],
      },
      {
        titre: "Sans alcool",
        elements: [
          { nom: "Jus de raisin du vigneron", description: "Pressé chez un vigneron du coin", prix: 4, unite: "le verre", etiquettes: ["local"] },
          { nom: "Limonade maison", description: "Citron pressé et une pointe de romarin", prix: 4, unite: "le verre", etiquettes: ["vegan", "fait-maison"] },
        ],
      },
      {
        titre: "Planches à partager",
        elements: [
          { nom: "Planche de pélardon", description: "Pélardons affinés, miel de garrigue et figues", prix: 14, unite: "pour 2 ou 3", signature: true, etiquettes: ["vege", "local"] },
          { nom: "Planche mixte", description: "Charcuterie des Cévennes, pélardon et olives", prix: 18, unite: "pour 2 ou 3", etiquettes: ["local"] },
          { nom: "Brandade de Nîmes", description: "Morue, huile d'olive et ail, avec du pain grillé", prix: 8, etiquettes: ["fait-maison", "local"] },
          { nom: "Olives de Lucques", description: "Vertes et croquantes, cueillies dans l'Hérault", prix: 4.5, etiquettes: ["vegan", "sans-gluten", "local"] },
        ],
      },
    ],
  },
  6: {
    sections: [
      {
        titre: "Sur le Lez",
        elements: [
          { nom: "Balade d'1 h en kayak", description: "Solo ou en duo, entre hérons et immeubles de Port Marianne", prix: 15, unite: "par personne", signature: true },
          { nom: "Balade au coucher du soleil", description: "1 h 30 sur l'eau pendant que le Lez vire à l'orange", prix: 19, unite: "par personne", signature: true },
          { nom: "Descente jusqu'à Lattes", description: "3 h aller-retour, pause pique-nique au bord de l'eau", prix: 28, unite: "par personne" },
        ],
      },
      {
        titre: "En famille ou en bande",
        elements: [
          { nom: "Pass famille", description: "2 adultes et 2 enfants, gilets à toutes les tailles", prix: 45, unite: "la balade d'1 h" },
          { nom: "Enfant de 6 à 12 ans", description: "Dans un kayak duo, avec un adulte qui pagaie aussi", prix: 9, unite: "par enfant" },
          { nom: "Sortie de groupe", description: "Dès 8 pagayeurs, Bastien vous guide sur le Lez", prix: 13, unite: "par personne" },
          { nom: "Carte 5 balades", description: "Pour revenir saluer les hérons quand tu veux", prix: 65, unite: "la carte" },
        ],
      },
      {
        titre: "Au ponton",
        elements: [
          { nom: "Citronnade maison", description: "Citron pressé et menthe fraîche, plein de glaçons", prix: 3, unite: "le verre", etiquettes: ["vegan", "fait-maison"] },
          { nom: "Cookie de Bastien", description: "Chocolat noir et noisettes, pour reprendre des forces", prix: 2.5, etiquettes: ["vege", "fait-maison"] },
          { nom: "Bière artisanale", description: "Brassée dans l'Hérault, à boire une fois à terre", prix: 4.5, unite: "la bouteille de 33 cl", alcool: true, etiquettes: ["local"] },
        ],
      },
    ],
  },
  7: {
    sections: [
      {
        titre: "Les parties",
        elements: [
          { nom: "Partie de 60 min", description: "Retrouve le trésor de l'apothicaire, de 2 à 6 joueurs", prix: 22, unite: "par joueur", signature: true },
          { nom: "Partie en duo", description: "Rien que vous deux face aux fioles et aux grimoires", prix: 28, unite: "par joueur" },
          { nom: "Partie junior", description: "Énigmes adaptées dès 8 ans, avec un adulte dans l'équipe", prix: 16, unite: "par joueur" },
        ],
      },
      {
        titre: "Formules",
        elements: [
          { nom: "Anniversaire d'apprentis", description: "Partie, goûter maison et diplôme d'apprenti apothicaire", prix: 25, unite: "par enfant" },
          { nom: "Défi entre collègues", description: "Partie, débrief chronométré et planche à partager", prix: 30, unite: "par personne" },
          { nom: "Carte cadeau duo", description: "Valable un an, glissée dans une petite fiole", prix: 44, unite: "pour 2 joueurs" },
        ],
      },
      {
        titre: "Après l'énigme",
        elements: [
          { nom: "Limonade de l'apothicaire", description: "Citron, romarin et une pointe de mystère", prix: 3.5, unite: "le verre", signature: true, etiquettes: ["vegan", "fait-maison"] },
          { nom: "Bière de Montpellier", description: "Blonde artisanale, pour fêter le trésor retrouvé", prix: 4.5, unite: "la bouteille de 33 cl", alcool: true, etiquettes: ["local"] },
          { nom: "Planche à débriefer", description: "Olives, chips, pélardon et pain de campagne", prix: 9, etiquettes: ["vege", "local"] },
          { nom: "Café ou thé", prix: 1.5 },
        ],
      },
    ],
  },
  8: {
    sections: [
      {
        titre: "Les ateliers",
        elements: [
          { nom: "Atelier tournage 2 h", description: "Au tour, et ton bol cuit t'attend la semaine d'après", prix: 35, unite: "par personne", signature: true },
          { nom: "Atelier modelage 2 h", description: "À la main, sans tour : tasse, vase ou petit monstre", prix: 30, unite: "par personne" },
          { nom: "Tournage à deux", description: "Côte à côte au tour, chacun repart avec son bol", prix: 65, unite: "pour 2 personnes" },
          { nom: "Atelier parent-enfant", description: "Modelage dès 6 ans, le samedi à 10 h", prix: 48, unite: "pour 1 adulte et 1 enfant" },
        ],
      },
      {
        titre: "Pour aller plus loin",
        elements: [
          { nom: "Stage de 4 mercredis", description: "Quatre soirées pour vraiment apprivoiser le tour", prix: 125, unite: "par personne" },
          { nom: "Pièce en plus", description: "Cuisson et émail d'une création supplémentaire", prix: 8, unite: "par pièce" },
          { nom: "Carte cadeau atelier", description: "Un atelier tournage à offrir, valable un an", prix: 35 },
        ],
      },
      {
        titre: "La pause de l'atelier",
        elements: [
          { nom: "Thé ou tisane", description: "Servi dans un bol tourné ici, évidemment", prix: 2.5, etiquettes: ["vegan"] },
          { nom: "Jus de raisin du Languedoc", description: "Pur jus, pressé chez un vigneron du coin", prix: 3, unite: "le verre", etiquettes: ["vegan", "local"] },
          { nom: "Verre de Pic Saint-Loup", description: "Un rouge du coin pour l'atelier du mercredi soir", prix: 5, unite: "le verre", alcool: true, etiquettes: ["local"] },
          { nom: "Gâteau du jour", description: "Une part de ce qui sort du four ce jour-là", prix: 3.5, unite: "la part", etiquettes: ["vege", "fait-maison"] },
        ],
      },
    ],
  },
};
