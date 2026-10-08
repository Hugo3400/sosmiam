import { useNavigation, useRouter } from "expo-router";
import { useCallback } from "react";

/**
 * Renvoie de quoi fermer l'écran : au premier écran d'une pile ouverte en plein écran (Scan…), on referme la pile
 * entière par son parent (sur iPhone, le retour global ne referme pas toujours ce genre de pile) ; plus loin dans la pile,
 * on revient d'un écran ; ouvert directement (lien, rechargement de la page web), on retombe sur l'onglet donné.
 */
export function utiliserFermerPile(repli: "/" | "/scan" = "/"): () => void {
  const router = useRouter();
  const navigation = useNavigation();
  return useCallback(() => {
    const parent = navigation.getParent();
    if (navigation.getState()?.index === 0 && parent?.canGoBack()) parent.goBack();
    else if (navigation.canGoBack()) navigation.goBack();
    else router.replace(repli);
  }, [navigation, router, repli]);
}
