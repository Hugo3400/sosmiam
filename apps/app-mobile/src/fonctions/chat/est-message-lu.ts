const NOMBRE = /^\d+$/;

const sansZeros = (id: string) => id.replace(/^0+(?=\d)/, "");

export function estMessageLu(luJusqua: string, messageId: string, ordre: readonly string[]): boolean {
  if (NOMBRE.test(luJusqua) && NOMBRE.test(messageId)) {
    const lu = sansZeros(luJusqua);
    const message = sansZeros(messageId);
    return lu.length !== message.length ? lu.length > message.length : lu >= message;
  }
  const rangLu = ordre.indexOf(luJusqua);
  const rangMessage = ordre.indexOf(messageId);
  return rangLu >= 0 && rangMessage >= 0 && rangLu >= rangMessage;
}
