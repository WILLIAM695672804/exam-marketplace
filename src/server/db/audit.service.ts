import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@prisma/client";

export const auditService = {
  async log(params: {
    userId?: string;
    action: AuditAction;
    resource?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, unknown>;
  }) {
    return prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        details: params.details as object,
      },
    });
  },

  logLogin(userId: string) {
    return this.log({ userId, action: "LOGIN", resource: "auth" });
  },

  logLogout(userId: string) {
    return this.log({ userId, action: "LOGOUT", resource: "auth" });
  },

  logCreate(userId: string, resource: string, resourceId: string) {
    return this.log({ userId, action: "CREATE", resource, resourceId });
  },

  logUpdate(userId: string, resource: string, resourceId: string) {
    return this.log({ userId, action: "UPDATE", resource, resourceId });
  },

  logDelete(userId: string, resource: string, resourceId: string) {
    return this.log({ userId, action: "DELETE", resource, resourceId });
  },

  logDownload(userId: string, resourceId: string) {
    return this.log({ userId, action: "DOWNLOAD", resource: "download", resourceId });
  },

  logPayment(userId: string, resourceId: string) {
    return this.log({ userId, action: "PAYMENT_SUCCEEDED", resource: "payment", resourceId });
  },

  logRoleChange(userId: string, resourceId: string, details: Record<string, unknown>) {
    return this.log({ userId, action: "ROLE_CHANGE", resource: "role", resourceId, details });
  },
};
