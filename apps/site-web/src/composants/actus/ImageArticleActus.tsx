import { useEffect, useRef, useState } from "react";

type Props = { adresse: string; alt?: string; largeur: number; hauteur: number; className?: string };

export function ImageArticleActus({ adresse, alt = "", largeur, hauteur, className = "" }: Props) {
  const image = useRef<HTMLImageElement>(null);
  const [enPanne, setEnPanne] = useState(false);

  useEffect(() => {
    const element = image.current;
    setEnPanne(Boolean(element?.complete && element.naturalWidth === 0));
  }, [adresse]);

  if (enPanne) return null;
  return <img ref={image} src={adresse} alt={alt} width={largeur} height={hauteur} loading="lazy" decoding="async" onError={() => setEnPanne(true)} className={className} />;
}
