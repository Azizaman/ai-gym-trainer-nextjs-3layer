import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpay } from "@/lib/razorpay";
import crypto from "crypto";

/**
 * POST — Verify Razorpay payment after checkout and activate subscription.
 * This runs immediately after the client-side checkout completes,
 * so the plan updates instantly without waiting for webhooks.
 */
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const {
            razorpay_payment_id,
            razorpay_subscription_id,
            razorpay_signature,
            plan,
        } = await request.json();

        if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature || !plan) {
            return NextResponse.json(
                { error: "Missing payment verification details" },
                { status: 400 }
            );
        }

        // Verify signature: HMAC SHA256 of (payment_id + "|" + subscription_id)
        const keySecret = process.env.RAZORPAY_KEY_SECRET!;
        const generatedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            console.error("Payment signature verification failed");
            return NextResponse.json(
                { error: "Payment verification failed" },
                { status: 400 }
            );
        }

        // Fetch subscription details from Razorpay to confirm status
        let rzpSubscription;
        try {
            rzpSubscription = await getRazorpay().subscriptions.fetch(razorpay_subscription_id);
        } catch (err) {
            console.error("Failed to fetch Razorpay subscription:", err);
        }

        // Activate the subscription in our database
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        await prisma.subscription.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id,
                plan,
                status: "active",
                razorpaySubscriptionId: razorpay_subscription_id,
                razorpayCustomerId: (rzpSubscription as unknown as Record<string, string>)?.customer_id || null,
                razorpayPlanId: (rzpSubscription as unknown as Record<string, string>)?.plan_id || null,
                analysesUsedThisMonth: 0,
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
            },
            update: {
                plan,
                status: "active",
                razorpaySubscriptionId: razorpay_subscription_id,
                razorpayCustomerId: (rzpSubscription as unknown as Record<string, string>)?.customer_id || null,
                razorpayPlanId: (rzpSubscription as unknown as Record<string, string>)?.plan_id || null,
                analysesUsedThisMonth: 0,
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Subscription activated successfully",
        });
    } catch (error) {
        console.error("Payment verification error:", error);
        return NextResponse.json(
            { success: false, error: "Payment verification failed" },
            { status: 500 }
        );
    }
}
