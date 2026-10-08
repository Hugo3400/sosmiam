/**
 * Prix tel qu'on le dit, pour VoiceOver et TalkBack (« 4,50 € » serait lu « 4 virgule 50 ») :
 * 12 → « 12 euros », 4.5 → « 4 euros 50 », 4.05 → « 4 euros 5 », 1 → « 1 euro », 0.8 → « 80 centimes ».
 */
export function formaterPrixLu(prix: number): string {
  const centimes = Math.round(prix * 100);
  const euros = Math.trunc(centimes / 100);
  const reste = Math.abs(centimes % 100);
  if (euros === 0 && reste > 0) return `${reste} centime${reste > 1 ? "s" : ""}`;
  const mot = Math.abs(euros) > 1 ? "euros" : "euro";
  return reste === 0 ? `${euros} ${mot}` : `${euros} ${mot} ${reste}`;
}
