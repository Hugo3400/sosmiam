import { ArrowDownUp, Clock, Cpu, HardDrive, MemoryStick, Thermometer, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Etincelle } from "~/composants/interface/Etincelle.tsx";
import { Jauge } from "~/composants/interface/Jauge.tsx";
import { formaterPourcentage } from "~/fonctions/maintenance/formater-pourcentage.ts";
import { formaterTempsAllume } from "~/fonctions/maintenance/formater-temps-allume.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { formaterDebit } from "~/fonctions/texte/formater-debit.ts";
import { formaterOctets } from "~/fonctions/texte/formater-octets.ts";
import type { MaintenantMachine } from "~/services/machines.ts";

const SEUIL_TEMPERATURE = 80;

function Tuile({ icone: Icone, libelle, valeur, children }: { icone: LucideIcon; libelle: string; valeur: ReactNode; children?: ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-1.5 rounded-carte border border-ligne bg-white p-4">
      <p className="flex items-center gap-1.5 text-[13px] font-semibold text-gris"><Icone className="size-4" aria-hidden /> {libelle}</p>
      <p className="chiffres font-titre text-[26px] leading-none font-extrabold">{valeur}</p>
      {children}
    </div>
  );
}

const Unite = ({ children }: { children: ReactNode }) => <small className="font-texte text-sm font-semibold text-gris">{children}</small>;
const Detail = ({ children }: { children: ReactNode }) => <p className="chiffres text-[12.5px] text-gris">{children}</p>;

export function TuilesMachine({ maintenant: m }: { maintenant: MaintenantMachine }) {
  const memoire = m.memoire ? m.memoire.utilisee / m.memoire.totale : null;
  const disque = m.disque ? 1 - m.disque.libre / m.disque.total : null;
  const charge = m.charge ? m.charge.map((valeur) => valeur.toLocaleString("fr-FR", { maximumFractionDigits: 1 })).join(" · ") : null;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
      <Tuile icone={Cpu} libelle="Processeur" valeur={m.processeur === null ? "—" : <>{Math.round(m.processeur)} <Unite>%</Unite></>}>
        <Etincelle valeurs={m.derniereHeure.map((point) => point.processeur)} />
        <Detail>{m.coeurs} cœurs{charge ? ` · charge ${charge}` : ""}</Detail>
      </Tuile>
      <Tuile icone={MemoryStick} libelle="Mémoire" valeur={m.memoire ? formaterOctets(m.memoire.utilisee) : "—"}>
        {memoire !== null && <Jauge part={memoire} libelle="Mémoire utilisée" />}
        {m.memoire && <Detail>sur {formaterOctets(m.memoire.totale)} · {formaterPourcentage((memoire ?? 0) * 100)}{m.echange ? ` · échange ${formaterOctets(m.echange.utilise)} / ${formaterOctets(m.echange.total)}` : ""}</Detail>}
      </Tuile>
      <Tuile icone={HardDrive} libelle="Disque" valeur={m.disque ? <>{formaterOctets(m.disque.libre)} <Unite>libres</Unite></> : "—"}>
        {disque !== null && <Jauge part={disque} libelle="Disque rempli" />}
        {m.disque && <Detail>sur {formaterOctets(m.disque.total)} · {formaterPourcentage((disque ?? 0) * 100)} plein</Detail>}
      </Tuile>
      <Tuile icone={ArrowDownUp} libelle="Réseau" valeur={m.reseau?.envoye === null || m.reseau?.envoye === undefined ? "—" : <>{formaterDebit(m.reseau.envoye)} <Unite>↑</Unite></>}>
        <Etincelle valeurs={m.derniereHeure.map((point) => point.envoye)} />
        {m.reseau && <Detail>↓ {m.reseau.recu === null ? "—" : formaterDebit(m.reseau.recu)} · {formaterOctets(m.reseau.totalEnvoye)} envoyés depuis l'allumage</Detail>}
      </Tuile>
      <Tuile icone={Thermometer} libelle="Température" valeur={m.temperature === null ? "—" : <>{Math.round(m.temperature)} <Unite>°C</Unite></>}>
        {m.temperature !== null && <Jauge part={m.temperature / 100} libelle="Température du processeur" />}
        <Detail>{m.temperature === null ? "Pas de capteur lisible" : m.temperature >= SEUIL_TEMPERATURE ? "Il chauffe ! Alerte à 80 °C" : "Au frais (alerte à 80 °C)"}</Detail>
      </Tuile>
      <Tuile icone={Clock} libelle="Allumé depuis" valeur={m.allumeDepuis ? formaterTempsAllume(m.allumeDepuis) : "—"}>
        {m.allumeDepuis && <Detail>Redémarré le {formaterDate(m.allumeDepuis, true)}</Detail>}
      </Tuile>
    </div>
  );
}
