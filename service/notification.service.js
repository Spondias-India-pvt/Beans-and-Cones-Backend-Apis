const prisma = require("../config/prisma");

const createNotification = async ({ title, message, type, branchId }) => {
  return await prisma.notification.create({
    data: {
      title,
      message,
      type,
      branchId: branchId ? Number(branchId) : null,
      isRead:   false,
    },
  });
};

const getAllNotifications = async (filters = {}) => {
  const where = {};
  if (filters.branchId !== undefined) where.branchId = Number(filters.branchId);
  if (filters.isRead   !== undefined) where.isRead   = filters.isRead === "true";
  if (filters.type)                   where.type     = filters.type;

  return await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
};

const markAsRead = async (id) => {
  const notif = await prisma.notification.findUnique({ where: { id } });
  if (!notif) throw new Error("Notification not found");
  return await prisma.notification.update({ where: { id }, data: { isRead: true } });
};

const markAllAsRead = async (branchId) => {
  return await prisma.notification.updateMany({
    where: { branchId: branchId ? Number(branchId) : undefined, isRead: false },
    data:  { isRead: true },
  });
};

const deleteNotification = async (id) => {
  const notif = await prisma.notification.findUnique({ where: { id } });
  if (!notif) throw new Error("Notification not found");
  return await prisma.notification.delete({ where: { id } });
};

module.exports = { createNotification, getAllNotifications, markAsRead, markAllAsRead, deleteNotification };
