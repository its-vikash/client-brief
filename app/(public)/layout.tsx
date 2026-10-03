// Public pages use the full canvas background, no sidebar
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
