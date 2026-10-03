import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Security — PreConvara" };

export default function SecurityPage() {
  return (
    <LegalPage
      title="Security"
      subtitle="How PreConvara protects your account and data."
      lastUpdated="September 26, 2026"
      sections={[
        {
          heading: "Password security",
          body: <p>Passwords are hashed using SHA-256 via the Web Crypto API before being stored in localStorage. Plain-text passwords are never stored. Legacy accounts are automatically upgraded to hashed passwords on next login.</p>,
        },
        {
          heading: "API key security",
          body: <p>The Gemini API key is stored exclusively as a server-side environment variable. It is never exposed to the browser, never included in JavaScript bundles, and never returned in API responses. All AI requests are proxied through our secure server routes.</p>,
        },
        {
          heading: "Data isolation",
          body: <>
            <p><strong>localStorage mode:</strong> Brief data is stored under a user-scoped key (cb_briefs_{"{userId}"}) so different browser users cannot access each other's data.</p>
            <p><strong>Supabase mode:</strong> Row Level Security (RLS) is enabled on all tables. Every database policy uses auth.uid() = user_id, meaning users can only read, write, update, and delete their own records — enforced at the database level, not just the application layer.</p>
          </>,
        },
        {
          heading: "Transport security",
          body: <p>All traffic between your browser and our server is encrypted via TLS 1.2+. We enforce HTTPS-only access.</p>,
        },
        {
          heading: "Frontend security",
          body: <>
            <ul className="list-disc pl-5 space-y-1">
              <li>No NEXT_PUBLIC_ environment variables expose secrets</li>
              <li>URL validation prevents server-side requests to private IP ranges (localhost, 10.x, 192.168.x, 172.16-31.x)</li>
              <li>User-provided content is never executed as code</li>
              <li>CSP headers prevent cross-site scripting</li>
            </ul>
          </>,
        },
        {
          heading: "Responsible disclosure",
          body: <p>If you discover a security vulnerability, please report it responsibly to: security@preconvara.com. We aim to respond within 48 hours and will credit researchers who report valid issues.</p>,
        },
      ]}
    />
  );
}
