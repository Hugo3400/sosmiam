import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, SeparatorSpacingSize } from "discord.js";

type OptionsBloc = {
  couleur: number;
  /** Morceaux de texte (Markdown Discord), séparés par un trait fin. */
  parties: string[];
  /** Petite image carrée à droite du premier morceau (logo, avatar). */
  vignette?: string;
  /** Grande image sous le premier morceau. */
  image?: string;
  /** Boutons-liens en bas du bloc (adresses http ou https uniquement). */
  liens?: { libelle: string; url: string; emoji?: string }[];
  /** Petite ligne grise tout en bas. */
  pied?: string;
};

/** Bloc « Components V2 » de Discord : à envoyer avec le drapeau MessageFlags.IsComponentsV2. */
export function creerBloc({ couleur, parties, vignette, image, liens, pied }: OptionsBloc): ContainerBuilder {
  const bloc = new ContainerBuilder().setAccentColor(couleur);
  const [premiere, ...suivantes] = parties;

  if (vignette) {
    bloc.addSectionComponents((section) =>
      section.addTextDisplayComponents((t) => t.setContent(premiere)).setThumbnailAccessory((v) => v.setURL(vignette)),
    );
  } else {
    bloc.addTextDisplayComponents((t) => t.setContent(premiere));
  }
  if (image) bloc.addMediaGalleryComponents((galerie) => galerie.addItems((element) => element.setURL(image)));

  for (const partie of suivantes) {
    bloc.addSeparatorComponents((s) => s.setSpacing(SeparatorSpacingSize.Small));
    bloc.addTextDisplayComponents((t) => t.setContent(partie));
  }
  if (liens?.length) {
    const boutons = liens.map(({ libelle, url, emoji }) => {
      const bouton = new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(libelle).setURL(url);
      return emoji ? bouton.setEmoji(emoji) : bouton;
    });
    bloc.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(boutons));
  }
  if (pied) {
    bloc.addSeparatorComponents((s) => s.setSpacing(SeparatorSpacingSize.Small));
    bloc.addTextDisplayComponents((t) => t.setContent(`-# ${pied}`));
  }
  return bloc;
}
