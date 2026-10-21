import { deflateSync } from "node:zlib";

export type OptionsPdfBureautique = {
  dansLesObjets?: string;
  dictionnaireObjets?: string;
  donneesObjets?: (clair: Buffer) => Buffer;
};

const melange = (taille: number, graine: number) => {
  const octets = Buffer.alloc(taille);
  let x = graine;
  for (let i = 0; i < taille; i++) {
    x = (x * 1103515245 + 12345) >>> 0;
    octets[i] = x >>> 24;
  }
  return octets;
};

const flux = (numero: number, dictionnaire: string, donnees: Buffer) =>
  Buffer.concat([Buffer.from(`${numero} 0 obj\r\n<<${dictionnaire}/Length ${donnees.length}>>stream\r\n`, "latin1"), donnees, Buffer.from("\r\nendstream\r\nendobj\r\n", "latin1")]);

export function fabriquerPdfBureautique(o: OptionsPdfBureautique = {}): Buffer {
  const objets = [
    "<</Type/Catalog/Pages 2 0 R/Lang(fr-FR)/MarkInfo<</Marked true>>/OpenAction[3 0 R/XYZ 0 842 0]/Metadata 12 0 R/ViewerPreferences<</DisplayDocTitle true>>>>",
    "<</Type/Pages/Count 1/Kids[3 0 R]>>",
    "<</Type/Page/Parent 2 0 R/MediaBox[0 0 595.32 841.92]/Contents 5 0 R/Annots[4 0 R 13 0 R]/Group<</Type/Group/S/Transparency/CS/DeviceRGB>>"
      + "/Resources<</Font<</F1 6 0 R>>/XObject<</Image7 7 0 R>>/ColorSpace<</CS0[/ICCBased 8 0 R]>>/ExtGState<</GS9 9 0 R>>>>/Tabs/S/StructParents 0>>",
    "<</Type/Annot/Subtype/Link/Rect[72 700 200 714]/BS<</W 0>>/F 4/A<</Type/Action/S/URI/URI(https://www.linkedin.com/in/malo-lefevre)>>/StructParent 1>>",
    "<</Type/Font/Subtype/TrueType/Name/F1/BaseFont/BCDEEE+Calibri/Encoding/WinAnsiEncoding/FontDescriptor 10 0 R/FirstChar 32/LastChar 122/Widths 11 0 R>>",
    "<</Type/ExtGState/BM/Normal/ca 1>>",
    "<</Type/FontDescriptor/FontName/BCDEEE+Calibri/Flags 32/ItalicAngle 0/Ascent 750/Descent -250/CapHeight 750/StemV 79/FontFile2 14 0 R>>",
    "[226 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 507 507 507 507 507 507 507 507 507 507]",
    "<</Type/Annot/Subtype/Link/Rect[72 680 200 694]/A<</S/GoTo/D[3 0 R/XYZ 0 600 0]>>/AA<</E<</S/GoTo/D[3 0 R/Fit]>>>>>>",
    ...(o.dansLesObjets ? [o.dansLesObjets] : []),
  ];
  const numeros = [1, 2, 3, 4, 6, 9, 10, 11, 13, ...(o.dansLesObjets ? [15] : [])];
  let entete = "";
  let corps = "";
  for (const [i, objet] of objets.entries()) {
    entete += `${numeros[i]} ${corps.length} `;
    corps += `${objet}\r\n`;
  }
  const clair = Buffer.from(entete + corps, "latin1");
  const dictionnaireObjets = o.dictionnaireObjets ?? `/Type/ObjStm/N ${objets.length}/First ${entete.length}/Filter/FlateDecode`;
  const contenu = deflateSync(Buffer.from("/P <</MCID 0>> BDC BT /F1 18 Tf 72 760 Td (Malo Lef\xe8vre, d\xe9veloppeur) Tj ET EMC\nq 64 0 0 64 400 700 cm /Image7 Do Q\n", "latin1"));
  const metadonnees = Buffer.from('<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><pdf:Producer xmlns:pdf="http://ns.adobe.com/pdf/1.3/">Microsoft® Word pour Microsoft 365</pdf:Producer></x:xmpmeta><?xpacket end="w"?>', "utf8");
  return Buffer.concat([
    Buffer.from("%PDF-1.7\r\n%\xb5\xb5\xb5\xb5\r\n", "latin1"),
    flux(5, "/Filter/FlateDecode", contenu),
    flux(7, "/Type/XObject/Subtype/Image/Width 64/Height 64/ColorSpace 8 0 R/BitsPerComponent 8/Interpolate false/Filter/FlateDecode/DecodeParms<</Predictor 15/Colors 3/Columns 64>>", deflateSync(melange(64 * 64 * 3 + 64, 7))),
    flux(8, "/N 3/Alternate/DeviceRGB/Filter/FlateDecode", deflateSync(melange(3144, 8))),
    flux(12, "/Type/Metadata/Subtype/XML", metadonnees),
    flux(14, "/Filter/FlateDecode/Length1 61000", deflateSync(melange(61_000, 14))),
    flux(16, dictionnaireObjets, o.donneesObjets ? o.donneesObjets(clair) : deflateSync(clair)),
    flux(17, "/Type/XRef/Size 18/W[1 4 2]/Root 1 0 R/Info 18 0 R/ID[<4E7A1C><4E7A1C>]/Filter/FlateDecode/DecodeParms<</Columns 7/Predictor 12>>", deflateSync(melange(18 * 8, 17))),
    Buffer.from("startxref\r\n4242\r\n%%EOF\r\n", "latin1"),
  ]);
}
