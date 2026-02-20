type RazorpaySuccessPayload = {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};

type RazorpayDismissed = { code: "dismissed" };

declare global {
  interface Window {
    Razorpay?: any;
  }
}

let loaderPromise: Promise<void> | null = null;

export function loadRazorpayCheckoutJs(): Promise<void> {
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<void>((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("Razorpay Checkout JS can only be loaded in a browser"));
      return;
    }

    const existing = document.getElementById("razorpay-checkout-js") as HTMLScriptElement | null;
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay Checkout JS"));
    document.body.appendChild(script);
  });

  return loaderPromise;
}

export async function openRazorpayWebCheckout(
  options: Record<string, any>
): Promise<RazorpaySuccessPayload> {
  await loadRazorpayCheckoutJs();

  if (typeof window === "undefined" || !window.Razorpay) {
    throw new Error("Razorpay Checkout JS is unavailable");
  }

  return await new Promise<RazorpaySuccessPayload>((resolve, reject) => {
    const rzp = new window.Razorpay({
      ...options,
      handler: (resp: RazorpaySuccessPayload) => resolve(resp),
      modal: {
        ondismiss: () => reject({ code: "dismissed" } satisfies RazorpayDismissed),
      },
    });

    if (rzp && typeof rzp.on === "function") {
      rzp.on("payment.failed", (resp: any) => reject(resp));
    }

    try {
      rzp.open();
    } catch (e) {
      reject(e);
    }
  });
}

