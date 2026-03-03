import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRazorpay, getRazorpayPlanId } from "@/lib/razorpay";
import type { PlanType } from "@/lib/plans";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id || !session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { plan } = await request.json();

        if (!plan || !["pro", "team"].includes(plan)) {
            return NextResponse.json(
                { error: "Invalid plan. Must be pro or team." },
                { status: 400 }
            );
        }

        const planId = getRazorpayPlanId(plan as PlanType);
        if (!planId) {
            return NextResponse.json(
                { error: "Plan not configured. Contact support." },
                { status: 500 }
            );
        }

        // Create Razorpay Subscription
        const subscription = await getRazorpay().subscriptions.create({
            plan_id: planId,
            total_count: 12, // 12 billing cycles (1 year max)
            quantity: 1,
            notes: {
                user_id: session.user.id,
                user_email: session.user.email,
                plan,
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                subscriptionId: subscription.id,
                shortUrl: subscription.short_url, // fallback payment link
            },
        });
    } catch (error) {
        console.error("Razorpay create subscription error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create subscription" },
            { status: 500 }
        );
    }
}
