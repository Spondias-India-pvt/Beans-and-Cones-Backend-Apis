const prisma = require("../config/prisma");

const createVipPlan = async (data) => {
  const existing = await prisma.vip_plan.findUnique({ where: { name: data.name } });
  if (existing) throw new Error("VIP plan with this name already exists");
  return await prisma.vip_plan.create({ data });
};

const getAllVipPlans = async () => {
  return await prisma.vip_plan.findMany({ where: { isActive: true }, orderBy: { price: "asc" } });
};

const getVipPlanById = async (id) => {
  const plan = await prisma.vip_plan.findUnique({ where: { id } });
  if (!plan) throw new Error("VIP plan not found");
  return plan;
};

const updateVipPlan = async (id, data) => {
  await getVipPlanById(id);
  return await prisma.vip_plan.update({ where: { id }, data });
};

const deleteVipPlan = async (id) => {
  await getVipPlanById(id);
  return await prisma.vip_plan.update({ where: { id }, data: { isActive: false } });
};

module.exports = { createVipPlan, getAllVipPlans, getVipPlanById, updateVipPlan, deleteVipPlan };
