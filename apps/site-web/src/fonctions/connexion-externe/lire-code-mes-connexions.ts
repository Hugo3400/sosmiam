import { TEXTES_MES_CONNEXIONS, type CodeMesConnexions } from "../../contenus/mes-connexions.ts";

export function lireCodeMesConnexions(code: string | null): CodeMesConnexions | null {
  return code !== null && Object.hasOwn(TEXTES_MES_CONNEXIONS.messages, code) ? (code as CodeMesConnexions) : null;
}
