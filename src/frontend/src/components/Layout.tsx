import { Link, useRouterState } from "@tanstack/react-router";
import { ShieldCheck, Swords, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { paisaToRupees, useGetMe, useIsCallerAdmin } from "../hooks/useQueries";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { data: me } = useGetMe();
  const { data: isAdmin } = useIsCallerAdmin();
  const { clear, identity } = useInternetIdentity();

  const navItems = [
    { path: "/", icon: Swords, label: "Lobby" },
    { path: "/wallet", icon: Wallet, label: "Wallet" },
    ...(isAdmin ? [{ path: "/admin", icon: ShieldCheck, label: "Admin" }] : []),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border/60 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/assets/generated/mk-ludo-logo-transparent.dim_300x120.png"
              alt="MK Ludo"
              className="h-9 object-contain"
            />
          </Link>

          <div className="flex items-center gap-3">
            {me && (
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground font-body">
                  {me.username}
                </span>
                <span className="text-sm font-bold text-gold font-display">
                  ₹{paisaToRupees(me.walletBalance)}
                </span>
              </div>
            )}
            {identity && (
              <button
                type="button"
                onClick={() => clear()}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-border/50 hover:border-border font-body"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-28">
        {children}
        {/* Footer */}
        <footer className="mt-10 pt-6 border-t border-border/30 text-center">
          <p className="text-xs text-muted-foreground/50 font-body">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold/60 hover:text-gold transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border/60">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive =
              path === "/" ? currentPath === "/" : currentPath.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 transition-all duration-200 relative ${
                  isActive
                    ? "text-gold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon
                  size={22}
                  className={
                    isActive
                      ? "drop-shadow-[0_0_8px_oklch(0.82_0.18_85/0.6)]"
                      : ""
                  }
                />
                <span className="text-xs font-semibold font-body">{label}</span>
                {isActive && (
                  <div className="absolute bottom-0 h-0.5 w-10 bg-gold rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
