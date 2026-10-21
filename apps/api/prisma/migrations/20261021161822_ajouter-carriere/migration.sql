-- CreateTable
CREATE TABLE "offres_carriere" (
    "id" SERIAL NOT NULL,
    "titre" VARCHAR(120) NOT NULL,
    "type" VARCHAR(12) NOT NULL,
    "domaine" VARCHAR(20) NOT NULL,
    "resume" VARCHAR(300) NOT NULL,
    "description" TEXT NOT NULL,
    "missions" JSONB NOT NULL DEFAULT '[]',
    "profil" JSONB NOT NULL DEFAULT '[]',
    "en_echange" JSONB NOT NULL DEFAULT '[]',
    "lieu" VARCHAR(120) NOT NULL DEFAULT 'À distance, partout en France',
    "publiee_le" TIMESTAMPTZ(0),
    "fermee_le" TIMESTAMPTZ(0),
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offres_carriere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidatures_carriere" (
    "id" UUID NOT NULL,
    "offre_id" INTEGER NOT NULL,
    "nom_chiffre" VARCHAR(400) NOT NULL,
    "email_chiffre" VARCHAR(1200) NOT NULL,
    "email_empreinte" VARCHAR(64) NOT NULL,
    "message_chiffre" TEXT NOT NULL,
    "lien_chiffre" VARCHAR(1300),
    "cv_fichier" VARCHAR(64),
    "statut" VARCHAR(12) NOT NULL DEFAULT 'nouvelle',
    "cree_le" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lue_le" TIMESTAMPTZ(0),

    CONSTRAINT "candidatures_carriere_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "offres_carriere_publiee_le_idx" ON "offres_carriere"("publiee_le");

-- CreateIndex
CREATE UNIQUE INDEX "candidatures_carriere_cv_fichier_key" ON "candidatures_carriere"("cv_fichier");

-- CreateIndex
CREATE INDEX "candidatures_carriere_offre_id_cree_le_idx" ON "candidatures_carriere"("offre_id", "cree_le");

-- CreateIndex
CREATE INDEX "candidatures_carriere_cree_le_idx" ON "candidatures_carriere"("cree_le");

-- CreateIndex
CREATE INDEX "candidatures_carriere_email_empreinte_cree_le_idx" ON "candidatures_carriere"("email_empreinte", "cree_le");

-- AddForeignKey
ALTER TABLE "candidatures_carriere" ADD CONSTRAINT "candidatures_carriere_offre_id_fkey" FOREIGN KEY ("offre_id") REFERENCES "offres_carriere"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "offres_carriere" ("titre", "type", "domaine", "resume", "description", "missions", "profil", "en_echange", "lieu") VALUES
  ('Modération avec la Brigade', 'benevolat', 'moderation', 'Aide la Brigade à garder SOS Miam accueillant : tu relis ce que les Miamis signalent, depuis ton ordi, à ton rythme.', 'Sur SOS Miam, les Miamis donnent leur avis, partagent des photos et se retrouvent dans des restos, des bars et des pâtisseries indépendants. Pour que chacun s''y sente bien, la Brigade relit ce qui est signalé et veille au grain.

Tu lui donnes un coup de main depuis le logiciel de l''équipe, sur ton ordinateur, à ton rythme et sans minimum d''heures. Capitaine Bouiboui tient la barre ; toi, tu l''aides à garder le pont bien propre.', '["Relire les avis, photos et commentaires signalés par les Miamis","Décider avec la Brigade : on garde, on masque, ou on en parle ensemble","Repérer ce qui n''a rien à faire là : insultes, arnaques, pubs déguisées","Nous dire ce qui coince, et ce qui pourrait marcher mieux"]'::jsonb, '["Dès 18 ans, où que tu sois en France","Tu restes juste et bienveillant·e, même face à un commentaire grognon","Tu sais garder pour toi ce que tu lis : la discrétion, c''est sacré","Un ordinateur et un peu de temps quand tu veux, ça suffit"]'::jsonb, '["Un badge « Brigade » dans l''app et un rôle sur le Discord de SOS Miam","Une attestation de bénévolat","Ton nom au générique : sur la page « Merci à la Brigade » ou dans les crédits"]'::jsonb, 'À distance, partout en France'),
  ('Réseaux sociaux : TikTok, Instagram et Discord', 'benevolat', 'reseaux-sociaux', 'Fais briller les restos, bars et pâtisseries indépendants sur TikTok, Instagram et Discord, à ton rythme.', 'SOS Miam fait découvrir les lieux indépendants qui ont besoin de monde : des restos, des bars, des pâtisseries, et parfois des lieux qui traversent une vraie passe difficile. Sur TikTok, Instagram et notre Discord, on raconte leurs histoires et on fait vivre la communauté des Miamis.

Tu nous aides à le faire avec le ton de la maison : drôle, bienveillant, et toujours avec respect pour les lieux. À ton rythme, sans minimum d''heures.', '["Imaginer et préparer des publications pour TikTok et Instagram","Mettre en avant les lieux et les bons plans des Miamis","Animer le Discord avec la Brigade : accueillir, répondre, lancer des discussions","Proposer tes idées de formats, de tendances et de défis"]'::jsonb, '["Dès 18 ans, où que tu sois en France","TikTok et Instagram n''ont pas de secret pour toi","Tu écris avec humour et bienveillance, sans fautes qui piquent les yeux","Tu aimes les bonnes adresses autant que les gens qui les font vivre"]'::jsonb, '["Un badge « Brigade » dans l''app et un rôle sur le Discord de SOS Miam","Une attestation de bénévolat","Ton nom au générique : sur la page « Merci à la Brigade » ou dans les crédits"]'::jsonb, 'À distance, partout en France'),
  ('Graphisme et illustration', 'freelance', 'graphisme', 'Une mission sur devis pour donner des couleurs à SOS Miam : visuels, illustrations et supports pour les lieux.', 'SOS Miam a déjà son univers : Capitaine Bouiboui, les Miamis, du jaune, de la tomate et beaucoup d''appétit. On cherche des freelances pour des missions ponctuelles, dans le respect du kit de marque.

C''est une mission rémunérée, sur devis : pas de montant affiché, c''est toi qui proposes ton tarif.', '["Créer des visuels pour les réseaux sociaux, le site et l''app","Illustrer l''univers de SOS Miam : Capitaine Bouiboui, les Miamis et les lieux","Préparer des supports pour les restos, les bars et les pâtisseries : affiches, autocollants"]'::jsonb, '["Dès 18 ans, où que tu sois en France","Tu travailles en freelance","Tu as un portfolio à nous montrer : le lien du formulaire est fait pour ça","Tu sais suivre un kit de marque… et y glisser ta patte"]'::jsonb, '["Une mission rémunérée, sur devis : pas de montant affiché, c''est toi qui proposes ton tarif"]'::jsonb, 'À distance, partout en France'),
  ('Vidéo et montage', 'freelance', 'video', 'Une mission sur devis pour raconter SOS Miam en vidéo : formats courts, montage, sous-titres et du rythme.', 'Sur TikTok et Instagram, SOS Miam se raconte beaucoup en vidéo : les lieux, les Miamis et Capitaine Bouiboui. On cherche des freelances pour des missions ponctuelles de montage et de création vidéo.

C''est une mission rémunérée, sur devis : pas de montant affiché, c''est toi qui proposes ton tarif.', '["Monter des vidéos courtes et verticales pour TikTok et Instagram","Ajouter sous-titres, musique et petites animations","Préparer des vidéos qui présentent l''app"]'::jsonb, '["Dès 18 ans, où que tu sois en France","Tu travailles en freelance","Tu maîtrises un logiciel de montage et les formats verticaux","Tu as des vidéos à nous montrer : le lien du formulaire est fait pour ça"]'::jsonb, '["Une mission rémunérée, sur devis : pas de montant affiché, c''est toi qui proposes ton tarif"]'::jsonb, 'À distance, partout en France'),
  ('Développement web et mobile', 'freelance', 'developpement', 'Une mission sur devis pour coder avec nous : le site, l''app ou le serveur de SOS Miam, en TypeScript.', 'SOS Miam, c''est un site, une app iOS et Android et un serveur, le tout en TypeScript : React, React Native avec Expo, Node et PostgreSQL. On cherche des freelances pour des missions ponctuelles.

C''est une mission rémunérée, sur devis : pas de montant affiché, c''est toi qui proposes ton tarif.', '["Développer des fonctionnalités du site, de l''app ou du serveur","Corriger des bugs et rendre le tout plus rapide","Écrire des tests, parce qu''un Miami prévenu en vaut deux"]'::jsonb, '["Dès 18 ans, où que tu sois en France","Tu travailles en freelance","Tu es à l''aise avec TypeScript et React ; React Native, c''est un plus","Un GitHub ou des projets à nous montrer ? Le lien du formulaire est fait pour ça"]'::jsonb, '["Une mission rémunérée, sur devis : pas de montant affiché, c''est toi qui proposes ton tarif"]'::jsonb, 'À distance, partout en France');
