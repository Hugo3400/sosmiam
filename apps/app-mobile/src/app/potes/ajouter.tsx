import { useState } from "react";
import { Text, View } from "react-native";

import { estPseudoValide } from "@sos-miam/commun/validation/est-pseudo-valide";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { CodeQrInvitation } from "~/composants/potes/CodeQrInvitation";
import { RecherchePseudo } from "~/composants/potes/RecherchePseudo";
import { RetourAjoutPote, type RetourAjout } from "~/composants/potes/RetourAjoutPote";
import { ScannerQrCode } from "~/composants/potes/ScannerQrCode";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { lireLienInvitation } from "~/fonctions/communaute/lire-lien-invitation";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";

/** Un pseudo seul (« @lea.croque » ou « lea.croque »), sans « @ » et en minuscules ; null si ce n'en est pas un */
const lirePseudoSeul = (texte: string): string | null => {
  const pseudo = texte.trim().replace(/^@/, "").toLowerCase();
  return estPseudoValide(pseudo) ? pseudo : null;
};

/**
 * Ajouter un pote : ton QR code et ton lien, le scan du QR code d'un pote (ou son lien collé), et la recherche par pseudo.
 * Démo : seuls les potes d'exemple se trouvent, on le dit en haut de l'écran.
 */
export default function AjouterPote() {
  const communaute = utiliserCommunaute();
  const [lienColle, setLienColle] = useState("");
  const [retour, setRetour] = useState<RetourAjout | null>(null);

  // Après un scan ou un texte collé : on retrouve la personne par son pseudo dans l'annuaire de la démo, puis on l'ajoute.
  // Seul un lien d'invitation complet (sosmiam.fr/invitation/…) compte comme un ajout par lien ou QR code ;
  // un pseudo seul, collé ou caché dans un QR code, est une recherche par pseudo comme les autres.
  function ajouterDepuis(texte: string, source: "qr" | "champ") {
    const invitation = lireLienInvitation(texte);
    const pseudo = invitation?.pseudo ?? lirePseudoSeul(texte);
    if (!pseudo) return setRetour({ type: "pas-invitation" });
    if (pseudo === communaute.moi.pseudo) return setRetour({ type: "toi" });
    const moyen = !invitation ? "pseudo" : source === "qr" ? "qr" : "lien";
    // Démo : le code secret du lien (invitation.code) n'est pas encore vérifié, l'API s'en chargera avec les comptes
    const pote =
      communaute.chercherParPseudo(pseudo).find((r) => r.pote.pseudo === pseudo)?.pote ??
      // La recherche cache les personnes bloquées : on les retrouve à part pour le dire
      communaute.bloques.find((p) => p.pseudo === pseudo) ??
      null;
    if (!pote) return setRetour({ type: "introuvable", pseudo });
    const resultat = communaute.ajouterPote(pote.id, moyen);
    setRetour(
      resultat === "introuvable" ? { type: "introuvable", pseudo } : resultat === "mineur" ? { type: "mineur", pote, moyen } : { type: resultat, pote },
    );
    if (source === "champ" && resultat === "ajoute") setLienColle("");
  }

  return (
    <EcranReglage titre="Ajouter un pote" sousTitre="Plus on est de fous, plus on sauve de lieux.">
      <View className="mb-7 flex-row items-center gap-2.5 rounded-2xl border-2 border-dashed border-gris/40 bg-white/70 px-3.5 py-2.5">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-lg">
          🧪
        </Text>
        <Text className="flex-1 font-texte text-[13px] leading-5 text-gris">
          <Text className="font-texte-gras text-encre">Potes d'exemple</Text>
          {lierPonctuation(" : tes vrais potes arriveront avec les comptes.")}
        </Text>
      </View>

      <SectionReglages titre="Ton QR code">
        <View className="gap-3 pt-1">
          <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation("Quand les comptes arriveront, ton pote le scannera dans l'app, et hop : vous serez dans la même bande.")}</Text>
          <CodeQrInvitation pseudo={communaute.moi.pseudo} />
        </View>
      </SectionReglages>

      <SectionReglages titre="Scanner un QR code">
        <View className="gap-3 pt-1">
          <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation("Ton pote te montre le sien (dans Potes, « Ajouter un pote ») : vise, c'est fait.")}</Text>
          <ScannerQrCode onLu={(texte) => ajouterDepuis(texte, "qr")} onOuvrir={() => setRetour(null)} />
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
              if (lienColle.trim()) ajouterDepuis(lienColle, "champ");
            }}
          />
          <Bouton
            libelle="Ajouter avec ce lien"
            variante="blanc"
            petit
            desactive={lienColle.trim() === ""}
            indice="Retrouve ton pote grâce à son lien et l'ajoute à ta bande"
            onPress={() => ajouterDepuis(lienColle, "champ")}
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
    </EcranReglage>
  );
}
