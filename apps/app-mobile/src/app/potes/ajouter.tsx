import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";

import { lireLienInvitation } from "@sos-miam/commun/fonctions/potes/lire-lien-invitation";
import { estPseudoValide } from "@sos-miam/commun/validation/est-pseudo-valide";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { CodeQrInvitation } from "~/composants/potes/CodeQrInvitation";
import { RecherchePseudo } from "~/composants/potes/RecherchePseudo";
import { RetourAjoutPote, type RetourAjout } from "~/composants/potes/RetourAjoutPote";
import { ScannerQrCode } from "~/composants/potes/ScannerQrCode";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserSession } from "~/hooks/utiliser-session";

/** Un pseudo seul (« @lea.croque » ou « lea.croque »), sans « @ » et en minuscules ; null si ce n'en est pas un */
const lirePseudoSeul = (texte: string): string | null => {
  const pseudo = texte.trim().replace(/^@/, "").toLowerCase();
  return estPseudoValide(pseudo) ? pseudo : null;
};

/**
 * Ajouter un pote : ton QR code et ton lien, le scan du QR code d'un pote (ou son lien collé), et la recherche par pseudo. Un
 * lien ou un QR code avec son code secret vous met dans la même bande tout de suite ; un pseudo seul envoie une demande.
 * Démo : seuls les potes d'exemple se trouvent (ajoutés tout de suite), on le dit en haut de l'écran.
 */
export default function AjouterPote() {
  const communaute = utiliserCommunaute();
  const { sociaux } = utiliserSession();
  const [enCours, setEnCours] = useState(false);
  const [lienColle, setLienColle] = useState("");
  const [retour, setRetour] = useState<RetourAjout | null>(null);
  // Ouvert par un lien d'invitation (sosmiam.fr/invitation/…) : rien ne se fait sans « Rejoindre sa bande » ou « Envoyer la demande »
  const { lien } = useLocalSearchParams<{ lien?: string }>();
  const lienTraite = useRef(false);
  const [aConfirmer, setAConfirmer] = useState<{ lien: string; pseudo: string; avecCode: boolean } | null>(null);
  useEffect(() => {
    if (!lien || lienTraite.current || !communaute.pret) return;
    lienTraite.current = true;
    const invitation = lireLienInvitation(lien);
    const pseudo = invitation?.pseudo ?? lirePseudoSeul(lien);
    if (!pseudo) return void ajouterDepuis(lien, "champ");
    setAConfirmer({ lien, pseudo, avecCode: Boolean(invitation?.code) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lien, communaute.pret]);

  // Le pseudo seul d'un compte connecté : on le cherche sur le serveur (le pseudo exact), sans les personnes bloquées
  async function trouverParPseudo(pseudo: string) {
    if (communaute.source !== "compte") return communaute.chercherParPseudo(pseudo).find((r) => r.pote.pseudo === pseudo)?.pote ?? null;
    const r = await sociaux.social.chercher(pseudo);
    const trouve = r.ok ? r.resultats.find((x) => x.personne.pseudo === pseudo) : undefined;
    if (!trouve) return null;
    communaute.noterPersonne(trouve.personne);
    return communaute.trouverPote(trouve.personne.id);
  }

  // Après un scan ou un texte collé. Un lien d'invitation complet (sosmiam.fr/invitation/…, avec son code secret) vous met
  // dans la même bande tout de suite ; un pseudo seul, collé ou caché dans un QR code, est une demande, comme la recherche.
  async function ajouterDepuis(texte: string, source: "qr" | "champ") {
    const invitation = lireLienInvitation(texte);
    const pseudo = invitation?.pseudo ?? lirePseudoSeul(texte);
    if (!pseudo) return setRetour({ type: "pas-invitation" });
    if (pseudo === communaute.moi.pseudo) return setRetour({ type: "toi" });
    // La recherche cache les personnes bloquées : on les retrouve à part pour le dire
    const bloque = communaute.bloques.find((p) => p.pseudo === pseudo);
    if (bloque) return setRetour({ type: "bloque", pote: bloque });
    setEnCours(true);
    try {
      let resultat;
      if (invitation?.code) resultat = await communaute.rejoindreParInvitation(pseudo, invitation.code, source === "qr" ? "qr" : "lien");
      else {
        const pote = await trouverParPseudo(pseudo);
        resultat = pote ? await communaute.demanderAjout(pote.id) : { type: "introuvable" as const, pseudo };
      }
      setRetour(resultat);
      if (source === "champ" && (resultat.type === "ajoute" || resultat.type === "demande")) setLienColle("");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <EcranReglage titre="Ajouter un pote" sousTitre="Plus on est de fous, plus on sauve de lieux.">
      {communaute.demo ? (
        <View className="mb-7 flex-row items-center gap-2.5 rounded-2xl border-2 border-dashed border-gris/40 bg-white/70 px-3.5 py-2.5">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-lg">
            🧪
          </Text>
          <Text className="flex-1 font-texte text-[13px] leading-5 text-gris">
            <Text className="font-texte-gras text-encre">Démo</Text>
            {lierPonctuation(" : seuls les potes d'exemple se trouvent, et ils arrivent tout de suite.")}
          </Text>
        </View>
      ) : null}

      <SectionReglages titre="Ton QR code">
        <View className="gap-3 pt-1">
          <Text className="font-texte text-sm leading-5 text-gris">
            {lierPonctuation(communaute.demo ? "Dans la démo, ton QR code ne sert que dans l'app." : "Ton pote le scanne dans l'app (Potes, « Ajouter un pote »), et hop : vous êtes dans la même bande.")}
          </Text>
          <CodeQrInvitation pseudo={communaute.moi.pseudo} />
        </View>
      </SectionReglages>

      <SectionReglages titre="Scanner un QR code">
        <View className="gap-3 pt-1">
          <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation("Ton pote te montre le sien (dans Potes, « Ajouter un pote ») : vise, c'est fait.")}</Text>
          <ScannerQrCode onLu={(texte) => void ajouterDepuis(texte, "qr")} onOuvrir={() => setRetour(null)} />
          <ChampTexte
            libelle="Ou colle le lien de ton pote"
            valeur={lienColle}
            onChangeTexte={setLienColle}
            placeholder="sosmiam.fr/invitation/…"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            keyboardType="url"
            returnKeyType="done"
            onSubmitEditing={() => {
              if (lienColle.trim()) void ajouterDepuis(lienColle, "champ");
            }}
          />
          <Bouton
            libelle={enCours ? "Un instant…" : "Ajouter avec ce lien"}
            variante="blanc"
            petit
            desactive={lienColle.trim() === "" || enCours}
            indice="Retrouve ton pote grâce à son lien et l'ajoute à ta bande"
            onPress={() => void ajouterDepuis(lienColle, "champ")}
          />
          {retour ? <RetourAjoutPote retour={retour} /> : null}
        </View>
      </SectionReglages>

      <SectionReglages titre="Chercher un pseudo">
        <View className="gap-3 pt-1">
          <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation("Tu connais son @ ? Tape-le, on te dit si on le trouve.")}</Text>
          <RecherchePseudo />
        </View>
      </SectionReglages>
      <FeuilleConfirmation
        visible={aConfirmer !== null}
        emoji="🤝"
        titre={aConfirmer?.avecCode ? `Rejoindre la bande de @${aConfirmer.pseudo} ?` : `Demander @${aConfirmer?.pseudo ?? ""} en pote ?`}
        detail={
          aConfirmer?.avecCode
            ? "Ce lien vient de l'extérieur de l'app. Dans une bande, vous voyez chacun la ville, les points et les lieux gardés de l'autre : rejoins seulement quelqu'un que tu connais."
            : "Ce lien vient de l'extérieur de l'app. Une demande partira : cette personne pourra l'accepter ou non."
        }
        libelleConfirmer={aConfirmer?.avecCode ? "Rejoindre sa bande" : "Envoyer la demande"}
        libelleRester="Non merci"
        indiceRester="Rien ne part, tu restes sur cet écran"
        onConfirmer={() => {
          if (aConfirmer) void ajouterDepuis(aConfirmer.lien, "champ");
        }}
        onFermer={() => setAConfirmer(null)}
      />
    </EcranReglage>
  );
}
