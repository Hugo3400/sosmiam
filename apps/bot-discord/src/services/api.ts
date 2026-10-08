// Appels du bot à l'API de SOS Miam (routes /bot, protégées par le secret partagé SECRET_BOT du .env).
const ADRESSE_API = process.env.ADRESSE_API || "http://127.0.0.1:5192";

/** Vrai si le bot sait parler à l'API (secret présent). Sinon, propositions et annonces restent seulement sur Discord. */
export const apiConfiguree = () => (process.env.SECRET_BOT ?? "").length >= 32;

export async function appelerApi<T>(methode: "GET" | "POST", chemin: string, corps?: unknown): Promise<T> {
  const reponse = await fetch(`${ADRESSE_API}/bot${chemin}`, {
    method: methode,
    headers: { "Content-Type": "application/json", "X-Secret-Bot": process.env.SECRET_BOT ?? "" },
    ...(corps === undefined ? {} : { body: JSON.stringify(corps) }),
    signal: AbortSignal.timeout(8000),
  });
  if (!reponse.ok) throw new Error(`API : ${methode} /bot${chemin} → ${reponse.status}`);
  return (await reponse.json()) as T;
}
