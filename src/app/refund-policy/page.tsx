import React from "react";

export default function RefundPolicy() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#07070a] px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
            <div className="mx-auto max-w-3xl prose prose-zinc dark:prose-invert">
                <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl mb-8">
                    Refund Policy
                </h1>

                <p className="text-sm text-zinc-500 mb-8">Last Updated: March 2026</p>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">1. General Policy</h2>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        At FormAI, we stand behind the quality of our AI workout analysis. However, given the digital nature of our service and the computational resources required for video processing, we offer refunds only under specific conditions outlined below.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">2. Subscription Plans</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                        For subscriptions purchased directly through our website (Pro and Team plans):
                    </p>
                    <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2 mt-4">
                        <li><strong>Initial Purchase:</strong> You may request a full refund within 14 days of your initial purchase, provided you have not exceeded limits of video analysis on your plan.</li>
                        <li><strong>Renewals:</strong> Subscription renewals are not generally refundable. You may cancel your subscription at any time to prevent future charges.</li>
                        <li><strong>Proration:</strong> We do not offer prorated refunds for canceled subscriptions mid-billing cycle. You will retain access to the paid features until the end of the current billing period.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">3. Exceptional Circumstances</h2>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        We may grant a refund on a case-by-case basis at our sole discretion if:
                    </p>
                    <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2 mt-4">
                        <li>You experience consistent, severe technical issues that prevent you from using the core features of the service.</li>
                        <li>Your account was charged due to a verifiable technical error on our part.</li>
                        <li>The service was completely unavailable for an extended period, significantly impacting your usage.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">4. Requesting a Refund</h2>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        To request a refund, please contact our support team at support@formai.ai within the eligible timeframe. Please include your account email, order number, and a detailed explanation of your reason for requesting the refund. We aim to process all requests within 5-7 business days.
                    </p>
                </section>

            </div>
        </div>
    );
}

