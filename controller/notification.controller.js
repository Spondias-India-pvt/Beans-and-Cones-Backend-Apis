const svc = require("../service/notification.service");

const toInt = (v) => Number(v);

const getAllNotifications = async (req, res, next) => {
  try { return res.json({ success: true, data: await svc.getAllNotifications(req.query) }); } catch (e) { next(e); }
};

const createNotification = async (req, res, next) => {
  try {
    const notif = await svc.createNotification(req.body);
    return res.status(201).json({ success: true, message: "Notification created", data: notif });
  } catch (e) { next(e); }
};

const markAsRead = async (req, res, next) => {
  try {
    const notif = await svc.markAsRead(toInt(req.params.id));
    return res.json({ success: true, message: "Marked as read", data: notif });
  } catch (e) { next(e); }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await svc.markAllAsRead(req.query.branchId ? toInt(req.query.branchId) : null);
    return res.json({ success: true, message: "All notifications marked as read" });
  } catch (e) { next(e); }
};

const deleteNotification = async (req, res, next) => {
  try {
    await svc.deleteNotification(toInt(req.params.id));
    return res.json({ success: true, message: "Notification deleted" });
  } catch (e) { next(e); }
};

module.exports = { createNotification, getAllNotifications, markAsRead, markAllAsRead, deleteNotification };
