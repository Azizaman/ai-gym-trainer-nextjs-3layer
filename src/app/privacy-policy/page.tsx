import React from "react";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#07070a] px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
            <div className="mx-auto max-w-3xl prose prose-zinc dark:prose-invert">
                <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl mb-8">
                    Privacy Policy
                </h1>

                <p className="text-sm text-zinc-500 mb-8">Last Updated: March 2026</p>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">1. Introduction</h2>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        At FormAI, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">2. Information We Collect</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                        We may collect information about you in a variety of ways. The information we may collect includes:
                    </p>
                    <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2">
                        <li><strong>Personal Data:</strong> Demographics, such as your age, gender, hometown, and interests, that you voluntarily give to us when you register with the Site.</li>
                        <li><strong>Workout Data & Media:</strong> Videos or images of your workouts that you upload for form analysis. We process these to provide our core AI service.</li>
                        <li><strong>Usage Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">3. Use of Your Information</h2>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:
                    </p>
                    <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2 mt-4">
                        <li>Create and manage your account.</li>
                        <li>Process your videos and provide AI-generated workout and form feedback.</li>
                        <li>Improve our AI models (only using anonymized data if you opted in).</li>
                        <li>Send you administrative information, such as updates to our terms, conditions, and policies.</li>
                        <li>Respond to product and customer service requests.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">4. Disclosure of Your Information</h2>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
                    </p>
                    <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2 mt-4">
                        <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others.</li>
                        <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">5. Contact Us</h2>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        If you have questions or comments about this Privacy Policy, please contact us at privacy@formai.example.com.
                    </p>
                </section>
            </div>
        </div>
    );
}

