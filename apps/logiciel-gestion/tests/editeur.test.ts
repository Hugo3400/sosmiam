// Tests du rendu de l'éditeur visuel : le document devient un mail sûr (HTML échappé, liens contrôlés) et un texte lisible.
import assert from "node:assert/strict";
import { test } from "node:test";

import type { JSONContent } from "@tiptap/react";

import { rendreHtmlCourriel } from "../src/fonctions/editeur/rendre-html-courriel.ts";
import { rendreTexteBrut } from "../src/fonctions/editeur/rendre-texte-brut.ts";

const texte = (t: string, marks: JSONContent["marks"] = []): JSONContent => ({ type: "text", text: t, marks });
const document: JSONContent = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 1 }, content: [texte("Des nouvelles 🛟")] },
    { type: "paragraph", content: [texte("Salut "), texte("toi", [{ type: "bold" }, { type: "italic" }]), texte(" !"), { type: "hardBreak" }, texte("Ligne 2")] },
    { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [texte("Une ville")] }] }, { type: "listItem", content: [{ type: "paragraph", content: [texte("Des lieux")] }] }] },
    { type: "orderedList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [texte("Premier")] }] }] },
    { type: "blockquote", content: [{ type: "paragraph", content: [texte("Trop bon")] }] },
    { type: "paragraph", content: [texte("le site", [{ type: "link", attrs: { href: "https://sosmiam.fr" } }])] },
    { type: "horizontalRule" },
    { type: "bouton", attrs: { texte: "Découvrir", adresse: "https://sosmiam.fr/liens" } },
  ],
};

test("le document devient un mail stylé : titres, gras, listes, citation, lien, séparateur, bouton", () => {
  const html = rendreHtmlCourriel(document);
  assert.ok(html.includes("<h1 style=") && html.includes("Des nouvelles 🛟</h1>"));
  assert.ok(html.includes("<em><strong>toi</strong></em>") || html.includes("<strong><em>toi</em></strong>"));
  assert.ok(html.includes("Salut") && html.includes("<br>Ligne 2"));
  assert.ok(html.includes("<ul style=") && html.includes("<li>Une ville</li><li>Des lieux</li>"));
  assert.ok(html.includes("<ol style=") && html.includes("<blockquote style="));
  assert.ok(html.includes('<a href="https://sosmiam.fr" style='));
  assert.ok(html.includes("<hr style="));
  assert.ok(html.includes('<a href="https://sosmiam.fr/liens" style="') && html.includes(">Découvrir</a>"));
});

test("le texte saisi est échappé et les liens dangereux sont retirés", () => {
  const piege: JSONContent = {
    type: "doc",
    content: [
      { type: "paragraph", content: [texte('<script>alert(1)</script> "x"'), texte("clic", [{ type: "link", attrs: { href: "javascript:alert(1)" } }])] },
      { type: "bouton", attrs: { texte: "<b>Go</b>", adresse: "data:text/html,boum" } },
      { type: "iframe", attrs: { src: "https://mechant.example" } },
    ],
  };
  const html = rendreHtmlCourriel(piege);
  assert.ok(!html.includes("<script>") && html.includes("&lt;script&gt;") && html.includes("&quot;x&quot;"));
  assert.ok(!html.includes("javascript:") && html.includes("clic"));
  assert.ok(!html.includes("data:text") && !html.includes("<b>Go"));
  assert.ok(!html.includes("iframe") && !html.includes("mechant"));
});

test("la version texte se lit sans mise en forme", () => {
  assert.equal(
    rendreTexteBrut(document),
    ["Des nouvelles 🛟", "Salut toi !\nLigne 2", "- Une ville\n- Des lieux", "1. Premier", "> Trop bon", "le site (https://sosmiam.fr)", "———", "Découvrir : https://sosmiam.fr/liens"].join("\n\n"),
  );
});

test("annonce Discord : la mise en forme Discord, et le texte tapé reste du texte", async () => {
  const { rendreMarkdownDiscord } = await import("../src/fonctions/editeur/rendre-markdown-discord.ts");
  assert.equal(
    rendreMarkdownDiscord(document),
    ["# Des nouvelles 🛟", "Salut ***toi*** !\nLigne 2", "- Une ville\n- Des lieux", "1. Premier", "> Trop bon", "[le site](https://sosmiam.fr)", "———", "👉 **[Découvrir](https://sosmiam.fr/liens)**"].join("\n\n"),
  );
  const piege: JSONContent = { type: "doc", content: [{ type: "paragraph", content: [texte("- 2*3 = _six_ @everyone")] }, { type: "paragraph", content: [texte("écris-nous", [{ type: "link", attrs: { href: "mailto:bonjour@sosmiam.fr" } }])] }] };
  assert.equal(rendreMarkdownDiscord(piege), "\\- 2\\*3 = \\_six\\_ @everyone\n\nécris-nous (bonjour@sosmiam.fr)");
});
