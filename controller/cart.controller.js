const cartSvc  = require("../service/cart.service");
const orderSvc = require("../service/order.service");

const toInt = (v) => Number(v);

// ─── Get cart ─────────────────────────────────────────────────────────────────

const getCart = async (req, res, next) => {
  try {
    const { branchId, guestToken } = req.query;
    const customerId = req.customer?.id ?? null;
    const cart = await cartSvc.getOrCreateCart({ customerId, guestToken, branchId });
    return res.json({ success: true, data: await cartSvc.getCartDetails(cart.id) });
  } catch (e) { next(e); }
};

// ─── Add item to cart ─────────────────────────────────────────────────────────

const addToCart = async (req, res, next) => {
  try {
    const customerId = req.customer?.id ?? null;
    const { guestToken, branchId, productId, variantId, quantity } = req.body;

    // If no customer token and no guestToken, warn but allow as guest
    if (!customerId && !guestToken) {
      return res.status(400).json({
        success: false,
        message: "Either login as a customer (send customer token) or provide a guestToken",
      });
    }

    const cart = await cartSvc.addToCart({ customerId, guestToken, branchId, productId, variantId, quantity });
    return res.json({ success: true, message: "Item added to cart", data: cart });
  } catch (e) { next(e); }
};

// ─── Update cart item quantity ────────────────────────────────────────────────

const updateCartItem = async (req, res, next) => {
  try {
    await cartSvc.updateCartItem(toInt(req.params.itemId), req.body.quantity);
    return res.json({ success: true, message: "Cart item updated" });
  } catch (e) { next(e); }
};

// ─── Remove item from cart ────────────────────────────────────────────────────

const removeFromCart = async (req, res, next) => {
  try {
    await cartSvc.removeFromCart(toInt(req.params.itemId));
    return res.json({ success: true, message: "Item removed from cart" });
  } catch (e) { next(e); }
};

// ─── Apply coupon to cart ─────────────────────────────────────────────────────

const applyCoupon = async (req, res, next) => {
  try {
    const cart = await cartSvc.applyCouponToCart(toInt(req.params.cartId), req.body.couponCode);
    return res.json({ success: true, message: "Coupon applied", data: cart });
  } catch (e) { next(e); }
};

// ─── Remove coupon from cart ──────────────────────────────────────────────────

const removeCoupon = async (req, res, next) => {
  try {
    const cart = await cartSvc.applyCouponToCart(toInt(req.params.cartId), null);
    return res.json({ success: true, message: "Coupon removed", data: cart });
  } catch (e) { next(e); }
};

// ─── Clear cart ───────────────────────────────────────────────────────────────

const clearCart = async (req, res, next) => {
  try {
    await cartSvc.clearCart(toInt(req.params.cartId));
    return res.json({ success: true, message: "Cart cleared" });
  } catch (e) { next(e); }
};

// ─── CHECKOUT FROM CART ───────────────────────────────────────────────────────
// Customer adds items to cart, then checks out all at once

const checkoutFromCart = async (req, res, next) => {
  try {
    const cartId = toInt(req.params.cartId);
    const { orderType, loyaltyPointsToRedeem, notes } = req.body;

    // Build order data from cart
    const cartData = await cartSvc.checkoutFromCart(cartId, { loyaltyPointsToRedeem, notes });

    // Override orderType if provided
    if (orderType) cartData.orderType = orderType;

    // If logged-in customer, inject their ID from token
    if (req.customer) cartData.customerId = req.customer.id;

    const order = await orderSvc.checkout(cartData);
    return res.status(201).json({ success: true, message: "Order placed from cart", data: order });
  } catch (e) { next(e); }
};

// ─── BUY NOW (direct checkout — skip cart) ───────────────────────────────────
// Customer clicks "Buy Now" on a single product — goes straight to order

const buyNow = async (req, res, next) => {
  try {
    const {
      branchId, orderType,
      productId, variantId, quantity,
      couponCode, loyaltyPointsToRedeem, notes,
    } = req.body;

    // Build a single-item order directly
    const orderData = {
      branchId,
      orderType:  orderType || "TAKEAWAY",
      customerId: req.customer?.id ?? null,
      guestToken: req.body.guestToken ?? null,
      customerName:  req.body.customerName  ?? null,
      customerPhone: req.body.customerPhone ?? null,
      items: [{ productId, variantId, quantity: quantity || 1 }],
      couponCode:            couponCode            ?? null,
      loyaltyPointsToRedeem: loyaltyPointsToRedeem ?? 0,
      notes: notes ?? null,
    };

    const order = await orderSvc.checkout(orderData);
    return res.status(201).json({ success: true, message: "Order placed", data: order });
  } catch (e) { next(e); }
};

module.exports = {
  getCart, addToCart, updateCartItem, removeFromCart,
  applyCoupon, removeCoupon, clearCart,
  checkoutFromCart, buyNow,
};
