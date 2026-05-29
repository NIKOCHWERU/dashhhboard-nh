import { prisma } from "./prisma";

export async function logActivity(
  userId: string | null,
  userName: string | null,
  action: string,
  target: string,
  details: string
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        userName,
        action,
        target,
        details,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
