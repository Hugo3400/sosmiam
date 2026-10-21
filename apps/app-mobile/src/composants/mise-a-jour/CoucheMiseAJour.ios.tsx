import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { FullWindowOverlay } from "react-native-screens";

type Props = {
  children: ReactNode;
};

export function CoucheMiseAJour({ children }: Props) {
  return (
    <FullWindowOverlay unstable_accessibilityContainerViewIsModal>
      <Animated.View entering={FadeIn.duration(250)} style={StyleSheet.absoluteFill}>
        {children}
      </Animated.View>
    </FullWindowOverlay>
  );
}
