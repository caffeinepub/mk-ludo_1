import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Loader2,
  Pencil,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { WalletTransactionType } from "../backend.d";
import type { WalletTransaction } from "../backend.d";
import { TxStatusBadge } from "../components/StatusBadge";
import { useActor } from "../hooks/useActor";
import {
  paisaToRupees,
  rupeesToPaise,
  useGetMe,
  useRequestDeposit,
  useRequestWithdrawal,
  useSaveAccountNumber,
} from "../hooks/useQueries";

const AMOUNT_PRESETS = [100, 250, 500, 1000];

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const isCredit =
    tx.txType === WalletTransactionType.Deposit ||
    tx.txType === WalletTransactionType.BattleWin;

  const typeLabel: Record<WalletTransactionType, string> = {
    [WalletTransactionType.Deposit]: "Deposit",
    [WalletTransactionType.Withdrawal]: "Withdrawal",
    [WalletTransactionType.BattleEntry]: "Battle Entry",
    [WalletTransactionType.BattleWin]: "Battle Win",
  };

  const date = new Date(Number(tx.timestamp / 1_000_000n));

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 px-4">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          isCredit ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"
        }`}
      >
        {isCredit ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold font-body text-gray-900">
          {typeLabel[tx.txType]}
        </p>
        <p className="text-xs text-gray-400 font-body">
          {date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
        {tx.notes && (
          <p className="text-xs text-gray-400 font-body truncate">{tx.notes}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <span
          className={`text-sm font-bold font-body ${
            isCredit ? "text-green-600" : "text-red-500"
          }`}
        >
          {isCredit ? "+" : "-"}₹{paisaToRupees(tx.amount)}
        </span>
        <TxStatusBadge status={tx.status} />
      </div>
    </div>
  );
}

function WalletForm({
  type,
  onSubmit,
  isPending,
  defaultUpiOrBank,
}: {
  type: "deposit" | "withdraw";
  onSubmit: (amount: number, upiOrBank: string) => Promise<void>;
  isPending: boolean;
  defaultUpiOrBank?: string;
}) {
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState("");
  const [upiOrBank, setUpiOrBank] = useState(defaultUpiOrBank ?? "");

  const effectiveAmount = customAmount
    ? Number.parseFloat(customAmount)
    : amount;
  const isDeposit = type === "deposit";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveAmount || effectiveAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!upiOrBank.trim()) {
      toast.error("Enter your UPI ID or bank details");
      return;
    }
    await onSubmit(effectiveAmount, upiOrBank.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <div>
        <Label className="text-sm font-body mb-2 block text-gray-700">
          Amount
        </Label>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {AMOUNT_PRESETS.map((preset) => (
            <button
              type="button"
              key={preset}
              className={`amount-chip ${
                amount === preset && !customAmount ? "selected" : ""
              }`}
              onClick={() => {
                setAmount(preset);
                setCustomAmount("");
              }}
            >
              ₹{preset}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-body text-sm">
            ₹
          </span>
          <Input
            type="number"
            placeholder="Custom amount"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setAmount(0);
            }}
            className="pl-7 border-gray-200 bg-gray-50"
            min="1"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-body mb-2 block text-gray-700">
          {isDeposit
            ? "Your UPI ID / Bank Account"
            : "Withdraw to UPI / Bank Account"}
        </Label>
        <Input
          value={upiOrBank}
          onChange={(e) => setUpiOrBank(e.target.value)}
          placeholder={
            isDeposit
              ? "yourname@upi or Account Number"
              : "yourname@upi or IFSC + Account"
          }
          className="border-gray-200 bg-gray-50"
        />
        <p className="text-xs text-gray-400 font-body mt-1">
          {isDeposit
            ? "Our team will credit your wallet after payment verification"
            : "Withdrawal processed within 24 hours"}
        </p>
      </div>

      <Button
        type="submit"
        disabled={isPending || !effectiveAmount}
        className={`w-full h-11 font-bold font-body ${
          isDeposit ? "btn-green" : "btn-blue"
        }`}
      >
        {isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
        {isPending
          ? "Processing..."
          : isDeposit
            ? `＋ Add ₹${effectiveAmount || 0}`
            : `🎒 Withdraw ₹${effectiveAmount || 0}`}
      </Button>
    </form>
  );
}

export default function WalletPage() {
  const { data: me, isLoading: meLoading } = useGetMe();
  const { actor, isFetching } = useActor();
  const requestDeposit = useRequestDeposit();
  const requestWithdrawal = useRequestWithdrawal();
  const saveAccountNumber = useSaveAccountNumber();
  const [activeTab, setActiveTab] = useState<
    "deposit" | "withdraw" | "history"
  >("deposit");
  const [editingAccount, setEditingAccount] = useState(false);
  const [accountValue, setAccountValue] = useState("");

  const savedAccount = me?.accountNumber ?? "";
  const depositBalance = me ? paisaToRupees(me.walletBalance) : "0";

  const { data: txHistory = [], isLoading: txLoading } = useQuery<
    WalletTransaction[]
  >({
    queryKey: ["myTransactions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPendingTransactions();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });

  const winningBalance = txHistory
    .filter((tx) => tx.txType === WalletTransactionType.BattleWin)
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  const winningBalanceStr = (winningBalance / 100).toFixed(0);

  const totalBalance = me
    ? (Number(me.walletBalance) / 100 + winningBalance / 100).toFixed(0)
    : "0";

  async function handleDeposit(amount: number, upiOrBank: string) {
    try {
      await requestDeposit.mutateAsync({
        amount: rupeesToPaise(amount),
        upiOrBank,
      });
      toast.success(
        "Deposit request submitted! We'll credit your wallet shortly.",
      );
    } catch {
      toast.error("Failed to submit deposit request");
    }
  }

  async function handleWithdraw(amount: number, upiOrBank: string) {
    const balance = me ? Number(me.walletBalance) / 100 : 0;
    if (amount > balance) {
      toast.error(
        `Insufficient balance. You have ₹${paisaToRupees(me?.walletBalance ?? 0n)}`,
      );
      return;
    }
    try {
      await requestWithdrawal.mutateAsync({
        amount: rupeesToPaise(amount),
        upiOrBank,
      });
      toast.success(
        "Withdrawal request submitted! Processing within 24 hours.",
      );
    } catch {
      toast.error("Failed to submit withdrawal request");
    }
  }

  async function handleSaveAccount() {
    if (!accountValue.trim()) {
      toast.error("Enter a valid UPI ID or bank account number");
      return;
    }
    try {
      await saveAccountNumber.mutateAsync(accountValue.trim());
      toast.success("Account number saved successfully");
      setEditingAccount(false);
    } catch {
      toast.error("Failed to save account number");
    }
  }

  return (
    <div className="flex flex-col">
      {/* Page title row */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <h1 className="text-lg font-display font-black text-gray-900">
          My Balance
        </h1>
        <span className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-body">
          Total: ₹{totalBalance}
        </span>
      </div>

      <div className="flex flex-col gap-3 p-3">
        {/* DEPOSIT CASH card */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="light-card p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-2xl">
              💵
            </div>
            <div>
              <p className="text-xs text-gray-400 font-body uppercase tracking-wide font-semibold">
                DEPOSIT CASH
              </p>
              {meLoading ? (
                <Skeleton className="h-7 w-24 mt-1" />
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xl font-black text-green-600">₹</span>
                  <span className="text-xl font-black text-green-600 font-body">
                    {depositBalance}
                  </span>
                </div>
              )}
            </div>
          </div>
          <Button
            className="w-full h-11 btn-green text-sm"
            onClick={() => setActiveTab("deposit")}
          >
            ＋ Add Cash
          </Button>
        </motion.div>

        {/* WINNING CASH card */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="light-card p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-2xl">
              🏆
            </div>
            <div>
              <p className="text-xs text-gray-400 font-body uppercase tracking-wide font-semibold">
                WINNING CASH
              </p>
              <div className="flex items-center gap-1">
                <span className="text-xl font-black text-orange-500">₹</span>
                <span className="text-xl font-black text-orange-500 font-body">
                  {winningBalanceStr}
                </span>
              </div>
            </div>
          </div>
          <Button
            className="w-full h-11 btn-blue text-sm"
            onClick={() => setActiveTab("withdraw")}
          >
            🎒 Withdraw
          </Button>
        </motion.div>

        {/* Saved Account */}
        <div className="light-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">💳</span>
            <span className="text-sm font-bold text-gray-700 font-body">
              Saved UPI / Account
            </span>
            {!editingAccount && (
              <button
                type="button"
                className="ml-auto text-gray-400 hover:text-blue-500 transition-colors"
                onClick={() => {
                  setAccountValue(savedAccount);
                  setEditingAccount(true);
                }}
              >
                <Pencil size={14} />
              </button>
            )}
          </div>
          {editingAccount ? (
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                value={accountValue}
                onChange={(e) => setAccountValue(e.target.value)}
                placeholder="yourname@upi or Bank Account No."
                className="bg-gray-50 border-gray-200 h-9 text-sm flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveAccount();
                  if (e.key === "Escape") setEditingAccount(false);
                }}
              />
              <Button
                size="sm"
                onClick={handleSaveAccount}
                disabled={saveAccountNumber.isPending}
                className="h-9 px-3 btn-green text-xs"
              >
                {saveAccountNumber.isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
              <button
                type="button"
                onClick={() => setEditingAccount(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <p className="text-sm font-body text-gray-600">
              {savedAccount || (
                <span className="text-gray-400 italic">
                  Not set — tap pencil to add
                </span>
              )}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-gray-100 p-1 border border-gray-200">
          {(["deposit", "withdraw", "history"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-semibold font-body rounded-lg capitalize transition-all duration-200 ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "deposit"
                ? "Add Cash"
                : tab === "withdraw"
                  ? "Withdraw"
                  : "History"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15 }}
          className="light-card overflow-hidden"
        >
          {activeTab === "deposit" && (
            <div>
              <div className="flex items-center gap-2 px-4 pt-4 pb-0">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <ArrowDownCircle size={16} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-gray-900">
                    Add Money
                  </h3>
                  <p className="text-xs text-gray-400 font-body">
                    Funds credited after verification
                  </p>
                </div>
              </div>
              <WalletForm
                type="deposit"
                onSubmit={handleDeposit}
                isPending={requestDeposit.isPending}
                defaultUpiOrBank={savedAccount}
              />
            </div>
          )}

          {activeTab === "withdraw" && (
            <div>
              <div className="flex items-center gap-2 px-4 pt-4 pb-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <ArrowUpCircle size={16} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-gray-900">
                    Withdraw
                  </h3>
                  <p className="text-xs text-gray-400 font-body">
                    Processed within 24 hours
                  </p>
                </div>
              </div>
              <WalletForm
                type="withdraw"
                onSubmit={handleWithdraw}
                isPending={requestWithdrawal.isPending}
                defaultUpiOrBank={savedAccount}
              />
            </div>
          )}

          {activeTab === "history" && (
            <div>
              <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                <Clock size={16} className="text-gray-400" />
                <h3 className="font-display font-bold text-base text-gray-900">
                  Transaction History
                </h3>
              </div>

              {txLoading ? (
                <div className="flex flex-col gap-0 px-4 pb-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg mb-2" />
                  ))}
                </div>
              ) : txHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Clock size={28} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm font-body">
                    No transactions yet
                  </p>
                </div>
              ) : (
                <div>
                  {txHistory.map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} />
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Info box */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs text-blue-700 font-body leading-relaxed">
            💡 <strong>How it works:</strong> Add money via UPI/bank transfer.
            Join battles and win. Withdraw winnings directly to your bank
            account. All transactions are manually verified for security.
          </p>
        </div>
      </div>
    </div>
  );
}
