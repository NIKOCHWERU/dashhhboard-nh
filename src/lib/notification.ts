import { prisma } from "./prisma";

export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  link: string
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        link,
        isRead: false,
      },
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}

/**
 * Send a notification to a user by their email address
 */
export async function sendNotificationByEmail(
  email: string,
  title: string,
  message: string,
  link: string
) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await sendNotification(user.id, title, message, link);
    }
  } catch (error) {
    console.error("Failed to send notification by email:", error);
  }
}
