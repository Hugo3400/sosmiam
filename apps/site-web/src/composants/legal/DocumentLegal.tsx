import { BlocsTexte } from "~/composants/interface/BlocsTexte";
import type { DocumentLegal as Document } from "~/contenus/legal/type-legal";

/** Une page légale : titre, date de mise à jour, sommaire et sections. */
export function DocumentLegal({ document }: { document: Document }) {
  return (
    <article className="mx-auto w-[min(760px,100%-32px)] py-12 md:py-16">
      <h1 className="text-[clamp(2rem,4vw,2.8rem)] font-extrabold tracking-tight">{document.titre}</h1>
      <p className="mt-2 text-sm text-gris">Dernière mise à jour : {document.miseAJour}</p>

      <div className="mt-8 grid gap-4 text-lg">
        <BlocsTexte blocs={document.introduction} />
      </div>

      <nav aria-label="Sommaire" className="mt-8 rounded-carte border-2 border-encre bg-white p-6">
        <p className="mb-3 font-titre font-extrabold">Sommaire</p>
        <ol className="grid list-decimal gap-1.5 pl-6">
          {document.sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre">{section.titre}</a>
            </li>
          ))}
        </ol>
      </nav>

      {document.sections.map((section, i) => (
        <section key={section.id} id={section.id} className="mt-10">
          <h2 className="mb-4 text-2xl font-extrabold">{i + 1}. {section.titre}</h2>
          <div className="grid gap-4 text-gris [&_strong]:text-encre">
            <BlocsTexte blocs={section.blocs} />
          </div>
        </section>
      ))}
    </article>
  );
}
