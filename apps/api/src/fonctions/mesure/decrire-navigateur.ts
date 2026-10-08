export type DescriptionNavigateur = {
  appareil: "Mobile" | "Tablette" | "Ordinateur";
  navigateur: string;
  systeme: string;
};

/** Grandes familles d'appareil, de navigateur et de système, d'après la signature du navigateur (user-agent). */
export function decrireNavigateur(signature: string): DescriptionNavigateur {
  const ua = signature.toLowerCase();
  const tablette = /ipad|tablet|kindle|silk|playbook/.test(ua) || (ua.includes("android") && !ua.includes("mobile"));
  const mobile = !tablette && /mobi|iphone|ipod|android|windows phone/.test(ua);

  let systeme = "Autre";
  if (/iphone|ipad|ipod/.test(ua)) systeme = "iOS";
  else if (ua.includes("android")) systeme = "Android";
  else if (ua.includes("windows")) systeme = "Windows";
  else if (ua.includes("cros")) systeme = "ChromeOS";
  else if (ua.includes("mac os x") || ua.includes("macintosh")) systeme = "macOS";
  else if (ua.includes("linux")) systeme = "Linux";

  // L'ordre compte : Edge, Opera et Samsung se disent aussi « Chrome », et Chrome se dit aussi « Safari »
  let navigateur = "Autre";
  if (/instagram/.test(ua)) navigateur = "Instagram";
  else if (/bytedance|tiktok|musical_ly/.test(ua)) navigateur = "TikTok";
  else if (/fban|fbav/.test(ua)) navigateur = "Facebook";
  else if (/edg(e|a|ios)?\//.test(ua)) navigateur = "Edge";
  else if (/opr\/|opera/.test(ua)) navigateur = "Opera";
  else if (ua.includes("samsungbrowser")) navigateur = "Samsung Internet";
  else if (/firefox|fxios/.test(ua)) navigateur = "Firefox";
  else if (/chrome|crios|chromium/.test(ua)) navigateur = "Chrome";
  else if (ua.includes("safari")) navigateur = "Safari";

  return { appareil: tablette ? "Tablette" : mobile ? "Mobile" : "Ordinateur", navigateur, systeme };
}
