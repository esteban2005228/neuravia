import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({ className, href = "/", white = false }: { className?: string; href?: string; white?: boolean }) {
  return (
    <Link href={href} className={cn("inline-flex", className)} aria-label="Neuravia, inicio">
      <Image
        src={white ? "/brand/logo-white.png" : "/brand/logo.png"}
        alt="Neuravia"
        width={522}
        height={321}
        priority
        className="h-auto w-full"
      />
    </Link>
  );
}
