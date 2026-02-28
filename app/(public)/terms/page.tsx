import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | Tweaklog',
  description: 'Terms of Service for Tweaklog — Ad Change Logs, Impact Analysis, and AI Insights.',
}

export default function TermsPage() {
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

        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-12">Last updated: February 28, 2026</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Tweaklog (&quot;the Service&quot;), operated by Matsushima Asahi / Tweaklog Operations Office (&quot;we&quot;, &quot;us&quot;, or &quot;the Operator&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. Service Description</h2>
            <p>
              Tweaklog is a SaaS platform for advertising operations teams that provides:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1.5 text-gray-400">
              <li>Ad change logging and tracking across multiple platforms (Google Ads, Meta Ads, TikTok, Yahoo! Ads, etc.)</li>
              <li>Automated KPI impact analysis with before/after comparison</li>
              <li>AI-powered insights and anomaly detection using Anthropic Claude API</li>
              <li>Custom metric formulas and dashboard visualization</li>
              <li>Data import via CSV upload and Google Spreadsheet integration</li>
              <li>Team collaboration with role-based access control</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. Account Registration and Responsibilities</h2>
            <p>
              To use the Service, you must create an account with a valid email address and password. You are responsible for:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1.5 text-gray-400">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and up-to-date information</li>
              <li>Notifying us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. Subscription and Billing</h2>
            <p>
              The Service offers the following plans:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1.5 text-gray-400">
              <li><strong className="text-gray-200">Free Plan (&#165;0)</strong> &mdash; Basic features with usage limitations</li>
              <li><strong className="text-gray-200">Pro Plan (&#165;3,980/month or ~$29/month)</strong> &mdash; Full features for individual users</li>
              <li><strong className="text-gray-200">Team Plan (&#165;9,800/month or ~$79/month)</strong> &mdash; Full features with team collaboration</li>
            </ul>
            <p className="mt-4">
              Payment is processed securely via Stripe. Paid subscriptions are billed monthly and auto-renew at the beginning of each billing cycle. You may cancel your subscription at any time through your account settings. Upon cancellation, you will retain access to paid features until the end of the current billing period. No refunds are provided for partial billing periods.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside mt-3 space-y-1.5 text-gray-400">
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
              <li>Attempt to gain unauthorized access to the Service or its related systems</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Upload malicious code, viruses, or harmful data</li>
              <li>Use automated systems (bots, scrapers) to access the Service without permission</li>
              <li>Resell, sublicense, or redistribute the Service without written consent</li>
              <li>Misrepresent your identity or affiliation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">6. Intellectual Property</h2>
            <p>
              <strong className="text-gray-200">Your Data:</strong> You retain full ownership of all data you enter into the Service, including ad change logs, KPI data, experiment records, and custom configurations. You grant us a limited license to process and store your data solely for the purpose of providing the Service.
            </p>
            <p className="mt-3">
              <strong className="text-gray-200">Our Service:</strong> The Service, including its design, code, features, documentation, and branding, is the intellectual property of the Operator and is protected by applicable copyright and intellectual property laws. You may not copy, modify, or create derivative works based on the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">7. AI-Generated Content Disclaimer</h2>
            <p>
              The Service uses Anthropic Claude API to provide AI-powered analysis, insights, and recommendations. AI-generated content is provided for informational purposes only and should not be considered professional advertising, financial, or business advice. The accuracy, completeness, and reliability of AI-generated outputs are not guaranteed. You are solely responsible for decisions made based on AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">8. Data Handling</h2>
            <p>
              Your privacy is important to us. Please review our{' '}
              <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors">
                Privacy Policy
              </Link>{' '}
              for detailed information about how we collect, use, and protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">9. Termination and Suspension</h2>
            <p>
              We may suspend or terminate your access to the Service at any time if you violate these Terms or engage in conduct that we reasonably believe is harmful to the Service or other users. You may delete your account at any time through the Settings page. Upon termination, your data will be deleted in accordance with our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, the Operator shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities, arising out of or in connection with your use of the Service. Our total liability shall not exceed the amount you paid for the Service in the twelve (12) months preceding the event giving rise to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">11. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or secure, or that any defects will be corrected.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">12. Governing Law and Jurisdiction</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of Japan. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the Tokyo District Court.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of material changes via email or through an in-app notification. Your continued use of the Service after such changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">14. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
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
