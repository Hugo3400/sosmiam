// Essai sur base (PGlite, toutes les migrations du dépôt) du verrou des comptes de la messagerie (messagerie-tables.ts,
// verrouillerComptes) par le VRAI client Prisma, dans une vraie transaction : une seule requête, les id triés et sans
// doublon (ni 0, ni négatif), FOR NO KEY UPDATE ; et le verrou lui-même, lu dans l'en-tête des lignes (pageinspect) :
// exclusif et « verrou seul », mais SANS la clé (ce qui le distingue de FOR UPDATE, voir preparer-essai-avis.ts), posé par
// cette transaction sur les comptes demandés et sur eux seuls. Sans transaction, ou sans compte : aucune requête. Aucune
// vraie base.
import "../socle/garde-fou.ts";
import { pageinspect } from "@electric-sql/pglite/contrib/pageinspect";
import { Prisma } from "../../src/base-de-donnees/client-genere/client.ts";
import { creerTablesMessagerie } from "../../src/services/messagerie-tables.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire({ extensions: { pageinspect } });
await essai.db.exec("CREATE EXTENSION pageinspect");
const verifications = creerVerifications();
const { egal, correspond } = verifications;
await essai.sql(`INSERT INTO comptes (id, email, mot_de_passe, prenom, cgu_version) VALUES
  (10, 'a@exemple.fr', 'x', 'A', 'v'), (11, 'b@exemple.fr', 'x', 'B', 'v'), (12, 'c@exemple.fr', 'x', 'C', 'v')`);

/** Le client (ou la transaction) dont on garde le texte des requêtes brutes */
const espionner = <C extends object>(client: C, requetes: string[]): C => new Proxy(client, {
  get(cible, nom) {
    const valeur = Reflect.get(cible, nom, cible);
    if (nom === "$queryRaw") {
      return (chaines: TemplateStringsArray, ...valeurs: unknown[]) => {
        requetes.push(Prisma.sql(chaines, ...valeurs).text);
        return (valeur as (...a: unknown[]) => unknown).call(cible, chaines, ...valeurs);
      };
    }
    return typeof valeur === "function" ? valeur.bind(cible) : valeur;
  },
});

/** Le verrou de ligne de chaque compte, lu par tx dans l'en-tête de sa ligne (bits de t_infomask et t_infomask2) */
const lireVerrous = async (tx: any) => (await tx.$queryRawUnsafe(`SELECT c.id,
    h.t_xmax::text = pg_current_xact_id_if_assigned()::text AS "parMoi",
    (h.t_infomask & 128) <> 0 AND (h.t_infomask & 64) <> 0 AS "exclusifSeul",
    (h.t_infomask2 & 8192) <> 0 AS "surLaCle"
  FROM comptes c, heap_page_items(get_raw_page('comptes', (c.ctid::text::point)[0]::int)) h
  WHERE h.lp = (c.ctid::text::point)[1]::int ORDER BY c.id`) as { id: number; parMoi: boolean | null; exclusifSeul: boolean; surLaCle: boolean }[])
  .map((l) => [l.id, l.parMoi === true, l.exclusifSeul, l.surLaCle]);

const requetes: string[] = [];
const verrous = await essai.base.$transaction(async (tx) => {
  const espion = espionner(tx, requetes);
  const t = creerTablesMessagerie(espion as never, {} as never, {} as never, espion as never);
  await t.verrouillerComptes([11, 10, 10, 0, -1]);
  await t.verrouillerComptes([]);
  return lireVerrous(tx);
});
egal(requetes.length, 1, "une seule requête (liste vide : rien)");
correspond(requetes[0]!.replace(/\s+/g, " "), /^SELECT id FROM comptes WHERE id IN \(\$1,\$2\) ORDER BY id FOR NO KEY UPDATE$/, "deux id, dans l'ordre, FOR NO KEY UPDATE");
egal(verrous, [[10, true, true, false], [11, true, true, false], [12, false, false, false]],
  "10 et 11 : verrou exclusif de CETTE transaction, sans la clé (FOR NO KEY UPDATE) ; 12 : rien");

// Témoin de la lecture : un FOR UPDATE se lit bien « sur la clé »
const temoin = await essai.base.$transaction(async (tx) => {
  await tx.$queryRaw`SELECT id FROM comptes WHERE id = ${12} FOR UPDATE`;
  return lireVerrous(tx);
});
egal(temoin.find(([id]) => id === 12), [12, true, true, true], "témoin : FOR UPDATE pose aussi le bit de la clé");

// Hors d'une transaction (lectures de l'API) : jamais de verrou
const sansTransaction: string[] = [];
await creerTablesMessagerie(espionner(essai.base, sansTransaction) as never, {} as never, {} as never).verrouillerComptes([10, 11]);
egal(sansTransaction, [], "sans transaction : aucune requête");
await terminerEssai(import.meta.url, essai, verifications.nombre);
