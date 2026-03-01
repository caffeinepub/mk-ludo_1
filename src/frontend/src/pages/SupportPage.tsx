import { Mail, Phone } from "lucide-react";
import { motion } from "motion/react";
import { SiWhatsapp } from "react-icons/si";

export default function SupportPage() {
  return (
    <div className="flex flex-col">
      {/* Purple-to-blue gradient banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden px-5 py-8 text-center"
        style={{
          background:
            "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative z-10">
          {/* Support illustration oval */}
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center text-4xl shadow-inner border-2 border-white/30">
            🎧
          </div>
          <h1 className="text-2xl font-display font-black text-white mb-2">
            Need Help?
          </h1>
          <p className="text-sm text-purple-100 font-body">
            We're here to help you 24/7
          </p>
        </div>
      </motion.div>

      <div className="flex flex-col gap-4 p-4">
        {/* Section title */}
        <h2 className="text-base font-display font-black text-gray-900">
          Contact Us At Below Platforms.
        </h2>

        {/* 2-column contact cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* WhatsApp card */}
          <motion.a
            href="https://wa.me/917240396548"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl p-4 flex flex-col items-center gap-2 text-center cursor-pointer hover:opacity-90 transition-opacity"
            style={{ background: "#dcfce7" }}
          >
            <SiWhatsapp size={32} color="#16a34a" />
            <p className="text-sm font-bold text-gray-900 font-display">
              WhatsApp
            </p>
            <p className="text-xs text-gray-500 font-body">
              Chat with us directly
            </p>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full text-white"
              style={{ background: "#16a34a" }}
            >
              Chat Now
            </span>
          </motion.a>

          {/* Email card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl p-4 flex flex-col items-center gap-2 text-center"
            style={{ background: "#dbeafe" }}
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <Mail size={30} color="#2563eb" />
            </div>
            <p className="text-sm font-bold text-gray-900 font-display">
              Email Support
            </p>
            <p className="text-xs text-gray-500 font-body">
              Follow us for updates
            </p>
            <a
              href="mailto:support@mkludo.app"
              className="text-xs font-bold px-3 py-1 rounded-full text-white"
              style={{ background: "#2563eb" }}
            >
              Email Us
            </a>
          </motion.div>
        </div>

        {/* Full-width call card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl overflow-hidden border border-gray-100 bg-white"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}
        >
          <div className="flex items-center gap-4 p-4">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 text-3xl">
              📞
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body text-gray-500">
                Get instant help from our team
              </p>
              <p className="text-base font-display font-black text-gray-900">
                MK Ludo Support
              </p>
              <p className="text-sm font-body text-gray-600">+91 7240396548</p>
            </div>
          </div>
          <div className="px-4 pb-4">
            <a
              href="tel:+917240396548"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm text-white font-body transition-opacity hover:opacity-90"
              style={{ background: "#dc2626" }}
            >
              <Phone size={16} />
              CALL NOW
            </a>
          </div>
        </motion.div>

        {/* FAQ cards */}
        <h2 className="text-sm font-display font-bold text-gray-700 mt-2">
          Frequently Asked Questions
        </h2>

        <div className="flex flex-col gap-2">
          {[
            {
              q: "How do I add money to my wallet?",
              a: "Go to My Wallet → Add Cash. Send money via UPI and we'll credit your account within 30 minutes.",
            },
            {
              q: "How long does withdrawal take?",
              a: "Withdrawals are processed within 24 hours to your registered UPI/bank account.",
            },
            {
              q: "What if I face a dispute in a battle?",
              a: "Contact our support team on WhatsApp with your battle ID and screenshot evidence.",
            },
            {
              q: "Is MK Ludo safe to play?",
              a: "Yes! All transactions are manually verified. Your data is secured with Internet Identity.",
            },
          ].map(({ q, a }) => (
            <div
              key={q}
              className="rounded-xl border border-gray-100 bg-white p-4"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
            >
              <p className="text-sm font-bold text-gray-900 font-display mb-1">
                ❓ {q}
              </p>
              <p className="text-xs text-gray-500 font-body leading-relaxed">
                {a}
              </p>
            </div>
          ))}
        </div>

        {/* WhatsApp CTA */}
        <a
          href="https://wa.me/917240396548"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-base text-white font-body transition-opacity hover:opacity-90"
          style={{ background: "#25D366" }}
        >
          <SiWhatsapp size={20} />
          WhatsApp: 7240396548
        </a>
      </div>
    </div>
  );
}
