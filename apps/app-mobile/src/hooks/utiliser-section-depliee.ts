import { useCallback, useEffect, useRef, useState } from "react";

import {
  enregistrerSectionDepliee,
  type IdSectionPliable,
  lireSectionDepliee,
  lireSectionDeplieeEnMemoire,
} from "~/stockage/sections-depliees";

export function utiliserSectionDepliee(section: IdSectionPliable): { deplie: boolean; basculer: () => boolean } {
  const [deplie, setDeplie] = useState(() => lireSectionDeplieeEnMemoire(section) ?? false);
  const choisiIci = useRef(false);

  useEffect(() => {
    let actif = true;
    lireSectionDepliee(section)
      .then((lu) => {
        if (actif && !choisiIci.current) setDeplie(lu);
      })
      .catch(() => {});
    return () => {
      actif = false;
    };
  }, [section]);

  const basculer = useCallback(() => {
    const nouveau = !deplie;
    choisiIci.current = true;
    setDeplie(nouveau);
    enregistrerSectionDepliee(section, nouveau).catch(() => {});
    return nouveau;
  }, [deplie, section]);

  return { deplie, basculer };
}
