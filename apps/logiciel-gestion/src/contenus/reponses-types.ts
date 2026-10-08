// Les catégories des réponses types, et trois modèles pour démarrer (que Hugo modifie ou supprime à son goût).
import type { CategorieReponse, SaisieReponseType } from "~/services/reponses-types.ts";

export const CATEGORIES_REPONSES: Record<CategorieReponse, string> = {
  demande: "Demandes de lieux",
  ambassadeur: "Ambassadeurs",
  moderation: "Modération",
  lieu: "Lieux",
  createur: "Créateurs",
  autre: "Autre",
};

export const EXEMPLES_REPONSES: SaisieReponseType[] = [
  {
    titre: "Demande de lieu : pas pour tout de suite",
    categorie: "demande",
    objet: "Ta demande pour {lieu} sur SOS Miam",
    texte: "Salut !\n\nMerci d'avoir pensé à SOS Miam pour {lieu}, ça nous fait vraiment plaisir.\n\nOn ne peut pas l'ajouter tout de suite : [la raison, avec bienveillance]. On garde ta demande sous le coude et on revient vers toi dès que ça change.\n\nÀ très vite,\nHugo, pour SOS Miam",
  },
  {
    titre: "Ambassadeur : on ne t'a pas vu depuis un moment",
    categorie: "ambassadeur",
    objet: "Tu nous manques, {prenom} 🛟",
    texte: "Salut {prenom} !\n\nÇa fait un petit moment qu'on ne t'a pas vu dans ton espace ambassadeur. Tout va bien ?\n\nSi tu as un peu de temps, il y a de nouvelles pépites à découvrir près de chez toi, et quelques lieux qui auraient bien besoin d'un coup de main.\n\nPas de pression : réponds simplement à ce mail si tu veux qu'on en parle.\n\nHugo, pour SOS Miam",
  },
  {
    titre: "Merci à un créateur",
    categorie: "createur",
    objet: "Merci pour ta vidéo 💛",
    texte: "Salut {prenom} !\n\nUn énorme merci pour ta vidéo sur {lieu}. Elle a fait du bien au lieu, et à nous aussi.\n\nSi tu as envie de recommencer, on a d'autres lieux qui gagneraient à être connus : dis-nous ce qui te tente.\n\nHugo, pour SOS Miam",
  },
];
