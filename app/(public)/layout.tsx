export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="aurora flex min-h-screen flex-col">{children}</div>;
}
