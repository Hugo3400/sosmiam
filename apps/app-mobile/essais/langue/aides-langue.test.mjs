import assert from "node:assert/strict";
import { test } from "node:test";

import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";
import { ecrireJourLong } from "~/fonctions/dates/ecrire-jour-long";
import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";
import { formaterMomentRelatif } from "~/fonctions/dates/formater-moment-relatif";
import { formaterDistance } from "~/fonctions/geo/formater-distance";
import { direChezLieuLangue } from "~/fonctions/langue/dire-chez-lieu-langue";
import { direDeLieuLangue } from "~/fonctions/langue/dire-de-lieu-langue";
import { ecrireDateLongueLangue } from "~/fonctions/langue/ecrire-date-longue-langue";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";
import { ecrireJourLongLangue } from "~/fonctions/langue/ecrire-jour-long-langue";
import { ecrireNombreCouvertsLangue } from "~/fonctions/langue/ecrire-nombre-couverts-langue";
import { ecrireNombrePersonnesLangue } from "~/fonctions/langue/ecrire-nombre-personnes-langue";
import { formaterDistanceLangue } from "~/fonctions/langue/formater-distance-langue";
import { formaterMomentRelatifLangue } from "~/fonctions/langue/formater-moment-relatif-langue";
import { direChezLieu } from "~/fonctions/visites/dire-chez-lieu";
import { direDeLieu } from "~/fonctions/visites/dire-de-lieu";
import { ecrireNombreCouverts } from "~/fonctions/reservations/ecrire-nombre-couverts";
import { ecrireNombrePersonnes } from "~/fonctions/reservations/ecrire-nombre-personnes";

const LIEUX = ["Chez Nonna Lia", "Restaurant du Capitaine Bouiboui", "Aux Pâtés de Lucette", "Le Chou Rieur", "Émile", "Sucre & Garrigue"];
const MAINTENANT = new Date(2026, 9, 28, 15, 0);
const INSTANTS = [new Date(2026, 9, 28, 14, 32), new Date(2026, 9, 27, 21, 0), new Date(2026, 9, 24, 9, 5), new Date(2026, 9, 1, 12, 0), new Date(2025, 2, 3, 8, 0)];

test("en français, chaque aide rend exactement l'ancienne fonction", () => {
  for (const nom of LIEUX) {
    assert.equal(direChezLieuLangue(nom, "fr"), direChezLieu(nom));
    assert.equal(direDeLieuLangue(nom, "fr"), direDeLieu(nom));
  }
  for (const n of [1, 2, 12]) {
    assert.equal(ecrireNombrePersonnesLangue(n, "fr"), ecrireNombrePersonnes(n));
    assert.equal(ecrireNombreCouvertsLangue(n, "fr"), ecrireNombreCouverts(n));
  }
  for (const km of [0.01, 0.35, 0.98, 1.1, 2, 9.96, 33.4]) assert.equal(formaterDistanceLangue(km, "fr"), formaterDistance(km));
  for (const iso of ["2004-03-12", "2026-10-01", "2026-12-25"]) assert.equal(ecrireDateLongueLangue(iso, "fr"), formaterDateLongue(iso));
  for (const instant of INSTANTS) {
    assert.equal(ecrireHeureLangue(instant, "fr"), ecrireHeure(instant));
    assert.equal(ecrireJourLongLangue(instant, "fr", MAINTENANT), ecrireJourLong(instant, MAINTENANT));
    assert.deepEqual(formaterMomentRelatifLangue(instant.toISOString(), "fr", MAINTENANT), formaterMomentRelatif(instant.toISOString(), MAINTENANT));
  }
});

test("en anglais : « at » devant un lieu, people et covers, point décimal, heures en 24 h, dates britanniques", () => {
  assert.equal(direChezLieuLangue("Chez Nonna Lia", "en"), "at Chez Nonna Lia");
  assert.equal(direDeLieuLangue("Restaurant du Capitaine Bouiboui", "en"), "at Restaurant du Capitaine Bouiboui");
  assert.equal(ecrireNombrePersonnesLangue(1, "en"), "1 person");
  assert.equal(ecrireNombrePersonnesLangue(4, "en"), "4 people");
  assert.equal(ecrireNombreCouvertsLangue(1, "en"), "1 cover");
  assert.equal(ecrireNombreCouvertsLangue(40, "en"), "40 covers");
  assert.equal(formaterDistanceLangue(1.1, "en"), "1.1 km");
  assert.equal(formaterDistanceLangue(0.35, "en"), "350 m");
  assert.equal(ecrireDateLongueLangue("2026-10-01", "en"), "1 October 2026");
  assert.equal(ecrireHeureLangue(new Date(2026, 9, 28, 9, 5), "en"), "09:05");
  assert.equal(ecrireJourLongLangue(new Date(2026, 9, 30, 20, 0), "en", MAINTENANT), "Friday 30 October");
  assert.equal(ecrireJourLongLangue(new Date(2025, 2, 3, 8, 0), "en", MAINTENANT), "Monday 3 March 2025");
  const moments = INSTANTS.map((i) => formaterMomentRelatifLangue(i.toISOString(), "en", MAINTENANT));
  assert.deepEqual(moments, [
    { court: "14:32", lu: "today at 14:32" },
    { court: "Yesterday", lu: "yesterday" },
    { court: "Sat", lu: "Saturday" },
    { court: "1 Oct", lu: "1 October" },
    { court: "3 Mar 2025", lu: "3 March 2025" },
  ]);
});
