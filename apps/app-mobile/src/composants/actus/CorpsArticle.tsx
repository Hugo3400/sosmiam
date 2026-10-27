import { Fragment } from "react";
import { Text, View, type ImageSourcePropType } from "react-native";

import { PhotoArticle } from "~/composants/actus/PhotoArticle";

type Props = { paragraphes: readonly string[]; citation: string | null; photos: readonly ImageSourcePropType[]; photoLu: (n: number) => string };

export function CorpsArticle({ paragraphes, citation, photos, photoLu }: Props) {
  const restantes = photos.slice(Math.max(0, paragraphes.length - 1));
  return (
    <View className="gap-4">
      {paragraphes.map((texte, i) => (
        <Fragment key={i}>
          <Text className="font-texte text-base leading-[26px] text-encre">{texte}</Text>
          {i === 0 && citation ? (
            <View className="border-l-4 border-jaune py-1 pl-4">
              <Text className="font-titre-gras text-lg leading-7 text-encre">{citation}</Text>
            </View>
          ) : null}
          {i < paragraphes.length - 1 && photos[i] ? <PhotoArticle source={photos[i]} lu={photoLu(i + 1)} /> : null}
        </Fragment>
      ))}
      {restantes.map((source, i) => (
        <PhotoArticle key={`fin-${i}`} source={source} lu={photoLu(paragraphes.length + i)} />
      ))}
    </View>
  );
}
