import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/** Razorpay sends webhook events here — we verify the signature */
export async function POST(request: Request) {
    try {
        const signature = request.headers.get("x-razorpay-signature");

        if (!signature) {
            return NextResponse.json({ error: "Missing signature" }, { status: 400 });
        }

        const rawBody = await request.text();

        // Verify webhook signature
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(rawBody)
            .digest("hex");

        if (expectedSignature !== signature) {
            console.error("Webhook signature mismatch");
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        const event = JSON.parse(rawBody);
        const eventName = event.event;
        console.log(`[Razorpay Webhook] ${eventName}`);

        switch (eventName) {
            case "subscription.activated": {
                const subscription = event.payload.subscription.entity;
                const notes = subscription.notes || {};

                const userId: string | undefined = notes.user_id;
                const plan: string | undefined = notes.plan;

                if (!userId || !plan) {
                    console.error("Missing userId or plan in notes for subscription.activated");
                    break;
                }

                const now = new Date();
                const periodEnd = new Date(now);
                periodEnd.setMonth(periodEnd.getMonth() + 1);

                await prisma.subscription.upsert({
                    where: { userId },
                    create: {
                        userId,
                        plan,
                        status: "active",
                        razorpaySubscriptionId: subscription.id,
                        razorpayCustomerId: subscription.customer_id || null,
                        razorpayPlanId: subscription.plan_id || null,
                        analysesUsedThisMonth: 0,
                        currentPeriodStart: now,
                        currentPeriodEnd: periodEnd,
                    },
                    update: {
                        plan,
                        status: "active",
                        razorpaySubscriptionId: subscription.id,
                        razorpayCustomerId: subscription.customer_id || null,
                        razorpayPlanId: subscription.plan_id || null,
                        analysesUsedThisMonth: 0,
                        currentPeriodStart: now,
                        currentPeriodEnd: periodEnd,
                    },
                });
                break;
            }

            case "subscription.charged": {
                // Recurring payment successful — reset usage for new period
                const subscription = event.payload.subscription.entity;

                const now = new Date();
                const periodEnd = new Date(now);
                periodEnd.setMonth(periodEnd.getMonth() + 1);

                await prisma.subscription.updateMany({
                    where: { razorpaySubscriptionId: subscription.id },
                    data: {
                        status: "active",
                        analysesUsedThisMonth: 0,
                        currentPeriodStart: now,
                        currentPeriodEnd: periodEnd,
                    },
                });
                break;
            }

            case "subscription.halted":
            case "subscription.paused": {
                const subscription = event.payload.subscription.entity;

                await prisma.subscription.updateMany({
                    where: { razorpaySubscriptionId: subscription.id },
                    data: { status: "past_due" },
                });
                break;
            }

            case "subscription.cancelled": {
                const subscription = event.payload.subscription.entity;

                await prisma.subscription.updateMany({
                    where: { razorpaySubscriptionId: subscription.id },
                    data: {
                        plan: "starter",
                        status: "cancelled",
                        razorpaySubscriptionId: null,
                        razorpayCustomerId: null,
                        razorpayPlanId: null,
                    },
                });
                break;
            }

            default:
                console.log(`[Razorpay Webhook] Unhandled event: ${eventName}`);
        }

        return NextResponse.json({ status: "ok" });
    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 }
        );
    }
}
