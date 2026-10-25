import { LIEU_DEMO_PRO_ID } from "~/contenus/lieu-demo-pro";

export const IMAGES_LIEUX_DEMO: Readonly<Record<number, { banniere?: number; logo?: number }>> = {
  [LIEU_DEMO_PRO_ID]: {
    banniere: require("../../assets/medias-demo/lieu-demo-pro-banniere.jpg"),
    logo: require("../../assets/medias-demo/lieu-demo-pro-logo.png"),
  },
};
