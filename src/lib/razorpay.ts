import Razorpay from "razorpay";

let _razorpay: Razorpay | null = null;

/** Lazily initialize Razorpay so the build doesn't crash when env vars are missing */
export function getRazorpay(): Razorpay {
    if (!_razorpay) {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            throw new Error("Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
        }

        _razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });
    }
    return _razorpay;
}

/** Razorpay Plan IDs (created in Razorpay Dashboard → Subscriptions → Plans) */
export const RAZORPAY_PLANS: Record<string, string> = {
    pro: process.env.RAZORPAY_PLAN_PRO || "",
    team: process.env.RAZORPAY_PLAN_TEAM || "",
};

export function getRazorpayPlanId(plan: string): string | null {
    return RAZORPAY_PLANS[plan] || null;
}
