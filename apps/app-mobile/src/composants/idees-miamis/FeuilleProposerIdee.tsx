import * as Crypto from "expo-crypto";
import { useMemo, useState } from "react";
import { Text } from "react-native";

import { trouverIdeeProche } from "@sos-miam/commun/fonctions/idees/trouver-idee-proche";
import { LONGUEUR_MAX_DETAIL_IDEE, LONGUEUR_MAX_TITRE_IDEE, LONGUEUR_MIN_TITRE_IDEE } from "@sos-miam/commun/regles/idees";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { IdeeMiamis, NouvelleIdee } from "@sos-miam/commun/types/idees";
import { validerNouvelleIdee } from "@sos-miam/commun/validation/valider-nouvelle-idee";
import { RefusLimitationEnPlace } from "~/composants/compte/RefusLimitationEnPlace";
import { CarteDoublonIdee } from "~/composants/idees-miamis/CarteDoublonIdee";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { TEXTES_IDEES } from "~/contenus/textes-idees";
import { expliquerRefusIdee } from "~/fonctions/idees-miamis/expliquer-refus-idee";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  visible: boolean;
  idees: readonly IdeeMiamis[];
  envoi: boolean;
  onFermer: () => void;
  onProposer: (idee: NouvelleIdee, cle: string) => Promise<ErreurService | null>;
  onVoterDoublon: (idee: IdeeMiamis) => void;
  onVoirDoublon: (idee: IdeeMiamis) => void;
};

export function FeuilleProposerIdee({ visible, idees, envoi, onFermer, onProposer, onVoterDoublon, onVoirDoublon }: Props) {
  const [titre, setTitre] = useState("");
  const [detail, setDetail] = useState("");
  const [tente, setTente] = useState(false);
  const [ignorees, setIgnorees] = useState<ReadonlySet<string>>(new Set());
  const [refus, setRefus] = useState<{ limite: boolean; texte: string } | null>(null);
  const [cle, setCle] = useState(() => Crypto.randomUUID());
  const [ouvert, setOuvert] = useState(visible);
  if (visible !== ouvert) {
    setOuvert(visible);
    if (visible) {
      setTitre("");
      setDetail("");
      setTente(false);
      setIgnorees(new Set());
      setRefus(null);
      setCle(Crypto.randomUUID());
    }
  }

  const verdict = validerNouvelleIdee({ titre, detail });
  const erreurTitre = tente && !verdict.ok && verdict.champ === "titre" ? TEXTES_IDEES.erreurs[verdict.raison] : null;
  const erreurDetail = tente && !verdict.ok && verdict.champ === "detail" ? TEXTES_IDEES.erreursDetail[verdict.raison] : null;

  const candidates = useMemo(() => idees.filter((i) => i.statut !== "en-relecture" && i.statut !== "faite"), [idees]);
  const doublon = useMemo(() => {
    if (titre.trim().length < LONGUEUR_MIN_TITRE_IDEE) return null;
    return trouverIdeeProche(`${titre} ${detail}`, candidates.filter((i) => !ignorees.has(i.id)));
  }, [titre, detail, candidates, ignorees]);

  function changerTitre(texte: string) {
    setTitre(texte);
    setRefus(null);
  }

  function changerDetail(texte: string) {
    setDetail(texte);
    setRefus(null);
  }

  async function envoyer() {
    setTente(true);
    if (!verdict.ok || envoi) return;
    setRefus(null);
    const erreur = await onProposer(verdict.idee, cle);
    if (erreur) setRefus(expliquerRefusIdee(erreur));
  }

  return (
    <FeuilleBas
      visible={visible}
      titre={TEXTES_IDEES.feuilleTitre}
      onFermer={onFermer}
      pied={
        <>
          <RefusLimitationEnPlace texte={refus?.limite ? refus.texte : null} />
          {refus && !refus.limite ? (
            <Text accessibilityLiveRegion="polite" className="font-texte-semi text-sm leading-5 text-rouge-texte">
              {lierPonctuation(refus.texte)}
            </Text>
          ) : null}
          <Bouton libelle={envoi ? TEXTES_IDEES.envoiEnCours : TEXTES_IDEES.envoyer} variante="encre" desactive={envoi} onPress={() => void envoyer()} />
          <Bouton libelle={TEXTES_IDEES.annuler} variante="blanc" onPress={onFermer} />
        </>
      }
    >
      <ChampTexte
        libelle={TEXTES_IDEES.enUnePhrase}
        valeur={titre}
        onChangeTexte={changerTitre}
        placeholder={TEXTES_IDEES.titrePlaceholder}
        maxLength={LONGUEUR_MAX_TITRE_IDEE}
        autoCapitalize="sentences"
        returnKeyType="next"
        erreur={erreurTitre}
      />
      {doublon ? (
        <CarteDoublonIdee
          idee={doublon}
          onVoter={() => onVoterDoublon(doublon)}
          onVoir={() => onVoirDoublon(doublon)}
          onPasPareil={() => setIgnorees((avant) => new Set([...avant, doublon.id]))}
        />
      ) : null}
      <ChampTexte
        libelle={TEXTES_IDEES.detail}
        mention={TEXTES_IDEES.detailMention}
        valeur={detail}
        onChangeTexte={changerDetail}
        placeholder={TEXTES_IDEES.detailPlaceholder}
        maxLength={LONGUEUR_MAX_DETAIL_IDEE}
        multiline
        textAlignVertical="top"
        autoCapitalize="sentences"
        erreur={erreurDetail}
      />
      <Text className="font-texte text-[13px] leading-5 text-gris">{lierPonctuation(TEXTES_IDEES.note)}</Text>
    </FeuilleBas>
  );
}
