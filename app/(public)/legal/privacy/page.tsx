import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Privacy Policy — PreConvara" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="How we collect, use, and protect your personal information."
      lastUpdated="September 26, 2026"
      sections={[
        {
          heading: "1. Who we are",
          body: <p>PreConvara ("we", "us", "our") is an AI-powered meeting preparation tool operated as an independent product. For privacy enquiries, contact us at privacy@preconvara.com.</p>,
        },
        {
          heading: "2. Information we collect",
          body: <>
            <p><strong>Account data:</strong> When you sign up, we collect your name, email address, and a password (stored as a SHA-256 hash — never plain text).</p>
            <p><strong>Brief data:</strong> The client names, website URLs, notes, and generated briefs you create. This data is stored locally in your browser (localStorage) or in our Supabase database when configured, and is associated only with your account.</p>
            <p><strong>Usage data:</strong> We do not currently collect analytics or tracking data. No third-party analytics scripts are loaded.</p>
          </>,
        },
        {
          heading: "3. How we use your information",
          body: <>
            <p>We use your information solely to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide and operate the PreConvara service</li>
              <li>Generate AI-powered client briefs using your input</li>
              <li>Authenticate your session and protect your account</li>
              <li>Respond to support requests</li>
            </ul>
            <p>We never sell your data to third parties or use it for advertising.</p>
          </>,
        },
        {
          heading: "4. AI processing",
          body: <p>Your brief inputs (company name, notes, website content) are sent to Google Gemini API for AI generation. This happens server-side — your data is not sent from your browser directly. Google's data processing is governed by their AI terms. We do not use your inputs to train AI models.</p>,
        },
        {
          heading: "5. Data storage",
          body: <p>Brief data is stored in your browser's localStorage by default. When Supabase is configured, data is stored in a PostgreSQL database with Row Level Security — only you can access your own records. We do not store brief data on our own servers.</p>,
        },
        {
          heading: "6. Cookies",
          body: <p>We use only essential cookies for session management. No advertising or tracking cookies are set. See our <a href="/legal/cookies" className="underline">Cookie Policy</a> for details.</p>,
        },
        {
          heading: "7. Your rights",
          body: <>
            <p>You have the right to access, correct, or delete your personal data at any time. To request deletion of your account and all associated data, email privacy@preconvara.com. We will process requests within 30 days.</p>
            <p>If you are in the EU/EEA, you also have rights under GDPR including the right to data portability and the right to lodge a complaint with your supervisory authority.</p>
          </>,
        },
        {
          heading: "8. Contact",
          body: <p>For any privacy-related questions: privacy@preconvara.com</p>,
        },
      ]}
    />
  );
}
