// Les onglets de la FAQ, dans l'ordre d'affichage. Les questions sont dans un fichier par onglet.
import { questionsAmbassadeurs } from "~/contenus/faq/ambassadeurs";
import { questionsApp } from "~/contenus/faq/app";
import { questionsBigSos } from "~/contenus/faq/big-sos";
import { questionsEssentiel } from "~/contenus/faq/essentiel";
import { questionsPros } from "~/contenus/faq/pros";
import type { OngletFaq } from "~/contenus/faq/type-faq";

export const ongletsFaq: OngletFaq[] = [
  { cle: "essentiel", emoji: "💡", titre: "L'essentiel", titreGroupe: "L'essentiel", questions: questionsEssentiel },
  { cle: "big-sos", emoji: "🆘", titre: "BIG SOS", titreGroupe: "BIG SOS", alerte: true, questions: questionsBigSos },
  { cle: "app", emoji: "📱", titre: "L'app", titreGroupe: "Utiliser l'app", questions: questionsApp },
  { cle: "pros", emoji: "🍽️", titre: "Pour les pros", titreGroupe: "Pour les pros", questions: questionsPros },
  { cle: "ambassadeurs", emoji: "🎖️", titre: "Ambassadeurs", titreGroupe: "Ambassadeurs & créateurs", questions: questionsAmbassadeurs },
];
