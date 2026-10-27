import { useEffect, useState } from "react";
import { Pressable, Text } from "react-native";

import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/textes-actus";
import { utiliserServiceActus } from "~/hooks/utiliser-service-actus";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = { haut: number; onOuvrir: () => void };

export function BandeauActusAbonnements({ haut, onOuvrir }: Props) {
  const T = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE);
  const { service } = utiliserServiceActus();
  const [nombre, setNombre] = useState(0);

  useEffect(() => {
    let actif = true;
    void service.abonnements().then((r) => {
      if (actif) setNombre(r.ok ? r.articles.length : 0);
    });
    return () => {
      actif = false;
    };
  }, [service]);

  if (nombre === 0) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={T.bandeauLu(nombre)}
      onPress={onOuvrir}
      style={{ top: haut }}
      className="absolute self-center rounded-full border-2 border-nuit bg-jaune px-4 py-2 active:opacity-90"
    >
      <Text maxFontSizeMultiplier={1.3} className="font-texte-gras text-[13px] text-nuit">
        {`${T.bandeauAbonnements(nombre)} · ${T.bandeauLire}`}
      </Text>
    </Pressable>
  );
}
