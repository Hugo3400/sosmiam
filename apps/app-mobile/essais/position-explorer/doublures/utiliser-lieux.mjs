import { monde } from "./monde.mjs";

const oublierZonesDeTaPosition = () => {
  monde.zonesOubliees += 1;
};

export const utiliserLieux = () => ({ oublierZonesDeTaPosition });
