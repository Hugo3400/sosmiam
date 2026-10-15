type Effacees = { ids: readonly string[]; jusqua: string | null };

export function retirerNotificationsEffacees<T extends { id: string; date: string }>(notifications: T[], { ids, jusqua }: Effacees): T[] {
  if (ids.length === 0 && jusqua === null) return notifications;
  const parId = new Set(ids);
  return notifications.filter((n) => !parId.has(n.id) && (jusqua === null || n.date > jusqua));
}
