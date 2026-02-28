import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | Tweaklog',
  description: 'Privacy Policy for Tweaklog — how we collect, use, and protect your data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0B1120]">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors mb-8"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-12">Last updated: February 28, 2026</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. Introduction</h2>
            <p>
              This Privacy Policy describes how Tweaklog (&quot;the Service&quot;), operated by Matsushima Asahi / Tweaklog Operations Office (&quot;we&quot;, &quot;us&quot;, or &quot;the Operator&quot;), collects, uses, and protects your personal information when you use our platform. By using the Service, you consent to the practices described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. Data Controller</h2>
            <p>
              The data controller responsible for your personal information is:
            </p>
            <p className="mt-3 text-gray-400">
              Matsushima Asahi (&#26494;&#23798;&#26093;&#39131;)<br />
              Tweaklog Operations Office<br />
              Tokyo, Japan<br />
              Email:{' '}
              <a href="mailto:tweaklog41@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors">
                tweaklog41@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. Information We Collect</h2>

            <h3 className="text-lg font-semibold text-gray-200 mt-6 mb-3">3.1 Account Information</h3>
            <p>When you create an account, we collect your email address and display name.</p>

            <h3 className="text-lg font-semibold text-gray-200 mt-6 mb-3">3.2 User-Entered Data</h3>
            <p>
              Data you voluntarily enter into the Service, including ad change logs, KPI data, experiment records, campaign information, custom metric configurations, and AI chat messages.
            </p>

            <h3 className="text-lg font-semibold text-gray-200 mt-6 mb-3">3.3 Payment Information</h3>
            <p>
              Payment is processed securely by Stripe. We do not store your credit card numbers or full payment details. Stripe may collect payment information in accordance with their own privacy policy.
            </p>

            <h3 className="text-lg font-semibold text-gray-200 mt-6 mb-3">3.4 Analytics and Cookies</h3>
            <p>
              We use minimal, functional cookies required for authentication and session management. We do not use third-party advertising trackers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><strong className="text-gray-200">Provide the Service:</strong> Store and display your ad change logs, calculate KPI impacts, and generate dashboard views.</li>
              <li><strong className="text-gray-200">AI Analysis:</strong> Your KPI data and experiment records may be sent to the Anthropic Claude API for AI-powered analysis and insights. Per Anthropic&apos;s API data policy, API inputs and outputs are not used for model training.</li>
              <li><strong className="text-gray-200">Payment Processing:</strong> Process subscription payments via Stripe.</li>
              <li><strong className="text-gray-200">Communication:</strong> Send service updates, security alerts, and support responses.</li>
              <li><strong className="text-gray-200">Improvement:</strong> Analyze usage patterns in aggregate to improve the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. Data Sharing</h2>
            <p>We share your data only with the following service providers, strictly for the purposes described:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-gray-400">
              <li><strong className="text-gray-200">Supabase</strong> &mdash; Database and authentication (servers in Tokyo region, Japan)</li>
              <li><strong className="text-gray-200">Stripe</strong> &mdash; Payment processing</li>
              <li><strong className="text-gray-200">Anthropic</strong> &mdash; AI analysis via Claude API (API data is not retained for model training)</li>
              <li><strong className="text-gray-200">Vercel</strong> &mdash; Application hosting and deployment</li>
            </ul>
            <p className="mt-4">
              We do not sell, rent, or trade your personal data to any third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">6. Data Retention</h2>
            <p>
              Your account data and user-entered content are retained for as long as your account is active. If you delete your account, your data will be permanently deleted from our systems within 30 days. Backup copies may be retained for up to 90 days for disaster recovery purposes before being purged.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">7. Your Rights</h2>

            <h3 className="text-lg font-semibold text-gray-200 mt-6 mb-3">All Users</h3>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1.5 text-gray-400">
              <li>Access your personal data stored in the Service</li>
              <li>Correct inaccurate personal data</li>
              <li>Request deletion of your personal data and account</li>
              <li>Export your data</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-200 mt-6 mb-3">EU/EEA Residents (GDPR)</h3>
            <p className="text-gray-400">
              Under the General Data Protection Regulation, you additionally have the right to data portability, the right to restrict processing, the right to object to processing, and the right to withdraw consent at any time. To exercise these rights, contact us at{' '}
              <a href="mailto:tweaklog41@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors">tweaklog41@gmail.com</a>.
            </p>

            <h3 className="text-lg font-semibold text-gray-200 mt-6 mb-3">Japanese Residents (APPI)</h3>
            <p className="text-gray-400">
              Under the Act on the Protection of Personal Information, you have the right to request disclosure, correction, deletion, or cessation of use of your personal information.
            </p>

            <h3 className="text-lg font-semibold text-gray-200 mt-6 mb-3">California Residents (CCPA)</h3>
            <p className="text-gray-400">
              Under the California Consumer Privacy Act, you have the right to know what personal information is collected, request deletion, and opt out of the sale of personal information. We do not sell personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">8. Security Measures</h2>
            <p>We implement appropriate technical and organizational measures to protect your data, including:</p>
            <ul className="list-disc list-inside mt-3 space-y-1.5 text-gray-400">
              <li>Encryption in transit (TLS/HTTPS) and at rest</li>
              <li>Row Level Security (RLS) policies on all database tables</li>
              <li>Secure authentication via Supabase Auth</li>
              <li>Regular security updates and monitoring</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">9. International Data Transfers</h2>
            <p>
              Your data is primarily stored in the Tokyo region (via Supabase). However, data may be processed in other countries through our service providers (Anthropic, Stripe, Vercel). We ensure that appropriate safeguards are in place for any international data transfers in compliance with applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">10. Children&apos;s Privacy</h2>
            <p>
              The Service is not intended for users under the age of 16. We do not knowingly collect personal information from children under 16. If we become aware that we have collected data from a child under 16, we will take steps to delete that information promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes via email or through an in-app notification. The &quot;Last updated&quot; date at the top of this page indicates when the policy was last revised.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">12. Contact</h2>
            <p>
              If you have any questions about this Privacy Policy or wish to exercise your data rights, please contact us at:
            </p>
            <p className="mt-3 text-gray-400">
              Matsushima Asahi / Tweaklog Operations Office<br />
              Email:{' '}
              <a href="mailto:tweaklog41@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors">
                tweaklog41@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
