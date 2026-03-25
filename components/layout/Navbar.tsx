"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const NAV_LINKS = [
  { href: "/planilla", label: "Planilla" },
  { href: "/habilidades", label: "Habilidades" },
  { href: "/bitacora", label: "Bitácora" },
  { href: "/asignacion-manual", label: "Asignación Manual" },
  { href: "/ausencias", label: "Ausencias" },
  { href: "/cobertura", label: "Cobertura" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <nav
      className="glass sticky top-0 z-50 w-full"
      style={{ borderBottom: "1px solid var(--glass-border)" }}
    >
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <span className="text-white font-bold text-base select-none">
          GestionTurnos v2.0
        </span>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                style={{
                  color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                  background: isActive ? "var(--glass-bg-hover)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          style={{ color: "var(--muted-foreground)" }}
        >
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
}
