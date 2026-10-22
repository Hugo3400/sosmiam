import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { View } from "react-native";

import { ImageAvatar } from "~/composants/profil/ImageAvatar";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { LigneReglage } from "~/composants/reglages/LigneReglage";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { etapesEnvies } from "~/contenus/inscription/envies";
import { TEXTES_GENRE } from "~/contenus/textes-genre";
import { TEXTES_MON_PROFIL as T } from "~/contenus/textes-parametres";
import { nommerAvatar } from "~/fonctions/compte/nommer-avatar";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";

export default function MonProfil() {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const { profil, avatar } = utiliserProfil();
  const { connecte } = utiliserSession();
  if (!profil) return null;

  const nombreEnvies = etapesEnvies.reduce((total, etape) => {
    const coches = profil.envies[etape.categorie] ?? [];
    return total + etape.choix.filter((choix) => coches.includes(choix.id)).length;
  }, 0);
  const detailEnvies =
    nombreEnvies === 0 ? "Rien de coché pour l'instant" : `${nombreEnvies} envie${nombreEnvies > 1 ? "s" : ""} cochée${nombreEnvies > 1 ? "s" : ""}`;
  const detailAvatar = avatar.type === "photo" ? "Ta photo pour l'instant, ou un Miami" : `En ${nommerAvatar(avatar)} pour l'instant, ou en photo`;
  const revenir = () => (router.canGoBack() ? router.back() : router.replace("/profil"));

  return (
    <EcranReglage titre={T.titre} sousTitre={T.sousTitre} libelleRetour={T.retour} onRetour={revenir}>
      <SectionReglages titre={T.sectionProfil}>
        <LigneReglage
          emoji="🎭"
          titre="Avatar"
          detail={detailAvatar}
          onPress={() => router.push("/reglages/avatar")}
          droite={
            <View className="flex-row items-center gap-2">
              <ImageAvatar avatar={avatar} taille={40} />
              <Ionicons name="chevron-forward" size={20} color={couleurs.gris} />
            </View>
          }
        />
        <LigneReglage
          emoji="🪪"
          titre="Mes infos"
          detail={`${profil.prenom}${profil.nom ? ` ${profil.nom}` : ""} · ${profil.ville}`}
          onPress={() => router.push("/reglages/infos")}
        />
      </SectionReglages>

      <SectionReglages titre={T.sectionPreferences}>
        <LigneReglage emoji="😋" titre="Mes envies" detail={detailEnvies} onPress={() => router.push("/reglages/envies")} />
        {connecte ? (
          <LigneReglage emoji="🙋" titre={TEXTES_GENRE.ligneReglage} detail={TEXTES_GENRE.ligneVide} onPress={() => router.push("/reglages/genre")} />
        ) : null}
      </SectionReglages>
    </EcranReglage>
  );
}
