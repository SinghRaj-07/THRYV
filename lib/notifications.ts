import { adminDb } from "@/lib/supabase";
export async function createNotification(userId: string | null | undefined, actorId: string, kind: string, entityId?: string) {
  if (!userId || userId === actorId) return;
  try { await adminDb().from("notifications").insert({ user_id: userId, actor_id: actorId, kind, entity_id: entityId || null }); }
  catch { /* Notifications must never block the primary action. */ }
}
