import { Link, useRouterState } from "@tanstack/react-router";
import {
  ChevronRight,
  Gift,
  Globe,
  HelpCircle,
  History,
  Home,
  Menu,
  ScrollText,
  ShieldCheck,
  User,
  Wallet,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { paisaToRupees, useGetMe, useIsCallerAdmin } from "../hooks/useQueries";

interface LayoutProps {
  children: ReactNode;
}

const drawerItems = [
  { icon: "👤", label: "My Profile", path: "/profile" },
  { icon: "🎮", label: "Play", path: "/" },
  { icon: "💰", label: "My Wallet", path: "/wallet" },
  { icon: "🎁", label: "Refer and Earn", path: "/refer" },
  { icon: "🕐", label: "History", path: "/wallet" },
  { icon: "💬", label: "Support", path: "/support" },
];

export default function Layout({ children }: LayoutProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { data: me } = useGetMe();
  const { data: isAdmin } = useIsCallerAdmin();
  const { clear } = useInternetIdentity();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");

  const balance = me ? paisaToRupees(me.walletBalance) : "0";

  const bottomNavItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/wallet", icon: Wallet, label: "My Wallet" },
    { path: "/refer", icon: Gift, label: "Refer", center: true },
    { path: "/support", icon: HelpCircle, label: "Support" },
    { path: "/profile", icon: User, label: "Profile" },
    ...(isAdmin
      ? [{ path: "/admin", icon: ShieldCheck, label: "Admin", center: false }]
      : []),
  ];

  function isActive(path: string) {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#f7f7f7" }}
    >
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 app-header">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-2.5">
          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-white hover:bg-white/10 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          {/* Logo */}
          <Link to="/" className="absolute left-1/2 -translate-x-1/2">
            <img
              src="/assets/generated/mk-ludo-logo-transparent.dim_300x120.png"
              alt="MK Ludo"
              className="h-8 object-contain"
            />
          </Link>

          {/* Right chips */}
          <div className="flex items-center gap-1.5 ml-auto">
            {/* Wallet chip */}
            <div className="flex items-center gap-1 bg-zinc-800 rounded-full px-2.5 py-1">
              <span className="text-base leading-none">💰</span>
              <span className="text-green-400 font-bold text-xs font-body">
                ₹{balance}
              </span>
            </div>
            {/* Bonus chip */}
            <div className="flex items-center gap-1 bg-zinc-800 rounded-full px-2.5 py-1">
              <span className="text-base leading-none">🎁</span>
              <span className="text-yellow-400 font-bold text-xs font-body">
                ₹0
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Side Drawer Overlay ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/50"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-[70] w-[280px] flex flex-col overflow-y-auto"
              style={{ background: "#111111" }}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
                <img
                  src="/assets/generated/mk-ludo-logo-transparent.dim_300x120.png"
                  alt="MK Ludo"
                  className="h-7 object-contain"
                />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-white rounded-full hover:bg-zinc-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Menu items */}
              <nav className="flex flex-col gap-2 p-3 flex-1">
                {drawerItems.map((item) => (
                  <Link
                    key={item.path + item.label}
                    to={item.path}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center justify-between bg-zinc-800 hover:bg-zinc-700 rounded-xl px-4 py-3 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-white font-body font-semibold text-sm">
                        {item.label}
                      </span>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-zinc-400 group-hover:text-white transition-colors"
                    />
                  </Link>
                ))}

                {/* Language toggle */}
                <div className="bg-zinc-800 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3 mb-2">
                    <Globe size={18} className="text-zinc-400" />
                    <span className="text-white font-body font-semibold text-sm">
                      Language
                    </span>
                  </div>
                  <div className="flex gap-2 pl-7">
                    <button
                      type="button"
                      onClick={() => setLanguage("en")}
                      className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                        language === "en"
                          ? "bg-white text-black"
                          : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage("hi")}
                      className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                        language === "hi"
                          ? "bg-white text-black"
                          : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                      }`}
                    >
                      हिंदी
                    </button>
                  </div>
                </div>

                {/* All Policy */}
                <button
                  type="button"
                  className="flex items-center justify-between bg-zinc-800 hover:bg-zinc-700 rounded-xl px-4 py-3 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <ScrollText size={18} className="text-zinc-400" />
                    <span className="text-white font-body font-semibold text-sm">
                      All Policy
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-zinc-400" />
                </button>

                {/* History */}
                <Link
                  to="/wallet"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between bg-zinc-800 hover:bg-zinc-700 rounded-xl px-4 py-3 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <History size={18} className="text-zinc-400" />
                    <span className="text-white font-body font-semibold text-sm">
                      Transaction History
                    </span>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-zinc-400 group-hover:text-white"
                  />
                </Link>
              </nav>

              {/* Logout */}
              <div className="p-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    clear();
                    setDrawerOpen(false);
                  }}
                  className="w-full py-3 rounded-xl bg-red-900/60 hover:bg-red-900/80 text-red-300 font-body font-semibold text-sm transition-colors"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-2xl mx-auto w-full pb-24">
        {children}
        {/* Footer */}
        <footer className="mt-10 pt-6 border-t border-gray-200 text-center px-4">
          <p className="text-xs text-gray-400 font-body">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </main>

      {/* ── Bottom Navbar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 app-bottom-nav">
        <div className="max-w-2xl mx-auto flex items-center">
          {bottomNavItems
            .slice(0, isAdmin ? 6 : 5)
            .map(({ path, icon: Icon, label, center }) => {
              const active = isActive(path);
              return (
                <Link
                  key={path + label}
                  to={path}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 transition-all duration-200 ${
                    active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {center ? (
                    <div
                      className={`flex flex-col items-center gap-0.5 ${
                        active ? "bg-white rounded-2xl px-3 py-1.5" : ""
                      }`}
                    >
                      <Icon
                        size={20}
                        className={active ? "text-black" : "text-zinc-500"}
                      />
                      <span
                        className={`text-[10px] font-bold leading-none ${active ? "text-black" : "text-zinc-500"}`}
                      >
                        {label}
                      </span>
                    </div>
                  ) : (
                    <>
                      <Icon size={20} />
                      <span className="text-[10px] font-bold leading-none">
                        {label}
                      </span>
                    </>
                  )}
                </Link>
              );
            })}
        </div>
      </nav>
    </div>
  );
}
