import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { SortieMiamisApi } from "@sos-miam/commun/types/communaute";
import type { ParticipantSortieMiamis } from "@sos-miam/commun/types/sorties-miamis";
import { MenuOptions } from "~/composants/interface/MenuOptions";
import { RondMiami } from "~/composants/miamis/RondMiami";
import { TEXTES_SORTIE_MIAMIS } from "~/contenus/textes-sorties-miamis";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  sortie: SortieMiamisApi;
  monId: string;
  onRetirer: (personneId: string) => void;
};

function noter(p: ParticipantSortieMiamis, sortie: SortieMiamisApi, monId: string): string {
  if (p.present) return TEXTES_SORTIE_MIAMIS.notePresent;
  if (p.personne.id === sortie.organisateur.id) return TEXTES_SORTIE_MIAMIS.noteOrganise;
  if (p.personne.id === monId) return TEXTES_SORTIE_MIAMIS.noteToi;
  if (p.dansTaBande) return TEXTES_SORTIE_MIAMIS.noteBande;
  if (p.habitue) return TEXTES_SORTIE_MIAMIS.noteHabitue;
  if (p.nouveau) return TEXTES_SORTIE_MIAMIS.noteNouveau;
  return "";
}

export function QuiVientSortieMiamis({ sortie, monId, onRetirer }: Props) {
  const router = useRouter();
  const [choisi, setChoisi] = useState<ParticipantSortieMiamis | null>(null);
  const organisateur = sortie.moi.place === "organisateur";
  const nouveauDejaLa = sortie.participants.some((p) => p.nouveau && p.personne.id !== sortie.organisateur.id);
  const ouvrirProfil = (id: string) => router.push({ pathname: "/potes/profil/[id]", params: { id } });

  function toucher(p: ParticipantSortieMiamis) {
    vibrerLegerement();
    if (p.personne.id === monId) return;
    if (organisateur && p.personne.id !== sortie.organisateur.id) setChoisi(p);
    else ouvrirProfil(p.personne.id);
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-baseline justify-between gap-3">
        <Text accessibilityRole="header" className="font-titre text-xl text-encre">
          {TEXTES_SORTIE_MIAMIS.quiVient}
        </Text>
        <Text className="font-texte text-[13px] text-gris">{TEXTES_SORTIE_MIAMIS.places(sortie.participants.length, sortie.places)}</Text>
      </View>
      <View className="flex-row flex-wrap">
        {sortie.participants.map((p) => {
          const moi = p.personne.id === monId;
          const nom = moi ? TEXTES_SORTIE_MIAMIS.toi : `@${p.personne.pseudo}`;
          const note = noter(p, sortie, monId);
          return (
            <Pressable
              key={p.personne.id}
              accessibilityRole={moi ? undefined : "button"}
              accessibilityLabel={note ? `${nom}, ${note}` : nom}
              accessibilityHint={moi ? undefined : organisateur && p.personne.id !== sortie.organisateur.id ? "Voir son profil ou le retirer de la sortie" : "Ouvre son profil"}
              onPress={() => toucher(p)}
              style={{ width: "25%" }}
              className="items-center gap-1 px-1 pb-3 active:opacity-70"
            >
              <RondMiami personne={p.personne} taille={52} />
              <Text numberOfLines={1} className="font-texte-semi text-[11px] text-encre">
                {nom}
              </Text>
              <Text numberOfLines={1} className="font-texte text-[10px] text-gris">
                {note || " "}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {sortie.placeGardeePourNouveau && !nouveauDejaLa ? (
        <Text className="overflow-hidden rounded-2xl bg-jaune-clair px-3.5 py-2.5 font-texte text-[13px] leading-5 text-encre">{lierPonctuation(`➕ ${TEXTES_SORTIE_MIAMIS.placeGardee}`)}</Text>
      ) : null}
      {sortie.nombreEnAttente > 0 ? <Text className="font-texte text-[13px] text-gris">{TEXTES_SORTIE_MIAMIS.enAttente(sortie.nombreEnAttente)}</Text> : null}
      <MenuOptions
        visible={choisi !== null}
        titre={choisi ? `@${choisi.personne.pseudo}` : ""}
        options={
          choisi
            ? [
                { cle: "profil", emoji: "👤", titre: TEXTES_SORTIE_MIAMIS.voirProfil, agir: () => ouvrirProfil(choisi.personne.id) },
                {
                  cle: "retirer",
                  emoji: "🚪",
                  titre: TEXTES_SORTIE_MIAMIS.retirer,
                  detail: TEXTES_SORTIE_MIAMIS.retirerDetail,
                  confirmation: {
                    titre: TEXTES_SORTIE_MIAMIS.retirerTitre(choisi.personne.pseudo),
                    detail: TEXTES_SORTIE_MIAMIS.retirerDetail,
                    confirmer: TEXTES_SORTIE_MIAMIS.retirer,
                    rester: TEXTES_SORTIE_MIAMIS.retirerRester,
                  },
                  agir: () => onRetirer(choisi.personne.id),
                },
              ]
            : []
        }
        onFermer={() => setChoisi(null)}
      />
    </View>
  );
}
