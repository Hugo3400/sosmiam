/** Ce que le mail affiché a le droit de faire : aucun script, aucun formulaire ; images intégrées et de sosmiam.fr seulement */
const SECURITE = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: https://sosmiam.fr; style-src 'unsafe-inline'"><base target="_blank">`;

/**
 * Un mail tel qu'il a été mis en forme, dans un cadre isolé (sandbox : ni script, ni lien qui s'ouvre, ni formulaire). Les
 * images distantes d'autres sites ne se chargent jamais : elles serviraient à savoir que le mail a été ouvert.
 */
export function ApercuHtmlMail({ html, titre }: { html: string; titre: string }) {
  return <iframe title={`Mail : ${titre}`} srcDoc={`${SECURITE}${html}`} sandbox="" className="h-[65vh] w-full rounded-xl border border-ligne bg-white" />;
}
