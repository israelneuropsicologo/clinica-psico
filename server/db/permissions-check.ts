import { getDb } from "../db.js";
import { internalUsers, roles, rolePermissions, permissions } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";

/**
 * Verifica se um usuário interno tem uma permissão específica
 */
export async function hasPermission(
  userId: number,
  permissionName: string
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Buscar usuário
    const user = await db
      .select()
      .from(internalUsers)
      .where(eq(internalUsers.id, userId))
      .limit(1);

    if (!user || user.length === 0) return false;

    // Buscar role do usuário
    const userRole = await db
      .select()
      .from(roles)
      .where(eq(roles.id, user[0].roleId))
      .limit(1);

    if (!userRole || userRole.length === 0) return false;

    // Buscar permissão
    const perm = await db
      .select()
      .from(permissions)
      .where(eq(permissions.name, permissionName))
      .limit(1);

    if (!perm || perm.length === 0) return false;

    // Verificar se role tem essa permissão
    const hasRolePermission = await db
      .select()
      .from(rolePermissions)
      .where(
        eq(rolePermissions.roleId, userRole[0].id)
      )
      .limit(1);

    return hasRolePermission && hasRolePermission.length > 0;
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

/**
 * Obtém todas as permissões de um usuário
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    // Buscar usuário
    const user = await db
      .select()
      .from(internalUsers)
      .where(eq(internalUsers.id, userId))
      .limit(1);

    if (!user || user.length === 0) return [];

    // Buscar todas as permissões do role
    const userPermissions = await db
      .select({
        name: permissions.name,
      })
      .from(rolePermissions)
      .innerJoin(
        permissions,
        eq(rolePermissions.permissionId, permissions.id)
      )
      .where(eq(rolePermissions.roleId, user[0].roleId)) as any;

    return userPermissions.map((p: any) => p.name);
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return [];
  }
}

/**
 * Obtém informações do role de um usuário
 */
export async function getUserRole(userId: number) {
  try {
    const db = await getDb();
    if (!db) return null;

    const user = await db
      .select()
      .from(internalUsers)
      .where(eq(internalUsers.id, userId))
      .limit(1);

    if (!user || user.length === 0) return null;

    const userRole = await db
      .select()
      .from(roles)
      .where(eq(roles.id, user[0].roleId))
      .limit(1);

    return userRole && userRole.length > 0 ? userRole[0] : null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
}
