const svc = require("../service/cart.service");

const toInt = (v) => Number(v);

const getCart = async (req, res, next) => {
  try {
    const { branchId, guestToken } = req.query;
    const customerId = req.customer?.id ?? null;
    const cart = await svc.getOrCreateCart({ customerId, guestToken, branchId });
    return res.json({ success: true, data: await svc.getCartDetails(cart.id) });
  } catch (e) { next(e); }
};

const addToCart = async (req, res, next) => {
  try {
    const customerId = req.customer?.id ?? null;
    const { guestToken, branchId, productId, variantId, quantity } = req.body;
    const cart = await svc.addToCart({ customerId, guestToken, branchId, productId, variantId, quantity });
    return res.json({ success: true, message: "Item added to cart", data: cart });
  } catch (e) { next(e); }
};

const updateCartItem = async (req, res, next) => {
  try {
    await svc.updateCartItem(toInt(req.params.itemId), req.body.quantity);
    return res.json({ success: true, message: "Cart item updated" });
  } catch (e) { next(e); }
};

const removeFromCart = async (req, res, next) => {
  try {
    await svc.removeFromCart(toInt(req.params.itemId));
    return res.json({ success: true, message: "Item removed from cart" });
  } catch (e) { next(e); }
};

const applyCoupon = async (req, res, next) => {
  try {
    const cart = await svc.applyCouponToCart(toInt(req.params.cartId), req.body.couponCode);
    return res.json({ success: true, message: "Coupon applied", data: cart });
  } catch (e) { next(e); }
};

const clearCart = async (req, res, next) => {
  try {
    await svc.clearCart(toInt(req.params.cartId));
    return res.json({ success: true, message: "Cart cleared" });
  } catch (e) { next(e); }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, applyCoupon, clearCart };
