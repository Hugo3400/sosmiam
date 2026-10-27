import type { SectionLegale } from "~/contenus/legal/type-legal";

export const sectionCarteDesLieuxAnglais: SectionLegale = {
  id: "carte-des-lieux",
  titre: "The map of venues",
  blocs: [
    "On the [Places](/lieux) page, a map shows where the restaurants, patisseries, bars and things to do are hiding. Its base map (the streets, the parks, the names of neighbourhoods) comes from **OpenFreeMap**, a free service that draws it from **OpenStreetMap** data, the map of the world maintained by its contributors.",
    {
      liste: [
        "**Always through our server**: your browser never contacts OpenFreeMap. It requests the map tiles (with the fonts and small icons that go with them) from our own server, at sosmiam.fr/fond-de-carte/, which fetches them from OpenFreeMap and keeps them in reserve for a while. So OpenFreeMap sees neither your IP address, nor your browser, nor the area you're looking at: only our server, asking it for map tiles.",
        "**Why**: so that you can wander around the map without one more company seeing your visit. The venue pins also come from our server.",
        "**Your location is never sent**: the map doesn't ask for it on its own. “Near me” works like the 📍 button on the “Keep me posted” form (see “[The ‘Keep me posted’ form](#formulaire)”): only if you tap it, and after your browser has asked for your permission, your location, rounded to about 100 metres, is used by our server to find your municipality via geo.api.gouv.fr, then the nearest city that has venues. Nothing is kept. “Search this area” does the same with the centre of the map, never with your location.",
        "**“Find me”**, on the full-screen map: your location stays in your browser, which rounds it to about a kilometre before centring the map on your area. Only the map tiles for that area are then requested from our server, as for any area you look at.",
        "**Nothing else**: no cookies, and the map doesn't call any outside mapping service. Only the “Directions” link, if you tap it, takes you to Google Maps, which then applies its own rules. Like any page, these requests pass through Cloudflare and follow the rules for server logs (see “[Server logs](#journaux)”).",
      ],
    },
  ],
};
