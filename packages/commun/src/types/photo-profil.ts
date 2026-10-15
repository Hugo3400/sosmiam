export type AvatarPhoto = `photo:${string}.jpg`;

export type AvatarPublic = AvatarPhoto | `miami:${string}` | string | null;

export type PhotoProfilEnvoyee = { avatar: AvatarPhoto };

export type PhotoProfilRetiree = { avatar: string | null };
