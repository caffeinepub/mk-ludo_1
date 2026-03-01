import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Principal } from "@icp-sdk/core/principal";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Check,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Swords,
  UserCog,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { BattleStatus, WalletTransactionType } from "../backend.d";
import type { Battle, WalletTransaction, WinnerClaim } from "../backend.d";
import { BattleStatusBadge, TxStatusBadge } from "../components/StatusBadge";
import {
  paisaToRupees,
  useApproveDeposit,
  useApproveWin,
  useApproveWithdrawal,
  useIsCallerAdmin,
  useListAllBattles,
  useListPendingClaims,
  useListPendingTransactions,
  useRejectClaim,
  useRejectWithdrawal,
  useSetAdmin,
} from "../hooks/useQueries";

type TabId = "battles" | "claims" | "transactions" | "admin";

const TABS: { id: TabId; label: string; icon: typeof Swords }[] = [
  { id: "battles", label: "Battles", icon: Swords },
  { id: "claims", label: "Claims", icon: ShieldCheck },
  { id: "transactions", label: "Transactions", icon: Wallet },
  { id: "admin", label: "Settings", icon: UserCog },
];

function BattleRow({ battle }: { battle: Battle }) {
  return (
    <div className="flex flex-col gap-1.5 p-3 border-b border-border/40 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <code className="text-xs text-muted-foreground font-mono bg-muted/30 px-2 py-0.5 rounded">
          {battle.id.slice(0, 16)}...
        </code>
        <BattleStatusBadge status={battle.status} />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-body text-xs">
          Fee:{" "}
          <span className="text-foreground font-semibold">
            ₹{paisaToRupees(battle.entryFee)}
          </span>
        </span>
        <span className="text-muted-foreground font-body text-xs">
          {battle.opponent ? "2 players" : "1 player"}
        </span>
      </div>
      {battle.winner && (
        <p className="text-xs text-green-400 font-body">
          Winner: {battle.winner.toString().slice(0, 16)}...
        </p>
      )}
    </div>
  );
}

function ClaimRow({ claim }: { claim: WinnerClaim }) {
  const approveWin = useApproveWin();
  const rejectClaim = useRejectClaim();
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  async function handleApprove() {
    try {
      await approveWin.mutateAsync({
        battleId: claim.battleId,
        winner: claim.claimedWinner,
      });
      toast.success("Win approved!");
    } catch {
      toast.error("Failed to approve win");
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      toast.error("Enter a rejection reason");
      return;
    }
    try {
      await rejectClaim.mutateAsync({
        battleId: claim.battleId,
        reason: rejectReason,
      });
      toast.success("Claim rejected");
      setShowReject(false);
    } catch {
      toast.error("Failed to reject claim");
    }
  }

  const screenshotUrl = claim.evidenceBlobId.getDirectURL();

  return (
    <div className="p-3 border-b border-border/40 last:border-0">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <code className="text-xs text-muted-foreground font-mono bg-muted/30 px-2 py-0.5 rounded block truncate">
            Battle: {claim.battleId.slice(0, 16)}...
          </code>
          <p className="text-xs text-muted-foreground font-body mt-1">
            Claimant:{" "}
            <span className="text-foreground">
              {claim.claimant.toString().slice(0, 12)}...
            </span>
          </p>
          <p className="text-xs text-muted-foreground font-body">
            Winner:{" "}
            <span className="text-green-400 font-semibold">
              {claim.claimedWinner.toString().slice(0, 12)}...
            </span>
          </p>
        </div>
        {screenshotUrl && (
          <a
            href={screenshotUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gold hover:text-gold/80 font-body flex-shrink-0 border border-gold/30 px-2 py-1 rounded-lg"
          >
            <ExternalLink size={12} />
            Screenshot
          </a>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 bg-green-600 hover:bg-green-700 text-white h-9 font-body text-xs"
          onClick={handleApprove}
          disabled={approveWin.isPending}
        >
          {approveWin.isPending ? (
            <Loader2 size={12} className="animate-spin mr-1" />
          ) : (
            <Check size={12} className="mr-1" />
          )}
          Approve
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="flex-1 h-9 font-body text-xs"
          onClick={() => setShowReject(true)}
          disabled={rejectClaim.isPending}
        >
          <X size={12} className="mr-1" />
          Reject
        </Button>
      </div>

      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Reject Claim</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Label className="text-sm font-body">Reason</Label>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Screenshot unclear, wrong game shown"
              className="bg-input/50"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowReject(false)}
              className="flex-1 border-border"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleReject}
              disabled={rejectClaim.isPending}
            >
              {rejectClaim.isPending ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : null}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const approveDeposit = useApproveDeposit();
  const approveWithdrawal = useApproveWithdrawal();
  const rejectWithdrawal = useRejectWithdrawal();

  const typeLabel: Record<WalletTransactionType, string> = {
    [WalletTransactionType.Deposit]: "Deposit",
    [WalletTransactionType.Withdrawal]: "Withdrawal",
    [WalletTransactionType.BattleEntry]: "Battle Entry",
    [WalletTransactionType.BattleWin]: "Battle Win",
  };

  async function handleApproveDeposit() {
    try {
      await approveDeposit.mutateAsync(tx.id);
      toast.success("Deposit approved!");
    } catch {
      toast.error("Failed to approve deposit");
    }
  }

  async function handleApproveWithdrawal() {
    try {
      await approveWithdrawal.mutateAsync(tx.id);
      toast.success("Withdrawal approved!");
    } catch {
      toast.error("Failed to approve withdrawal");
    }
  }

  async function handleRejectWithdrawal() {
    try {
      await rejectWithdrawal.mutateAsync(tx.id);
      toast.success("Withdrawal rejected");
    } catch {
      toast.error("Failed to reject withdrawal");
    }
  }

  return (
    <div className="p-3 border-b border-border/40 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-semibold font-body">
            {typeLabel[tx.txType]}
          </p>
          <p className="text-xs text-muted-foreground font-body">
            {tx.user.toString().slice(0, 16)}...
          </p>
          {tx.notes && (
            <p className="text-xs text-muted-foreground/60 font-body mt-0.5 truncate max-w-[180px]">
              {tx.notes}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-base font-bold font-display text-gold">
            ₹{paisaToRupees(tx.amount)}
          </span>
          <TxStatusBadge status={tx.status} />
        </div>
      </div>

      <div className="flex gap-2">
        {tx.txType === WalletTransactionType.Deposit && (
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white h-8 font-body text-xs"
            onClick={handleApproveDeposit}
            disabled={approveDeposit.isPending}
          >
            {approveDeposit.isPending ? (
              <Loader2 size={12} className="animate-spin mr-1" />
            ) : (
              <Check size={12} className="mr-1" />
            )}
            Approve Deposit
          </Button>
        )}

        {tx.txType === WalletTransactionType.Withdrawal && (
          <>
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white h-8 font-body text-xs"
              onClick={handleApproveWithdrawal}
              disabled={approveWithdrawal.isPending}
            >
              {approveWithdrawal.isPending ? (
                <Loader2 size={12} className="animate-spin mr-1" />
              ) : (
                <Check size={12} className="mr-1" />
              )}
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1 h-8 font-body text-xs"
              onClick={handleRejectWithdrawal}
              disabled={rejectWithdrawal.isPending}
            >
              <X size={12} className="mr-1" />
              Reject
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const [activeTab, setActiveTab] = useState<TabId>("battles");

  const { data: allBattles = [], isLoading: battlesLoading } =
    useListAllBattles();
  const { data: pendingClaims = [], isLoading: claimsLoading } =
    useListPendingClaims();
  const { data: pendingTxs = [], isLoading: txsLoading } =
    useListPendingTransactions();

  const [statusFilter, setStatusFilter] = useState<BattleStatus | "all">("all");
  const [newAdminPrincipal, setNewAdminPrincipal] = useState("");
  const setAdmin = useSetAdmin();

  async function handleSetAdmin() {
    if (!newAdminPrincipal.trim()) return;
    try {
      const principal = Principal.fromText(newAdminPrincipal.trim());
      await setAdmin.mutateAsync(principal);
      toast.success("Admin role assigned!");
      setNewAdminPrincipal("");
    } catch {
      toast.error("Invalid principal or failed to set admin");
    }
  }

  if (adminLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full rounded-xl bg-muted/40" />
        <Skeleton className="h-64 w-full rounded-xl bg-muted/40" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <AlertCircle size={40} className="text-destructive/60" />
        <p className="font-display font-bold text-xl">Access Denied</p>
        <p className="text-muted-foreground font-body text-sm text-center">
          You don't have admin privileges.
        </p>
        <Button variant="outline" onClick={() => navigate({ to: "/" })}>
          Back to Lobby
        </Button>
      </div>
    );
  }

  const filteredBattles =
    statusFilter === "all"
      ? allBattles
      : allBattles.filter((b) => b.status === statusFilter);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center">
          <ShieldCheck size={20} className="text-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-black">Admin Panel</h1>
          <p className="text-xs text-muted-foreground font-body">
            Manage battles, claims, and transactions
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: "All Battles",
            value: allBattles.length,
            color: "text-blue-400",
          },
          {
            label: "Pending Claims",
            value: pendingClaims.length,
            color: "text-yellow-400",
          },
          {
            label: "Pending Txs",
            value: pendingTxs.length,
            color: "text-orange-400",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="glass-card rounded-xl p-3 text-center border border-border/40"
          >
            <p className={`text-2xl font-black font-display ${color}`}>
              {value}
            </p>
            <p className="text-xs text-muted-foreground font-body">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-muted/30 p-1 border border-border/40 gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-2 text-xs font-semibold font-body rounded-lg flex items-center justify-center gap-1 transition-all duration-200 ${
              activeTab === id
                ? "bg-card text-foreground shadow-card"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="glass-card rounded-xl border border-border/50 overflow-hidden"
      >
        {/* Battles Tab */}
        {activeTab === "battles" && (
          <div>
            <div className="px-4 py-3 border-b border-border/40">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {(["all", ...Object.values(BattleStatus)] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1 rounded-full text-xs font-body font-semibold whitespace-nowrap transition-all ${
                      statusFilter === s
                        ? "bg-gold/20 text-gold border border-gold/40"
                        : "border border-border/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s === "all" ? "All" : s}
                  </button>
                ))}
              </div>
            </div>
            {battlesLoading ? (
              <div className="p-4 flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-16 w-full rounded-lg bg-muted/40"
                  />
                ))}
              </div>
            ) : filteredBattles.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm font-body py-8">
                No battles found
              </p>
            ) : (
              filteredBattles.map((battle) => (
                <BattleRow key={battle.id} battle={battle} />
              ))
            )}
          </div>
        )}

        {/* Claims Tab */}
        {activeTab === "claims" && (
          <div>
            <div className="px-4 py-3 border-b border-border/40">
              <h3 className="font-display font-bold text-sm">
                Pending Win Claims ({pendingClaims.length})
              </h3>
            </div>
            {claimsLoading ? (
              <div className="p-4 flex flex-col gap-3">
                {[1, 2].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-24 w-full rounded-lg bg-muted/40"
                  />
                ))}
              </div>
            ) : pendingClaims.length === 0 ? (
              <div className="text-center py-8">
                <Check size={28} className="text-green-400/40 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm font-body">
                  No pending claims
                </p>
              </div>
            ) : (
              pendingClaims.map((claim) => (
                <ClaimRow
                  key={`${claim.battleId}-${claim.claimant}`}
                  claim={claim}
                />
              ))
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div>
            <div className="px-4 py-3 border-b border-border/40">
              <h3 className="font-display font-bold text-sm">
                Pending Transactions ({pendingTxs.length})
              </h3>
            </div>
            {txsLoading ? (
              <div className="p-4 flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-20 w-full rounded-lg bg-muted/40"
                  />
                ))}
              </div>
            ) : pendingTxs.length === 0 ? (
              <div className="text-center py-8">
                <Wallet
                  size={28}
                  className="text-muted-foreground/30 mx-auto mb-2"
                />
                <p className="text-muted-foreground text-sm font-body">
                  No pending transactions
                </p>
              </div>
            ) : (
              pendingTxs.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
            )}
          </div>
        )}

        {/* Admin Settings Tab */}
        {activeTab === "admin" && (
          <div className="p-4 flex flex-col gap-5">
            <div>
              <h3 className="font-display font-bold text-base mb-1">
                Assign Admin Role
              </h3>
              <p className="text-xs text-muted-foreground font-body mb-4">
                Paste a principal ID to grant admin access
              </p>
              <div className="flex flex-col gap-3">
                <div>
                  <Label className="text-sm font-body mb-2 block">
                    Principal ID
                  </Label>
                  <Input
                    value={newAdminPrincipal}
                    onChange={(e) => setNewAdminPrincipal(e.target.value)}
                    placeholder="xxxxx-xxxxx-xxxxx-xxxxx-cai"
                    className="bg-input/50 font-mono text-xs"
                  />
                </div>
                <Button
                  className="btn-gold w-full h-11"
                  onClick={handleSetAdmin}
                  disabled={setAdmin.isPending || !newAdminPrincipal.trim()}
                >
                  {setAdmin.isPending ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : (
                    <Users size={16} className="mr-2" />
                  )}
                  Set as Admin
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground font-body leading-relaxed">
                ⚠️ <strong className="text-foreground">Warning:</strong>{" "}
                Assigning admin role gives full access to verify wins, approve
                transactions, and manage all battles. Only assign trusted
                accounts.
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
