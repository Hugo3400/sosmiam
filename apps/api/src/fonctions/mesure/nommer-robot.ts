// Robots connus, du plus courant au plus rare (le premier qui correspond l'emporte).
const ROBOTS: [RegExp, string][] = [
  [/googlebot|google-inspectiontool|googleother|adsbot-google|mediapartners-google/i, "Google"],
  [/bingbot|bingpreview|msnbot/i, "Bing"],
  [/applebot/i, "Apple"],
  [/duckduckbot|duckassistbot/i, "DuckDuckGo"],
  [/yandex/i, "Yandex"],
  [/baiduspider/i, "Baidu"],
  [/qwant/i, "Qwant"],
  [/gptbot|chatgpt-user|oai-searchbot/i, "OpenAI"],
  [/claudebot|claude-web|anthropic/i, "Anthropic"],
  [/perplexity/i, "Perplexity"],
  [/ccbot/i, "Common Crawl"],
  [/facebookexternalhit|meta-externalagent|facebot/i, "Facebook / Instagram"],
  [/twitterbot/i, "X (Twitter)"],
  [/linkedinbot/i, "LinkedIn"],
  [/discordbot/i, "Discord"],
  [/whatsapp/i, "WhatsApp"],
  [/telegrambot/i, "Telegram"],
  [/slackbot/i, "Slack"],
  [/bytespider|tiktok/i, "TikTok / ByteDance"],
  [/ahrefs/i, "Ahrefs"],
  [/semrush/i, "Semrush"],
  [/uptime|monitor|pingdom|statuscake/i, "Surveillance"],
  [/curl|wget|python|go-http|node-fetch|axios|undici|okhttp|java\//i, "Script ou outil"],
];

/** Nom lisible d'un robot d'après sa signature (« Google », « Bing »…), « Autre robot » sinon. */
export function nommerRobot(signature: string): string {
  return ROBOTS.find(([motif]) => motif.test(signature))?.[1] ?? "Autre robot";
}
