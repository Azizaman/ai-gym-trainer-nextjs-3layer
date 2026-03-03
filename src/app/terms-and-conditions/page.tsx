import React from "react";

export default function TermsAndConditions() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#07070a] px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
            <div className="mx-auto max-w-3xl prose prose-zinc dark:prose-invert">
                <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl mb-8">
                    Terms and Conditions
                </h1>

                <p className="text-sm text-zinc-500 mb-8">Last Updated: March 2026</p>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">1. Introduction</h2>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Welcome to FormAI. These Terms and Conditions govern your use of our website and services. By accessing or using our platform, you agree to be bound by these terms. If you disagree with any part of these terms, you may not access the service.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">2. Use of Service</h2>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        You must use our services only for lawful purposes. You agree not to:
                    </p>
                    <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2 mt-4">
                        <li>Violate any applicable national or international law or regulation.</li>
                        <li>Exploit, harm, or attempt to exploit or harm minors in any way.</li>
                        <li>Infringe upon the rights of others, including intellectual property rights.</li>
                        <li>Use the platform in any manner that could disable, overburden, damage, or impair the site.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">3. Accounts</h2>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the terms, which may result in immediate termination of your account on our service.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">4. Intellectual Property</h2>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        The Service and its original content, features, and functionality are and will remain the exclusive property of FormAI and its licensors.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">5. Disclaimer of Warranties</h2>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Our service is provided on an "AS IS" and "AS AVAILABLE" basis. FormAI makes no representations or warranties of any kind, express or implied, as to the operation of their services, or the information, content, or materials included therein.
                        Physical exercise involves an inherent risk of injury. The form analysis provided by FormAI is for informational purposes only and does not constitute medical or professional coaching advice.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">6. Contact Us</h2>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        If you have any questions about these Terms, please contact us at support@formai.example.com.
                    </p>
                </section>
            </div>
        </div>
    );
}

