import { useCallback, useEffect, useState } from "react";

import { lireAstuceDoubleToucherVue, noterAstuceDoubleToucherVue } from "~/stockage/astuce-double-toucher";

export function utiliserAstuceDoubleToucher(): { visible: boolean; masquer: () => void } {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let actif = true;
    void lireAstuceDoubleToucherVue().then((vue) => {
      if (!actif || vue) return;
      setVisible(true);
      void noterAstuceDoubleToucherVue();
    });
    return () => {
      actif = false;
    };
  }, []);

  const masquer = useCallback(() => {
    setVisible(false);
    void noterAstuceDoubleToucherVue();
  }, []);

  return { visible, masquer };
}
