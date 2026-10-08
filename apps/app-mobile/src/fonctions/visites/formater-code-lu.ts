/**
 * Code de rapprochement tel que le lit VoiceOver ou TalkBack, chiffre par chiffre : « 4821 » → « 4, 8, 2, 1 »
 * (sinon il dirait « quatre mille huit cent vingt et un », impossible à répéter au comptoir).
 */
export function formaterCodeLu(code: string): string {
  return Array.from(code.replace(/\s+/g, "")).join(", ");
}
