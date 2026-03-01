import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Mail, Pencil, Phone } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerProfile, useGetMe } from "../hooks/useQueries";

function useUpdateMobile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mobileNumber: string) => {
      if (!actor) throw new Error("No actor");
      await actor.saveMobileNumber(mobileNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  const { data: me, isLoading: meLoading } = useGetMe();
  const { data: profile } = useGetCallerProfile();
  const updateMobile = useUpdateMobile();

  const [editingMobile, setEditingMobile] = useState(false);
  const [mobileValue, setMobileValue] = useState("");

  const principal = identity?.getPrincipal().toString() ?? "";
  const displayName = me?.username ?? profile?.username ?? "Player";
  const mobileNumber = me?.mobileNumber ?? profile?.mobileNumber ?? "";
  const accountNumber = me?.accountNumber ?? profile?.accountNumber ?? "";
  const shortPrincipal = principal
    ? `${principal.slice(0, 8)}...${principal.slice(-4)}`
    : "";

  async function handleSaveMobile() {
    if (!mobileValue.trim()) {
      toast.error("Enter a valid mobile number");
      return;
    }
    try {
      await updateMobile.mutateAsync(mobileValue.trim());
      toast.success("Mobile number updated");
      setEditingMobile(false);
    } catch {
      toast.error("Failed to update mobile number");
    }
  }

  return (
    <div className="flex flex-col">
      {/* Profile banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #3b0764 0%, #6d28d9 50%, #7c3aed 100%)",
          minHeight: 180,
        }}
      >
        {/* Decorative shapes */}
        <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute top-4 right-8 w-20 h-20 rounded-full bg-white/5" />
        <div className="absolute -bottom-4 left-1/3 w-24 h-24 rounded-full bg-white/10" />

        {/* Avatar in center */}
        <div className="relative z-10 flex flex-col items-center pt-8 pb-10">
          <div
            className="w-20 h-20 rounded-full border-4 border-white/50 flex items-center justify-center text-4xl shadow-lg"
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(4px)",
            }}
          >
            🎮
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-white font-display font-black text-lg">
              {meLoading ? "..." : displayName}
            </span>
            <button
              type="button"
              className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <Pencil size={12} className="text-white" />
            </button>
          </div>
          {shortPrincipal && (
            <p className="text-xs text-purple-200 mt-1 font-body">
              {shortPrincipal}
            </p>
          )}
        </div>
      </motion.div>

      <div className="flex flex-col gap-4 p-4">
        {/* Complete Profile section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl overflow-hidden border border-blue-100"
          style={{ background: "#f0f4ff" }}
        >
          <div className="px-4 pt-3 pb-1">
            <h2 className="text-sm font-display font-bold text-gray-800">
              Complete Profile
            </h2>
          </div>

          {/* Mobile number row */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white/60 mx-3 mb-2 rounded-xl border border-blue-100">
            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Phone size={16} className="text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-400 font-body uppercase tracking-wide">
                MOBILE NUMBER
              </p>
              {editingMobile ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    autoFocus
                    value={mobileValue}
                    onChange={(e) =>
                      setMobileValue(
                        e.target.value.replace(/\D/g, "").slice(0, 10),
                      )
                    }
                    placeholder="10-digit mobile"
                    className="h-8 text-sm bg-white border-gray-200 flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveMobile();
                      if (e.key === "Escape") setEditingMobile(false);
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveMobile}
                    disabled={updateMobile.isPending}
                    className="h-8 px-3 text-xs btn-green"
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {meLoading ? (
                    <Skeleton className="h-4 w-28" />
                  ) : (
                    <p className="text-sm font-bold text-gray-900 font-body">
                      {mobileNumber ? `+91 ${mobileNumber}` : "Not set"}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileValue(mobileNumber);
                      setEditingMobile(true);
                    }}
                    className="ml-auto text-gray-400 hover:text-purple-500 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Email row */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white/60 mx-3 mb-2 rounded-xl border border-blue-100">
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Mail size={16} className="text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-400 font-body uppercase tracking-wide">
                EMAIL ADDRESS
              </p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-gray-400 font-body italic">
                  Not set (optional)
                </p>
                <button
                  type="button"
                  className="ml-auto text-gray-400 hover:text-orange-500 transition-colors"
                >
                  <Pencil size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* KYC row */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white/60 mx-3 mb-3 rounded-xl border border-green-100">
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={16} className="text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-green-700 font-body">
                KYC Successfully Verified
              </p>
              <p className="text-[10px] text-green-500 font-body">
                Your account is verified
              </p>
            </div>
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold border border-green-200">
              ✓ Done
            </span>
          </div>
        </motion.div>

        {/* Other Details section */}
        <h2 className="text-sm font-display font-bold text-gray-700 uppercase tracking-wide">
          Other Details
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {/* Refer & Earn card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl p-4 cursor-pointer"
            style={{ background: "#3d4a1e" }}
          >
            <div className="text-2xl mb-2">🎁</div>
            <p className="text-sm font-bold text-white font-display">
              Refer &amp; Earn
            </p>
            <p className="text-xs text-green-300 font-body mt-0.5">
              Invite friends, earn cash
            </p>
          </motion.div>

          {/* Account balance card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl p-4"
            style={{ background: "#1e3a4a" }}
          >
            <div className="text-2xl mb-2">💰</div>
            <p className="text-sm font-bold text-white font-display">
              Wallet Balance
            </p>
            {meLoading ? (
              <Skeleton className="h-4 w-16 mt-0.5 bg-white/20" />
            ) : (
              <p className="text-xs text-blue-300 font-body mt-0.5">
                ₹{me ? (Number(me.walletBalance) / 100).toFixed(0) : "0"}
              </p>
            )}
          </motion.div>
        </div>

        {/* UPI / Account */}
        {accountNumber && (
          <div className="light-card p-4">
            <p className="text-xs text-gray-400 font-body uppercase tracking-wide mb-1">
              Saved UPI / Account
            </p>
            <p className="text-sm font-bold text-gray-900 font-body">
              {accountNumber}
            </p>
          </div>
        )}

        {/* Principal */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-xs text-gray-400 font-body uppercase tracking-wide mb-1">
            Internet Identity
          </p>
          <p className="text-xs font-mono text-gray-600 break-all">
            {principal || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
