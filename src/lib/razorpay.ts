import Razorpay from "razorpay";

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn("Razorpay keys not configured. Payment features will not work.");
}

export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

/** Razorpay Plan IDs (created in Razorpay Dashboard → Subscriptions → Plans) */
export const RAZORPAY_PLANS: Record<string, string> = {
    pro: process.env.RAZORPAY_PLAN_PRO || "",
    team: process.env.RAZORPAY_PLAN_TEAM || "",
};

export function getRazorpayPlanId(plan: string): string | null {
    return RAZORPAY_PLANS[plan] || null;
}
