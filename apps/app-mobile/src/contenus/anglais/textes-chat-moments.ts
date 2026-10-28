import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_CHAT_MOMENTS } from "~/contenus/textes-chat-moments";

const enPhrase = (heure: string) => (heure === "00:00" ? "midnight" : heure === "12:00" ? "midday" : heure);

export const TEXTES_CHAT_MOMENTS_ANGLAIS: Traduction<typeof TEXTES_CHAT_MOMENTS> = {
  leMoment: (moment: string) => (/^(\d+ [A-Z]|[A-Z])/.test(moment) ? `on ${moment}` : moment),
  envoyeVu: (moment: string, heure: string) => `Sent ${moment} · ${heure}`,
  envoyeLu: (moment: string, heure: string) => `Sent ${moment}, at ${heure}`,
  momentVu: (moment: string, heure: string) => `${moment} · ${heure}`,
  momentLu: (moment: string, heure: string) => `${moment}, at ${heure}`,
  envoye: "Sent",
  envoyeDepuisVu: (moment: string) => `Sent · ${moment}`,
  envoyeDepuisLu: (moment: string) => `Sent ${moment}`,
  vu: "Seen",
  vuPar: (qui: string) => `Seen by ${qui}`,
  vuParPersonnes: (n: number) => `Seen by ${n} ${n === 1 ? "person" : "people"}`,
  aujourdhui: "Today",
  hier: "Yesterday",
  finDans1h: "In 1 hour",
  finDans3h: "In 3 hours",
  finCeSoir: "Tonight at 19:00",
  finA: (heure: string) => `at ${enPhrase(heure)}`,
  finDemain: (heure: string) => `tomorrow at ${enPhrase(heure)}`,
  finJour: (jour: string, heure: string) => `on ${jour} at ${enPhrase(heure)}`,
  votes: (votants: number, total: number) => `${votants} of ${total} voted`,
  voteFiniPersonne: "Voting's over – nobody voted",
  voteFini: (votes: string) => `Voting's over · ${votes}`,
  toutLeMonde: "Everyone's voted",
  finDuVote: (quand: string) => `voting ends ${quand}`,
};
