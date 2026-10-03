import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Cookie Policy — PreConvara" };

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      subtitle="How and why PreConvara uses cookies."
      lastUpdated="September 26, 2026"
      sections={[
        {
          heading: "What are cookies?",
          body: <p>Cookies are small text files stored in your browser. They allow websites to remember information about your visit.</p>,
        },
        {
          heading: "Cookies we use",
          body: <>
            <p>PreConvara uses only <strong>essential cookies</strong> — no advertising, tracking, or analytics cookies are set.</p>
            <div className="rounded-xl overflow-hidden border mt-3" style={{ borderColor: "var(--border-light)" }}>
              <table className="w-full text-xs">
                <thead style={{ backgroundColor: "var(--bg-card)" }}>
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold">Name</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Purpose</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody style={{ backgroundColor: "var(--bg-card-alt)" }}>
                  <tr className="border-t" style={{ borderColor: "var(--border-light)" }}>
                    <td className="px-4 py-2.5 font-mono">cb_auth_user</td>
                    <td className="px-4 py-2.5">Stores your login session in localStorage</td>
                    <td className="px-4 py-2.5">Session / until logout</td>
                  </tr>
                  <tr className="border-t" style={{ borderColor: "var(--border-light)" }}>
                    <td className="px-4 py-2.5 font-mono">sb-*</td>
                    <td className="px-4 py-2.5">Supabase auth session (when configured)</td>
                    <td className="px-4 py-2.5">1 hour (auto-refreshed)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>,
        },
        {
          heading: "Third-party cookies",
          body: <p>We do not embed any third-party scripts that set cookies (no Google Analytics, no Meta Pixel, no advertising networks).</p>,
        },
        {
          heading: "Managing cookies",
          body: <p>You can clear all cookies and localStorage data via your browser settings. Note that clearing session data will log you out. You can also use your browser's developer tools to inspect and delete specific items.</p>,
        },
        {
          heading: "Contact",
          body: <p>Questions about cookies: privacy@preconvara.com</p>,
        },
      ]}
    />
  );
}
