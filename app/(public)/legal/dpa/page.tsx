import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Data Processing Agreement — PreConvara" };

export default function DPAPage() {
  return (
    <LegalPage
      title="Data Processing Agreement"
      subtitle="For customers who require a DPA for GDPR compliance."
      lastUpdated="September 26, 2026"
      sections={[
        {
          heading: "Overview",
          body: <p>This Data Processing Agreement ("DPA") governs the processing of personal data by PreConvara ("Processor") on behalf of customers ("Controller") under Article 28 of the GDPR. It supplements our Terms of Service.</p>,
        },
        {
          heading: "Subject matter and duration",
          body: <p>PreConvara processes personal data (names, email addresses, brief content) on your behalf for the duration of your use of the service. Processing stops when you delete your account or request data deletion.</p>,
        },
        {
          heading: "Nature and purpose of processing",
          body: <>
            <p>Personal data is processed to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Authenticate users and maintain sessions</li>
              <li>Store and retrieve client brief data</li>
              <li>Process AI generation requests</li>
              <li>Respond to support requests</li>
            </ul>
          </>,
        },
        {
          heading: "Types of personal data",
          body: <>
            <ul className="list-disc pl-5 space-y-1">
              <li>User account data: name, email address, hashed password</li>
              <li>Brief content: client names, notes, generated AI output</li>
              <li>Appointment data: client names, email addresses, scheduling information</li>
            </ul>
          </>,
        },
        {
          heading: "Subprocessors",
          body: <p>We use a limited number of subprocessors. See our full <a href="/legal/subprocessors" className="underline">Subprocessors list</a>. We will notify you of changes to subprocessors at least 30 days in advance.</p>,
        },
        {
          heading: "Security measures",
          body: <p>We implement appropriate technical and organisational measures as described in our <a href="/legal/security" className="underline">Security page</a>, including password hashing, TLS encryption, and database-level Row Level Security.</p>,
        },
        {
          heading: "Data subject rights",
          body: <p>We will assist you in responding to data subject requests (access, rectification, erasure, portability) within the timescales required by applicable law. Contact dpa@preconvara.com to request assistance.</p>,
        },
        {
          heading: "Data transfers",
          body: <p>Data may be processed in the United States (Supabase and Google infrastructure). Transfers outside the EEA are covered by Standard Contractual Clauses as required under GDPR Chapter V.</p>,
        },
        {
          heading: "Requesting a signed DPA",
          body: <p>If your organisation requires a signed copy of this DPA, please email legal@preconvara.com with your organisation name and we will provide a countersigned version within 5 business days.</p>,
        },
      ]}
    />
  );
}
