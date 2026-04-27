const prisma = require("../config/prisma");

// ─── Get or create active cart ────────────────────────────────────────────────

const getOrCreateCart = async ({ customerId, guestToken, branchId }) => {
  const where = customerId
    ? { customerId: Number(customerId), branchId: Number(branchId), status: "ACTIVE" }
    : { guestToken, branchId: Number(branchId), status: "ACTIVE" };

  let cart = await prisma.cart.findFirst({
    where,
    include: {
      items: { include: { product: { select: { id: true, name: true } } } },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        customerId: customerId ? Number(customerId) : null,
        guestToken: guestToken ?? null,
        branchId:   Number(branchId),
        status:     "ACTIVE",
      },
      include: { items: true },
    });
  }

  return cart;
};

// ─── Add item to cart ─────────────────────────────────────────────────────────

const addToCart = async ({ customerId, guestToken, branchId, productId, variantId, quantity }) => {
  const cart = await getOrCreateCart({ customerId, guestToken, branchId });

  const product = await prisma.product.findUnique({
    where:   { id: Number(productId) },
    include: { variants: true },
  });
  if (!product || !product.isActive) throw new Error("Product not found or inactive");

  let price = 0;
  if (variantId) {
    const variant = product.variants.find((v) => v.id === Number(variantId) && v.isActive);
    if (!variant) throw new Error("Variant not found");
    price = Number(variant.price);
  } else {
    const defaultVariant = product.variants.find((v) => v.isActive);
    if (!defaultVariant) throw new Error("Product has no active variants");
    price = Number(defaultVariant.price);
  }

  // Check if item already in cart — update quantity
  const existing = await prisma.cart_item.findFirst({
    where: { cartId: cart.id, productId: Number(productId), variantId: variantId ? Number(variantId) : null },
  });

  if (existing) {
    await prisma.cart_item.update({
      where: { id: existing.id },
      data:  { quantity: existing.quantity + quantity, price },
    });
  } else {
    await prisma.cart_item.create({
      data: {
        cartId:    cart.id,
        productId: Number(productId),
        variantId: variantId ? Number(variantId) : null,
        quantity,
        price,
      },
    });
  }

  return await getCartDetails(cart.id);
};

// ─── Update item quantity ─────────────────────────────────────────────────────

const updateCartItem = async (cartItemId, quantity) => {
  if (quantity <= 0) {
    return await prisma.cart_item.delete({ where: { id: cartItemId } });
  }
  return await prisma.cart_item.update({ where: { id: cartItemId }, data: { quantity } });
};

// ─── Remove item ──────────────────────────────────────────────────────────────

const removeFromCart = async (cartItemId) => {
  return await prisma.cart_item.delete({ where: { id: cartItemId } });
};

// ─── Apply coupon to cart ─────────────────────────────────────────────────────

const applyCouponToCart = async (cartId, couponCode) => {
  const cart = await prisma.cart.findUnique({ where: { id: cartId } });
  if (!cart) throw new Error("Cart not found");

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (!coupon || !coupon.isActive) throw new Error("Invalid or expired coupon");
    if (coupon.expiresAt && new Date() > coupon.expiresAt) throw new Error("Coupon has expired");
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new Error("Coupon usage limit reached");
  }

  return await prisma.cart.update({
    where: { id: cartId },
    data:  { couponCode: couponCode ?? null },
    include: { items: { include: { product: { select: { id: true, name: true } } } } },
  });
};

// ─── Clear cart ───────────────────────────────────────────────────────────────

const clearCart = async (cartId) => {
  await prisma.cart_item.deleteMany({ where: { cartId } });
  return await prisma.cart.update({ where: { id: cartId }, data: { couponCode: null } });
};

// ─── Get cart with totals ─────────────────────────────────────────────────────

const getCartDetails = async (cartId) => {
  const cart = await prisma.cart.findUnique({
    where:   { id: cartId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!cart) throw new Error("Cart not found");

  const subtotal = cart.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  return { ...cart, subtotal };
};

module.exports = { getOrCreateCart, addToCart, updateCartItem, removeFromCart, applyCouponToCart, clearCart, getCartDetails };
