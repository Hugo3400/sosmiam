import type { ReactNode } from "react";
import { Modal } from "react-native";

type Props = {
  children: ReactNode;
};

const resterOuvert = () => undefined;

export function CoucheMiseAJour({ children }: Props) {
  return (
    <Modal visible animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={resterOuvert}>
      {children}
    </Modal>
  );
}
