import LegalPage from "@/components/LegalPage";

export const metadata = { title: "AI Policy — PreConvara" };

export default function AIPolicyPage() {
  return (
    <LegalPage
      title="AI Policy"
      subtitle="How PreConvara uses AI responsibly to generate your client briefs."
      lastUpdated="September 26, 2026"
      sections={[
        {
          heading: "Our AI provider",
          body: <p>PreConvara uses Google Gemini (via the Gemini API) to generate client briefs. All AI requests are made server-side — your data is never sent directly from your browser to Google's API.</p>,
        },
        {
          heading: "What data is sent to the AI",
          body: <>
            <p>When you generate a brief, we send the following to Gemini:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The client/company name you entered</li>
              <li>The website URL (if provided) and extracted text from that URL</li>
              <li>The call type and service type you selected</li>
              <li>Any notes or conversation context you provided</li>
            </ul>
            <p>We do not send your account credentials, payment information, or data from other users.</p>
          </>,
        },
        {
          heading: "AI accuracy and limitations",
          body: <>
            <p>AI-generated content may be inaccurate, incomplete, or outdated. PreConvara labels information by source ([From Website], [From User Notes], [AI Observation]) so you can distinguish confirmed facts from AI inferences.</p>
            <p>You are responsible for verifying AI-generated content before using it in client meetings. PreConvara does not guarantee the accuracy of generated briefs.</p>
          </>,
        },
        {
          heading: "Model training",
          body: <p>We do not use your inputs or generated briefs to train AI models. Your data is not shared with AI providers for training purposes beyond what is specified in Google's API terms.</p>,
        },
        {
          heading: "Model fallbacks",
          body: <p>PreConvara uses a fallback chain of models (gemini-3.5-flash → gemini-3.5-flash-lite → gemini-3.1-flash-lite) to ensure generation succeeds even when one model is rate-limited. All models in the chain are operated by Google DeepMind.</p>,
        },
        {
          heading: "Human oversight",
          body: <p>PreConvara is a tool for preparation — all decisions made in client meetings remain your responsibility. The AI assistant (chat widget) is scoped to answer questions about the PreConvara product only and will not provide professional legal, financial, or medical advice.</p>,
        },
        {
          heading: "Reporting AI issues",
          body: <p>If you encounter AI-generated content that is harmful, inaccurate, or concerning, please report it to: ai@preconvara.com</p>,
        },
      ]}
    />
  );
}
