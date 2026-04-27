const prisma = require("../config/prisma");

const getSettings = async (branchId) => {
  const settings = await prisma.branch_settings.findUnique({
    where: { branchId },
    include: { branch: { select: { id: true, branchName: true, branchCode: true } } },
  });
  if (!settings) throw new Error("Branch settings not found. Create them first.");
  return settings;
};

const createOrUpdateSettings = async (branchId, data) => {
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) throw new Error("Branch not found");

  return await prisma.branch_settings.upsert({
    where: { branchId },
    update: {
      ...(data.currency         !== undefined && { currency:        data.currency }),
      ...(data.taxPercentage    !== undefined && { taxPercentage:   data.taxPercentage }),
      ...(data.serviceCharge    !== undefined && { serviceCharge:   data.serviceCharge }),
      ...(data.minOrderAmount   !== undefined && { minOrderAmount:  data.minOrderAmount }),
      ...(data.deliveryEnabled  !== undefined && { deliveryEnabled: data.deliveryEnabled }),
      ...(data.dineInEnabled    !== undefined && { dineInEnabled:   data.dineInEnabled }),
      ...(data.takeawayEnabled  !== undefined && { takeawayEnabled: data.takeawayEnabled }),
    },
    create: {
      branchId,
      currency:       data.currency       ?? "INR",
      taxPercentage:  data.taxPercentage  ?? 0,
      serviceCharge:  data.serviceCharge  ?? null,
      minOrderAmount: data.minOrderAmount ?? null,
      deliveryEnabled: data.deliveryEnabled ?? true,
      dineInEnabled:   data.dineInEnabled   ?? true,
      takeawayEnabled: data.takeawayEnabled ?? true,
    },
    include: { branch: { select: { id: true, branchName: true, branchCode: true } } },
  });
};

module.exports = { getSettings, createOrUpdateSettings };
