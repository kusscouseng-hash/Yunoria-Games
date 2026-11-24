import "server-only";
import { notFound } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "./session";

/**
 * Nur für Admins. Andere bekommen eine 404-Seite (verrät nicht, dass es den Bereich gibt).
 * Die eigentliche Absicherung passiert zusätzlich in der Datenbank (RLS + is_admin()).
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") notFound();
  return user;
}
