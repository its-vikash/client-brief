import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Subprocessors — PreConvara" };

export default function SubprocessorsPage() {
  const processors = [
    {
      name: "Google DeepMind (Gemini API)",
      purpose: "AI brief generation",
      location: "United States",
      link: "https://ai.google.dev/gemini-api/terms",
    },
    {
      name: "Supabase",
      purpose: "Database and authentication (when configured)",
      location: "United States / EU (configurable)",
      link: "https://supabase.com/privacy",
    },
    {
      name: "Vercel (optional)",
      purpose: "Application hosting and deployment",
      location: "United States / Global edge",
      link: "https://vercel.com/legal/privacy-policy",
    },
  ];

  return (
    <LegalPage
      title="Subprocessors"
      subtitle="Third-party companies that process data on PreConvara's behalf."
      lastUpdated="September 26, 2026"
      sections={[
        {
          heading: "Current subprocessors",
          body: (
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--border-light)" }}>
              <table className="w-full text-xs">
                <thead style={{ backgroundColor: "var(--bg-card)" }}>
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Subprocessor</th>
                    <th className="text-left px-4 py-3 font-semibold">Purpose</th>
                    <th className="text-left px-4 py-3 font-semibold">Location</th>
                  </tr>
                </thead>
                <tbody style={{ backgroundColor: "var(--bg-card-alt)" }}>
                  {processors.map((p) => (
                    <tr key={p.name} className="border-t" style={{ borderColor: "var(--border-light)" }}>
                      <td className="px-4 py-3">
                        <a href={p.link} target="_blank" rel="noopener noreferrer"
                          className="font-semibold underline" style={{ color: "var(--teal)" }}>
                          {p.name}
                        </a>
                      </td>
                      <td className="px-4 py-3">{p.purpose}</td>
                      <td className="px-4 py-3">{p.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ),
        },
        {
          heading: "Changes to subprocessors",
          body: <p>We will notify customers of any additions or replacements to our subprocessor list at least 30 days before the change takes effect. Notifications will be sent to the email address associated with your account.</p>,
        },
        {
          heading: "Objections",
          body: <p>If you have legitimate grounds to object to a new subprocessor, please contact legal@preconvara.com within 14 days of notification. We will work with you to find a suitable resolution.</p>,
        },
      ]}
    />
  );
}
