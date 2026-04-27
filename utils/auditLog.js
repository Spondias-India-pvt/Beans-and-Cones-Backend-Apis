const prisma = require("../config/prisma");

/**
 * Creates an audit log entry.
 * @param {object} params
 * @param {number} params.userId       - ID of the logged-in user
 * @param {string} params.username     - Username of the logged-in user
 * @param {string} params.action       - Action performed e.g. CREATE_BRANCH
 * @param {string} params.module       - Module e.g. BRANCH, EMPLOYEE, STOCK
 * @param {string|number} [params.referenceId] - ID of the affected record
 * @param {string} [params.details]    - Extra context e.g. "Created branch: NYC001"
 */
const createAuditLog = async ({ userId, username, action, module, referenceId = null, details = null }) => {
  try {
    await prisma.auditlog.create({
      data: {
        userId:      Number(userId),
        performedBy: username || "unknown",
        action,
        module,
        referenceId: referenceId ? String(referenceId) : null,
        details:     details    ? String(details)      : null,
      },
    });
  } catch (error) {
    console.error("Audit log error:", error.message);
  }
};

module.exports = { createAuditLog };
