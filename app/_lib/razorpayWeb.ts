/**
 * Web Razorpay checkout helpers.
 * Used when the backend serves a full checkout page (checkoutUrl) and we load it
 * in a WebView or browser. Success redirects typically include payment_id in the URL.
 */

/** Common query param names backends use for Razorpay payment ID on success redirect */
const PAYMENT_ID_PARAMS = ["payment_id", "paymentId", "razorpay_payment_id"];

/**
 * Parses Razorpay payment ID from a success/redirect URL.
 * Handles: ?payment_id=pay_xxx, ?paymentId=pay_xxx, #payment_id=pay_xxx, and path segments.
 */
export function parsePaymentIdFromUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  try {
    const u = url.trim();
    const hashIndex = u.indexOf("#");
    const queryIndex = u.indexOf("?");
    const search = queryIndex >= 0 ? u.slice(queryIndex) : hashIndex >= 0 ? u.slice(hashIndex) : "";
    if (!search) return null;
    const params = new URLSearchParams(search.startsWith("#") ? search.slice(1) : search);
    for (const key of PAYMENT_ID_PARAMS) {
      const value = params.get(key);
      if (value && /^pay_[A-Za-z0-9]+/.test(value)) return value;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Optional: build a success redirect URL to pass to the backend when creating the order.
 * Backend can use this as the return URL after payment. Format is app-specific.
 */
export function getSuccessRedirectBase(): string {
  return "kolkatajobhub://payment-success";
}
