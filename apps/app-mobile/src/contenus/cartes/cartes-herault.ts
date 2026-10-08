import type { CarteLieu } from "@sos-miam/commun/types/carte";

/** Cartes des lieux d'exemple du reste de l'Hérault (identifiants 9 à 17). */
export const cartesHerault: Partial<Record<number, CarteLieu>> = {
  9: {
    sections: [
      {
        titre: "Les tielles",
        elements: [
          { nom: "Tielle sétoise", description: "Pâte dorée, poulpe à la tomate bien relevé", prix: 4, unite: "la part", signature: true, etiquettes: ["epice", "fait-maison", "local"] },
          { nom: "Tielle entière", description: "Six parts pour la tablée, ou pour toi : on ne juge pas", prix: 22, unite: "la tielle de 6 parts", etiquettes: ["epice", "fait-maison", "local"] },
          { nom: "Tielle du potager", description: "Poivrons, aubergine et tomate, même pâte dorée", prix: 4, unite: "la part", etiquettes: ["vege", "fait-maison"] },
        ],
      },
      {
        titre: "Les assiettes de Pépita",
        elements: [
          { nom: "Rouille de seiche", description: "Seiche mijotée, rouille à l'ail et pommes de terre", prix: 12, signature: true, etiquettes: ["fait-maison", "local"] },
          { nom: "Macaronade sétoise", description: "Pâtes et brageoles mijotées dans la sauce tomate", prix: 11, etiquettes: ["fait-maison"] },
          { nom: "Moules farcies", description: "Moules de l'étang de Thau, farcies et mijotées à la tomate", prix: 10, etiquettes: ["fait-maison", "local"] },
        ],
      },
      {
        titre: "Dessert",
        elements: [
          { nom: "Crème catalane", description: "Citron, cannelle et caramel brûlé à la minute", prix: 4.5, etiquettes: ["vege", "fait-maison"] },
        ],
      },
      {
        titre: "À boire",
        elements: [
          { nom: "Picpoul de Pinet", description: "Blanc vif de l'étang de Thau, fait pour la tielle", prix: 3.5, unite: "le verre", alcool: true, etiquettes: ["local"] },
          { nom: "Bière pression", description: "Blonde bien fraîche", prix: 3.5, unite: "le demi", alcool: true },
          { nom: "Citronnade maison", description: "Citron pressé, un peu de sucre, beaucoup de glaçons", prix: 2.5, unite: "le verre", etiquettes: ["vegan", "fait-maison"] },
        ],
      },
    ],
  },
  10: {
    sections: [
      {
        titre: "Les zézettes",
        elements: [
          { nom: "Sachet de zézettes", description: "Croquantes, au vin blanc et à l'huile d'olive", prix: 5, unite: "le sachet de 250 g", signature: true, etiquettes: ["vegan", "fait-maison", "local"] },
          { nom: "Zézettes au citron", description: "La recette de Ginette, avec un zeste en plus", prix: 5.5, unite: "le sachet de 250 g", etiquettes: ["vegan", "fait-maison"] },
        ],
      },
      {
        titre: "Les autres biscuits",
        elements: [
          { nom: "Croquants aux amandes", description: "Amandes entières, à tremper dans le café", prix: 4.5, unite: "le sachet", etiquettes: ["vege", "fait-maison"] },
          { nom: "Sablés au muscat de Frontignan", description: "Fondants, parfumés au muscat du village voisin", prix: 5, unite: "le sachet", etiquettes: ["vege", "fait-maison", "local"] },
        ],
      },
      {
        titre: "Pour offrir",
        elements: [
          { nom: "Boîte en fer de zézettes", description: "500 g dans une boîte aux couleurs du canal", prix: 12, etiquettes: ["vegan", "fait-maison", "local"] },
          { nom: "Coffret du canal", description: "Zézettes, croquants et sablés au muscat", prix: 16, etiquettes: ["vege", "fait-maison"] },
        ],
      },
      {
        titre: "Boissons chaudes",
        elements: [
          { nom: "Café et ses zézettes", description: "Un café, et trois zézettes pour tremper dedans", prix: 2.5 },
          { nom: "Chocolat chaud", description: "Au lait entier, épais comme il faut", prix: 3, etiquettes: ["vege"] },
          { nom: "Thé ou infusion", prix: 2.5, etiquettes: ["vegan"] },
        ],
      },
    ],
  },
  11: {
    sections: [
      {
        titre: "Les petits pâtés",
        elements: [
          { nom: "Petit pâté de Pézenas", description: "Mouton, cassonade et zeste de citron, en bobine", prix: 2.8, unite: "la pièce", signature: true, etiquettes: ["fait-maison", "local"] },
          { nom: "Petit pâté du potager", description: "Légumes confits, cassonade et citron, même bobine", prix: 2.8, unite: "la pièce", etiquettes: ["vege", "fait-maison"] },
        ],
      },
      {
        titre: "À emporter",
        elements: [
          { nom: "Demi-douzaine", description: "Six petits pâtés, 10 min au four et c'est servi", prix: 15.5, unite: "les 6", etiquettes: ["fait-maison", "local"] },
          { nom: "Boîte de 12", description: "Pour la grande tablée du dimanche midi", prix: 30, unite: "les 12", etiquettes: ["fait-maison", "local"] },
        ],
      },
      {
        titre: "Douceurs",
        elements: [
          { nom: "Berlingots de Pézenas", description: "Bonbons rayés à l'anis, à la menthe ou au citron", prix: 4.5, unite: "le sachet", etiquettes: ["local"] },
          { nom: "Tarte du jour", description: "Fruits de saison sur pâte sablée maison", prix: 3.5, unite: "la part", etiquettes: ["vege", "fait-maison"] },
        ],
      },
      {
        titre: "À boire",
        elements: [
          { nom: "Café", prix: 1.5 },
          { nom: "Jus de raisin du Languedoc", description: "Pur jus, pressé chez un vigneron voisin", prix: 2.5, unite: "le verre", etiquettes: ["vegan", "local"] },
          { nom: "Verre de Languedoc-Pézenas", description: "Un rouge du cru, pour accompagner le pâté chaud", prix: 3.5, unite: "le verre", alcool: true, etiquettes: ["local"] },
        ],
      },
    ],
  },
  12: {
    sections: [
      {
        titre: "Balades guidées",
        elements: [
          { nom: "Balade guidée 1 h 30", description: "Au milieu des flamants, initiation et combi comprises", prix: 20, unite: "par personne", signature: true },
          { nom: "Balade au coucher du soleil", description: "L'étang devient rose, les flamants aussi", prix: 25, unite: "par personne", signature: true },
          { nom: "Balade des p'tits mousses", description: "Pour les 8-12 ans, rythme tranquille, gilet fourni", prix: 14, unite: "par enfant, 1 h" },
        ],
      },
      {
        titre: "Location libre",
        elements: [
          { nom: "Paddle 1 h", description: "Pour celles et ceux qui tiennent déjà debout", prix: 15, unite: "la planche" },
          { nom: "Paddle 2 h", description: "De quoi pousser jusqu'au bout de l'étang", prix: 25, unite: "la planche" },
          { nom: "Paddle géant", description: "Jusqu'à 8 sur la même planche, fous rires compris", prix: 80, unite: "la planche, 1 h" },
        ],
      },
      {
        titre: "Formules",
        elements: [
          { nom: "Duo coucher de soleil", description: "2 balades au coucher du soleil + 2 citronnades", prix: 52, unite: "pour deux" },
          { nom: "Pack famille", description: "2 adultes + 2 enfants, balade guidée de 1 h 30", prix: 60, unite: "pour quatre" },
        ],
      },
      {
        titre: "Au retour sur le ponton",
        elements: [
          { nom: "Citronnade maison", description: "Citron pressé, menthe fraîche, juste ce qu'il faut de sucre", prix: 3.5, etiquettes: ["vegan", "fait-maison"] },
          { nom: "Chocolat chaud", description: "Pour les orteils qui ont un peu trempé", prix: 3, etiquettes: ["vege"] },
          { nom: "Part de fougasse d'Aigues-Mortes", description: "Brioche au sucre et à la fleur d'oranger", prix: 3, etiquettes: ["vege", "fait-maison"] },
          { nom: "Café", prix: 2 },
        ],
      },
    ],
  },
  13: {
    sections: [
      {
        titre: "Les huîtres d'Émile",
        elements: [
          { nom: "6 huîtres + verre de Picpoul", description: "Huîtres de Bouzigues et Picpoul de Pinet bien frais", prix: 14, signature: true, alcool: true, etiquettes: ["local"] },
          { nom: "6 huîtres de Bouzigues", description: "Sorties de l'étang le matin même, citron, échalote", prix: 10, etiquettes: ["local"] },
          { nom: "La douzaine", description: "Pour les vrais amateurs, ou pour partager", prix: 18, etiquettes: ["local"] },
        ],
      },
      {
        titre: "De l'étang à la table",
        elements: [
          { nom: "Moules en brasucade", description: "Grillées au feu de sarments, ail, persil, huile d'olive", prix: 14, signature: true, etiquettes: ["local"] },
          { nom: "Tielle sétoise", description: "La tourte de Sète au poulpe, sauce tomate relevée", prix: 6, etiquettes: ["local", "fait-maison", "epice"] },
          { nom: "Bulots mayonnaise", description: "Mayonnaise montée à la main, pain grillé", prix: 9, etiquettes: ["fait-maison"] },
        ],
      },
      {
        titre: "Pour finir",
        elements: [
          { nom: "Crème catalane", description: "Cannelle, citron et sucre caramélisé à la minute", prix: 5.5, etiquettes: ["vege", "fait-maison"] },
          { nom: "Fromage blanc au miel de garrigue", description: "Tout simple, tout frais, parfait après l'iode", prix: 5, etiquettes: ["vege", "local"] },
        ],
      },
      {
        titre: "À boire",
        elements: [
          { nom: "Picpoul de Pinet", description: "Le blanc vif et salin qui pousse au bord de l'étang", prix: 5, unite: "le verre", alcool: true, etiquettes: ["local"] },
          { nom: "Bouteille de Picpoul de Pinet", description: "Pour la table entière, les pieds presque dans l'eau", prix: 22, unite: "la bouteille", alcool: true, etiquettes: ["local"] },
          { nom: "Limonade artisanale", description: "Bulles citronnées, ça marche aussi avec les huîtres", prix: 3.5, etiquettes: ["vegan"] },
          { nom: "Café", prix: 2 },
        ],
      },
    ],
  },
  14: {
    sections: [
      {
        titre: "Tapas",
        elements: [
          { nom: "Planche de tapas + verre de Faugères", description: "Chorizo, manchego, tortilla, pan con tomate et un rouge", prix: 14, signature: true, alcool: true },
          { nom: "Patatas bravas", description: "Sauce brava qui réveille et aïoli maison", prix: 6, etiquettes: ["vege", "epice", "fait-maison"] },
          { nom: "Pimientos de Padrón", description: "Poêlés au gros sel : un sur dix pique, bonne chance", prix: 6, etiquettes: ["vegan", "epice"] },
          { nom: "Croquetas de jamón", description: "Béchamel coulante et jambon serrano, 5 pièces", prix: 7, etiquettes: ["fait-maison"] },
          { nom: "Calamars à la plancha", description: "Ail, persil et un filet de citron", prix: 9 },
          { nom: "Tortilla de patatas", description: "Fondante au cœur, comme il se doit", prix: 5.5, etiquettes: ["vege", "fait-maison"] },
        ],
      },
      {
        titre: "Vins du coin",
        elements: [
          { nom: "Faugères rouge", description: "Schistes, garrigue et fruits noirs, à 30 km d'ici", prix: 5, unite: "le verre", alcool: true, etiquettes: ["local"] },
          { nom: "Saint-Chinian rosé", description: "Frais et fruité, pour les soirs de terrasse", prix: 4.5, unite: "le verre", alcool: true, etiquettes: ["local"] },
        ],
      },
      {
        titre: "Sangria & cañas",
        elements: [
          { nom: "Sangria de la Féria", description: "Vin rouge, agrumes, cannelle, préparée chaque soir", prix: 6, unite: "le verre", signature: true, alcool: true, etiquettes: ["fait-maison"] },
          { nom: "Pichet de sangria", description: "Pour toute la bande, entre deux palmas", prix: 22, unite: "le pichet (1 L)", alcool: true, etiquettes: ["fait-maison"] },
          { nom: "Caña", description: "La blonde pression, servie à l'espagnole", prix: 3.5, unite: "le demi", alcool: true },
        ],
      },
      {
        titre: "Sans alcool",
        elements: [
          { nom: "Sangria sans alcool", description: "Jus de raisin, agrumes, cannelle : même ambiance", prix: 4.5, unite: "le verre", etiquettes: ["vegan", "fait-maison"] },
          { nom: "Horchata", description: "Lait de souchet à la cannelle, servi bien frais", prix: 4, etiquettes: ["vegan"] },
        ],
      },
      {
        titre: "Pour finir",
        elements: [
          { nom: "Churros et chocolat", description: "Croustillants, avec un chocolat épais à tremper", prix: 6, etiquettes: ["vege", "fait-maison"] },
        ],
      },
    ],
  },
  15: {
    sections: [
      {
        titre: "Douceurs maison",
        elements: [
          { nom: "Assiette d'oreillettes", description: "Fines comme de la dentelle, parfum fleur d'oranger", prix: 4.5, signature: true, etiquettes: ["vege", "fait-maison"] },
          { nom: "Part de fougasse d'Aigues-Mortes", description: "Brioche au beurre, sucre et fleur d'oranger", prix: 3.5, etiquettes: ["vege", "fait-maison"] },
          { nom: "Tarte aux figues", description: "Figues rôties, crème d'amande, pâte sablée", prix: 4.5, etiquettes: ["vege", "fait-maison"] },
        ],
      },
      {
        titre: "À emporter",
        elements: [
          { nom: "Sachet d'oreillettes", description: "Pour le pique-nique au bord de l'Hérault", prix: 6, unite: "le sachet de 10", etiquettes: ["vege", "fait-maison"] },
          { nom: "Croquants aux amandes", description: "Ceux qui font crac, comme dans les villages d'ici", prix: 5, unite: "le sachet de 200 g", etiquettes: ["vege", "fait-maison"] },
          { nom: "Miel de garrigue", description: "Thym, romarin et lavande, récolté sur les causses", prix: 8, unite: "le pot de 250 g", etiquettes: ["vege", "local"] },
        ],
      },
      {
        titre: "Boissons chaudes",
        elements: [
          { nom: "Chocolat chaud", description: "Épais et doux, le compagnon officiel des oreillettes", prix: 3.5, signature: true, etiquettes: ["vege"] },
          { nom: "Infusion de la garrigue", description: "Verveine et thym, de quoi ralentir un peu", prix: 3, etiquettes: ["vegan", "local"] },
          { nom: "Café", prix: 2 },
        ],
      },
      {
        titre: "Au frais",
        elements: [
          { nom: "Citronnade maison", description: "Citron pressé et une pointe de fleur d'oranger", prix: 3.5, etiquettes: ["vegan", "fait-maison"] },
          { nom: "Sirop à l'eau", description: "Pour les petits marcheurs du Pont du Diable", prix: 2, etiquettes: ["vegan"] },
        ],
      },
    ],
  },
  16: {
    sections: [
      {
        titre: "L'ardoise du jour",
        elements: [
          { nom: "Menu du jour", description: "Entrée + plat ou plat + dessert, selon le marché", prix: 17, etiquettes: ["fait-maison"] },
        ],
      },
      {
        titre: "Entrées",
        elements: [
          { nom: "Pélardon rôti au miel", description: "Sur pain de campagne, salade et noix", prix: 9, signature: true, etiquettes: ["vege", "local"] },
          { nom: "Velouté de châtaignes", description: "Châtaignes des Cévennes, crème et noisettes", prix: 7, etiquettes: ["vege", "fait-maison", "local"] },
          { nom: "Terrine de campagne", description: "Au poivre, cornichons et oignons confits maison", prix: 8, etiquettes: ["fait-maison"] },
        ],
      },
      {
        titre: "Plats",
        elements: [
          { nom: "Épaule d'agneau du Larzac", description: "Confite 7 heures, purée à l'huile d'olive", prix: 19, signature: true, etiquettes: ["local", "fait-maison"] },
          { nom: "Truite rôtie", description: "Beurre noisette, amandes et légumes du marché", prix: 17, etiquettes: ["fait-maison"] },
          { nom: "Petit épeautre aux cèpes", description: "Crémeux comme un risotto, roquefort en copeaux", prix: 16, etiquettes: ["vege", "local", "fait-maison"] },
        ],
      },
      {
        titre: "Fromages et desserts",
        elements: [
          { nom: "Assiette du Larzac", description: "Roquefort, pélardon et tomme de brebis", prix: 8, etiquettes: ["vege", "local"] },
          { nom: "Crème brûlée à la verveine", description: "La verveine du jardin, le caramel qui craque", prix: 7, etiquettes: ["vege", "fait-maison"] },
        ],
      },
      {
        titre: "À boire",
        elements: [
          { nom: "Terrasses du Larzac rouge", description: "Grenache et syrah rafraîchis par les nuits du plateau", prix: 6, unite: "le verre", alcool: true, etiquettes: ["local"] },
          { nom: "Bouteille des Terrasses du Larzac", description: "Pour faire durer le repas", prix: 32, unite: "la bouteille", alcool: true, etiquettes: ["local"] },
          { nom: "Limonade au thym", description: "Citron, thym du causse, bulles fines", prix: 4, etiquettes: ["vegan", "fait-maison"] },
        ],
      },
    ],
  },
  17: {
    sections: [
      {
        titre: "Le muscat et ses copains",
        elements: [
          { nom: "Verre de muscat de Lunel", description: "Doux et floral, servi bien frais", prix: 4, signature: true, alcool: true, etiquettes: ["local"] },
          { nom: "Bouteille de muscat de Lunel", description: "Pour toute la tablée, les copains approuvent", prix: 20, unite: "la bouteille", alcool: true, etiquettes: ["local"] },
          { nom: "Pic Saint-Loup rouge", description: "Le rouge du coin, garrigue et fruits mûrs", prix: 4.5, unite: "le verre", alcool: true, etiquettes: ["local"] },
        ],
      },
      {
        titre: "Pression et cocktails",
        elements: [
          { nom: "Muscat tonic", description: "Muscat de Lunel, tonic et zeste de citron vert", prix: 6, signature: true, alcool: true, etiquettes: ["local"] },
          { nom: "Bière blonde pression", prix: 3, unite: "le demi", alcool: true },
        ],
      },
      {
        titre: "Sans alcool",
        elements: [
          { nom: "Jus de raisin muscat", description: "Le muscat, version enfants et conducteurs", prix: 3, etiquettes: ["vegan", "local"] },
          { nom: "Limonade artisanale", description: "Bien fraîche, pour les soirs de bouvine", prix: 3, etiquettes: ["vegan"] },
        ],
      },
      {
        titre: "Tapas de la Petite Camargue",
        elements: [
          { nom: "Toasts de gardiane", description: "Taureau de Camargue mijoté longtemps, sur pain grillé", prix: 6, etiquettes: ["local", "fait-maison"] },
          { nom: "Tellines en persillade", description: "Les petits coquillages de la plage, ail et persil", prix: 8, etiquettes: ["local"] },
          { nom: "Croquettes de riz de Camargue", description: "Croustillantes dehors, fromage fondant dedans", prix: 5, etiquettes: ["vege", "local", "fait-maison"] },
          { nom: "Saucisson de taureau", description: "Tranché au comptoir, à partager (ou pas)", prix: 6, etiquettes: ["local"] },
          { nom: "Tapenade et crudités", description: "Olives noires et câpres (sans anchois), légumes croquants", prix: 5, etiquettes: ["vegan", "fait-maison"] },
        ],
      },
    ],
  },
};
