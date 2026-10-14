/**
 * Adresse e-mail masquée, pour la montrer sans la dévoiler : la première lettre, « *** », puis le domaine entier
 * (« camille@gmail.com » → « c***@gmail.com »). Sans « @ », rien que « *** ».
 */
export function masquerEmail(email: string): string {
  const arobase = email.lastIndexOf("@");
  if (arobase < 1) return "***";
  return `${Array.from(email.slice(0, arobase))[0]}***${email.slice(arobase)}`;
}
