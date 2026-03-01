import { Copy, Trophy, Users } from "lucide-react";
import { motion } from "motion/react";
import { SiWhatsapp } from "react-icons/si";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetMe } from "../hooks/useQueries";

function generateReferralCode(principal?: string): string {
  if (!principal) return "000000";
  // Take the last 8 chars of the principal and convert to 6-digit number
  const end = principal.replace(/[^a-z0-9]/gi, "").slice(-8);
  let num = 0;
  for (let i = 0; i < end.length; i++) {
    num = (num * 31 + end.charCodeAt(i)) % 1_000_000;
  }
  return num.toString().padStart(6, "0");
}

export default function ReferPage() {
  const { identity } = useInternetIdentity();
  const { data: me } = useGetMe();

  const principal = identity?.getPrincipal().toString();
  const referralCode = generateReferralCode(principal);
  const shareText = `🎮 Play Ludo & Win Real Money on MK Ludo! Use my referral code *${referralCode}* to get a bonus. Download now: https://mkludo.app`;

  function handleCopy() {
    navigator.clipboard.writeText(referralCode).then(() => {
      toast.success("Referral code copied!");
    });
  }

  function handleWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      "_blank",
    );
  }

  return (
    <div className="flex flex-col">
      {/* Purple-to-blue gradient banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden px-5 py-8 text-center"
        style={{
          background:
            "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center text-4xl">
            🎁
          </div>
          <h1 className="text-2xl font-display font-black text-white mb-2">
            Refer &amp; Earn
          </h1>
          <p className="text-sm text-purple-100 font-body max-w-xs mx-auto">
            Invite your friends and earn real cash rewards instantly!
          </p>
        </div>
      </motion.div>

      <div className="flex flex-col gap-4 p-4">
        {/* Referral code box */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="light-card p-4"
        >
          <p className="text-xs text-gray-400 font-body uppercase tracking-widest font-semibold mb-3">
            REFERRAL CODE
          </p>
          <div className="flex items-center gap-3 border-2 border-dashed border-blue-300 rounded-xl px-4 py-3 bg-blue-50">
            <span className="flex-1 text-2xl font-black font-display text-gray-900 tracking-widest">
              {referralCode}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors font-body"
            >
              <Copy size={14} />
              COPY
            </button>
          </div>
        </motion.div>

        {/* WhatsApp share */}
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={handleWhatsApp}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-base font-body text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: "#25D366" }}
        >
          <SiWhatsapp size={22} />
          Share on WhatsApp
        </motion.button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-body font-semibold uppercase tracking-wide">
            Your Performance
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Earnings title */}
        <h2 className="text-lg font-display font-black text-gray-900">
          Your Referral Earnings
        </h2>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Referred Players */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl p-4"
            style={{ background: "#eff6ff" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-body font-semibold text-blue-500 uppercase tracking-wide">
                Referred Players
              </p>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Trophy size={16} className="text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-black font-display text-gray-900">0</p>
            <p className="text-xs text-blue-400 font-body mt-1">
              friends joined
            </p>
          </motion.div>

          {/* Referral Earning */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl p-4"
            style={{ background: "#fefce8" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-body font-semibold text-yellow-600 uppercase tracking-wide">
                Referral Earning
              </p>
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <Users size={16} className="text-yellow-600" />
              </div>
            </div>
            <p className="text-3xl font-black font-display text-gray-900">
              ₹{me ? "0" : "0"}
            </p>
            <p className="text-xs text-yellow-500 font-body mt-1">
              total earned
            </p>
          </motion.div>
        </div>

        {/* How it works */}
        <div className="light-card p-4">
          <h3 className="text-sm font-display font-bold text-gray-900 mb-3">
            How it works
          </h3>
          <div className="flex flex-col gap-3">
            {[
              {
                step: "1",
                text: "Share your referral code with friends",
                emoji: "📤",
              },
              {
                step: "2",
                text: "Friend registers using your code",
                emoji: "👤",
              },
              { step: "3", text: "Earn cash bonus instantly!", emoji: "💰" },
            ].map(({ step, text, emoji }) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-black text-purple-700 flex-shrink-0">
                  {step}
                </div>
                <span className="text-sm font-body text-gray-600">
                  {emoji} {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
