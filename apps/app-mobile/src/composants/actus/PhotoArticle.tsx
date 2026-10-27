import { Image } from "expo-image";
import type { ImageSourcePropType } from "react-native";

export function PhotoArticle({ source, lu }: { source: ImageSourcePropType; lu: string }) {
  return (
    <Image
      source={source}
      accessible
      accessibilityLabel={lu}
      contentFit="cover"
      transition={150}
      style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: 16 }}
    />
  );
}
