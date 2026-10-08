// Formulaire de /proposer-lieu (5 champs au plus, limite de Discord).
import { ModalBuilder, TextInputStyle } from "discord.js";
import { TYPES_LIEUX } from "../contenus/types-lieux.ts";

export const CHAMPS_PROPOSITION = { nom: "nom", ville: "ville", type: "type", pourquoi: "pourquoi", lien: "lien" } as const;
const CHAMPS = CHAMPS_PROPOSITION;

/** Le formulaire ; son identifiant est le nom de la commande, pour que la réponse lui revienne. */
export function creerFormulaireProposition(nomCommande: string): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(nomCommande)
    .setTitle("Propose une pépite 💡")
    .addLabelComponents(
      (label) =>
        label
          .setLabel("Nom du lieu")
          .setTextInputComponent((champ) =>
            champ.setCustomId(CHAMPS.nom).setStyle(TextInputStyle.Short).setMaxLength(100).setPlaceholder("Ex. : La Petite Cuillère"),
          ),
      (label) =>
        label
          .setLabel("Ville ou quartier")
          .setTextInputComponent((champ) =>
            champ.setCustomId(CHAMPS.ville).setStyle(TextInputStyle.Short).setMaxLength(100).setPlaceholder("Ex. : Lyon, Croix-Rousse"),
          ),
      (label) =>
        label
          .setLabel("C'est quoi comme lieu ?")
          .setStringSelectMenuComponent((menu) =>
            menu
              .setCustomId(CHAMPS.type)
              .setPlaceholder("Choisis…")
              .addOptions(TYPES_LIEUX.map(({ valeur, libelle, emoji }) => ({ value: valeur, label: libelle, emoji: { name: emoji } }))),
          ),
      (label) =>
        label
          .setLabel("Pourquoi on devrait y aller ?")
          .setDescription("Le plat qui tue, l'accueil, l'ambiance… Et s'il a besoin de monde, raconte-nous.")
          .setTextInputComponent((champ) =>
            champ.setCustomId(CHAMPS.pourquoi).setStyle(TextInputStyle.Paragraph).setMinLength(20).setMaxLength(1000),
          ),
      (label) =>
        label
          .setLabel("Un lien ? (facultatif)")
          .setDescription("Site, Instagram, Google Maps…")
          .setTextInputComponent((champ) =>
            champ.setCustomId(CHAMPS.lien).setStyle(TextInputStyle.Short).setMaxLength(300).setRequired(false),
          ),
    );
}
