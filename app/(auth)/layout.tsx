import { Logo } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="aurora-vivid flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <Logo className="w-44" />
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
