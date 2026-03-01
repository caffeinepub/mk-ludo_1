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
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Plus, Swords } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { SiWhatsapp } from "react-icons/si";
import { toast } from "sonner";
import { BattleStatus } from "../backend.d";
import type { Battle } from "../backend.d";
import { BattleStatusBadge } from "../components/StatusBadge";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  paisaToRupees,
  rupeesToPaise,
  useCreateBattle,
  useGetMe,
  useJoinBattle,
  useListBattles,
} from "../hooks/useQueries";

const FEE_PRESETS = [10, 25, 50, 100];

function BattleCard({
  battle,
  myPrincipal,
  onJoin,
  isJoining,
}: {
  battle: Battle;
  myPrincipal?: string;
  onJoin: (id: string) => void;
  isJoining: boolean;
}) {
  const navigate = useNavigate();
  const isMine =
    battle.creator.toString() === myPrincipal ||
    battle.opponent?.toString() === myPrincipal;
  const canJoin =
    battle.status === BattleStatus.Open &&
    battle.creator.toString() !== myPrincipal;

  const creatorShort = `${battle.creator.toString().slice(0, 8)}...`;
  const opponentShort = battle.opponent
    ? `${battle.opponent.toString().slice(0, 8)}...`
    : "Waiting...";
  const prize = (Number(battle.entryFee) * 2) / 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="battle-card overflow-hidden"
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <span className="text-xs text-gray-500 font-body">Playing For</span>
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-purple-600 font-body">
            {creatorShort}
          </span>
          <span className="text-gray-400 text-xs">vs</span>
          <span className="text-xs font-bold text-purple-600 font-body">
            {opponentShort}
          </span>
        </div>
        {isMine && (
          <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">
            Mine
          </span>
        )}
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between px-3 py-3">
        {/* Entry fee */}
        <div className="flex flex-col items-start gap-0.5">
          <span className="text-[10px] text-gray-400 font-body uppercase tracking-wide">
            Entry Fee
          </span>
          <div className="flex items-center gap-1">
            <span className="text-base">🪙</span>
            <span className="text-sm font-black text-gray-900 font-body">
              ₹{paisaToRupees(battle.entryFee)}
            </span>
          </div>
        </div>

        {/* Center: swords + status + action */}
        <div className="flex flex-col items-center gap-1">
          <Swords size={20} className="text-gray-400" />
          <BattleStatusBadge status={battle.status} />
          {isMine ? (
            <Button
              size="sm"
              className="h-7 px-3 text-xs bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() =>
                navigate({
                  to: "/battle/$battleId",
                  params: { battleId: battle.id },
                })
              }
            >
              Enter
            </Button>
          ) : canJoin ? (
            <Button
              size="sm"
              className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
              disabled={isJoining}
              onClick={() => onJoin(battle.id)}
            >
              {isJoining ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                "Join"
              )}
            </Button>
          ) : null}
        </div>

        {/* Winning prize */}
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[10px] text-gray-400 font-body uppercase tracking-wide">
            Prize
          </span>
          <div className="flex items-center gap-1">
            <span className="text-sm font-black text-green-600 font-body">
              ₹{prize.toFixed(0)}
            </span>
            <span className="text-base">🪙</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function LobbyPage() {
  const { identity } = useInternetIdentity();
  const { data: me } = useGetMe();
  const { data: battles = [], isLoading } = useListBattles();
  const createBattle = useCreateBattle();
  const joinBattle = useJoinBattle();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedFee, setSelectedFee] = useState<number>(50);
  const [customFee, setCustomFee] = useState("");
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const myPrincipal = identity?.getPrincipal().toString();

  const myBattles = battles.filter(
    (b) =>
      b.creator.toString() === myPrincipal ||
      b.opponent?.toString() === myPrincipal,
  );
  const openBattles = battles.filter(
    (b) =>
      b.status === BattleStatus.Open && b.creator.toString() !== myPrincipal,
  );
  const activeBattles = battles.filter((b) => b.status === BattleStatus.Active);

  const effectiveFee = customFee ? Number.parseFloat(customFee) : selectedFee;

  async function handleCreate() {
    if (!effectiveFee || effectiveFee <= 0) {
      toast.error("Please enter a valid entry fee");
      return;
    }
    const balance = me ? Number(me.walletBalance) / 100 : 0;
    if (effectiveFee > balance) {
      toast.error(
        `Insufficient balance. You have ₹${paisaToRupees(me?.walletBalance ?? 0n)}`,
      );
      return;
    }
    try {
      await createBattle.mutateAsync(rupeesToPaise(effectiveFee));
      toast.success(`Battle created for ₹${effectiveFee}!`);
      setShowCreate(false);
    } catch {
      toast.error("Failed to create battle");
    }
  }

  async function handleJoin(battleId: string) {
    const battle = battles.find((b) => b.id === battleId);
    if (!battle) return;
    const balance = me ? Number(me.walletBalance) / 100 : 0;
    if (Number(battle.entryFee) / 100 > balance) {
      toast.error(
        `Insufficient balance. You need ₹${paisaToRupees(battle.entryFee)}`,
      );
      return;
    }
    setJoiningId(battleId);
    try {
      await joinBattle.mutateAsync(battleId);
      toast.success("Joined battle! Head to Battle Room.");
    } catch {
      toast.error("Failed to join battle");
    } finally {
      setJoiningId(null);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Announcement bar */}
      <div
        className="overflow-hidden py-2 px-4"
        style={{ background: "#000000" }}
      >
        <p className="marquee-text text-xs text-white font-body">
          📢 WhatsApp Support: 7240396548 &nbsp;&nbsp;&nbsp; 🎮 Play Ludo King
          &amp; Win Real Cash! &nbsp;&nbsp;&nbsp; 💰 Instant Withdrawals
          Available &nbsp;&nbsp;&nbsp; 📢 WhatsApp Support: 7240396548
        </p>
      </div>

      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden"
        style={{ background: "#1a1a2e" }}
      >
        <img
          src="/assets/generated/ludo-hero-banner.dim_1200x400.jpg"
          alt="MK Ludo Arena"
          className="w-full h-40 object-cover opacity-80"
        />
        <div
          className="absolute inset-0 flex items-end justify-between p-4"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)",
          }}
        >
          <div>
            <h1 className="text-xl font-display font-black text-white leading-tight">
              Play Ludo. Win Real Cash.
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-pink-400 bg-pink-400/20 px-2 py-0.5 rounded-full">
                ● LIVE
              </span>
              <span className="text-[10px] font-bold text-pink-400 bg-pink-400/20 px-2 py-0.5 rounded-full">
                ●{" "}
                {battles.filter((b) => b.status === BattleStatus.Active).length}{" "}
                Active
              </span>
            </div>
          </div>
          <Button
            className="h-9 px-5 text-sm font-bold rounded-xl font-body"
            style={{ background: "#f5c518", color: "#000" }}
            onClick={() => setShowCreate(true)}
          >
            PLAY NOW
          </Button>
        </div>
      </motion.div>

      {/* Game cards row */}
      <div className="grid grid-cols-2 gap-3 p-3">
        {/* Ludo Classic card */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl overflow-hidden cursor-pointer relative"
          style={{ background: "#000", minHeight: 100 }}
          onClick={() => setShowCreate(true)}
        >
          <img
            src="/assets/generated/ludo-hero-banner.dim_1200x400.jpg"
            alt="Ludo Classic"
            className="w-full h-24 object-cover opacity-60"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-end p-2">
            <span className="text-white font-display font-black text-sm text-center drop-shadow">
              Ludo Classic
            </span>
          </div>
          <div className="absolute top-2 left-2">
            <span className="text-[9px] font-bold text-pink-400 bg-black/60 px-1.5 py-0.5 rounded-full">
              ● LIVE
            </span>
          </div>
        </motion.div>

        {/* Support / WhatsApp card */}
        <motion.a
          href="https://wa.me/917240396548"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer"
          style={{ background: "#000", minHeight: 100 }}
        >
          <SiWhatsapp size={36} color="#25D366" />
          <span className="text-white font-body font-bold text-xs text-center">
            WhatsApp Support
          </span>
        </motion.a>
      </div>

      {/* Open Battles section */}
      <div className="mx-3 mb-2 rounded-xl overflow-hidden border border-gray-200">
        {/* Section header */}
        <div className="section-header-bar flex items-center gap-2">
          <Swords size={14} className="text-white" />
          <span>⚔️ Open Battles</span>
          <div className="ml-auto">
            <Button
              size="sm"
              className="h-7 px-3 text-xs font-bold"
              style={{ background: "#25D366", color: "#fff" }}
              onClick={() => setShowCreate(true)}
            >
              <Plus size={12} className="mr-1" />
              Create
            </Button>
          </div>
        </div>
        <div className="divide-y divide-gray-100 bg-white">
          {isLoading ? (
            <div className="flex flex-col gap-0">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-none" />
              ))}
            </div>
          ) : openBattles.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-400 text-sm font-body">
                No open battles right now
              </p>
              <button
                type="button"
                className="mt-2 text-sm text-blue-600 font-semibold font-body underline"
                onClick={() => setShowCreate(true)}
              >
                Create one!
              </button>
            </div>
          ) : (
            openBattles.map((battle) => (
              <BattleCard
                key={battle.id}
                battle={battle}
                myPrincipal={myPrincipal}
                onJoin={handleJoin}
                isJoining={joiningId === battle.id}
              />
            ))
          )}
        </div>
      </div>

      {/* Running Battles section */}
      <div className="mx-3 mb-4 rounded-xl overflow-hidden border border-gray-200">
        <div className="section-header-bar flex items-center gap-2">
          <Swords size={14} className="text-white" />
          <span>⚔️ Running Battles</span>
          <span className="ml-auto text-xs text-green-400 font-bold">
            {activeBattles.length +
              myBattles.filter((b) => b.status === BattleStatus.Active)
                .length}{" "}
            Active
          </span>
        </div>
        <div className="divide-y divide-gray-100 bg-white">
          {isLoading ? (
            <Skeleton className="h-20 w-full rounded-none" />
          ) : activeBattles.length === 0 &&
            myBattles.filter((b) => b.status !== BattleStatus.Open).length ===
              0 ? (
            <div className="py-6 text-center">
              <p className="text-gray-400 text-sm font-body">
                No battles running right now
              </p>
            </div>
          ) : (
            [
              ...myBattles,
              ...activeBattles.filter(
                (b) =>
                  b.creator.toString() !== myPrincipal &&
                  b.opponent?.toString() !== myPrincipal,
              ),
            ].map((battle) => (
              <BattleCard
                key={battle.id}
                battle={battle}
                myPrincipal={myPrincipal}
                onJoin={handleJoin}
                isJoining={joiningId === battle.id}
              />
            ))
          )}
        </div>
      </div>

      {/* Create Battle Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-white border-gray-200 max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-gray-900">
              Create Battle
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-5 py-2">
            {me && (
              <div className="flex items-center justify-between text-sm rounded-lg bg-gray-50 px-3 py-2 border border-gray-200">
                <span className="text-gray-500 font-body">Your Balance</span>
                <span className="font-bold text-green-600 font-body">
                  ₹{paisaToRupees(me.walletBalance)}
                </span>
              </div>
            )}

            <div>
              <Label className="font-body text-sm mb-3 block text-gray-700">
                Entry Fee
              </Label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {FEE_PRESETS.map((fee) => (
                  <button
                    key={fee}
                    type="button"
                    className={`amount-chip text-center ${
                      selectedFee === fee && !customFee ? "selected" : ""
                    }`}
                    onClick={() => {
                      setSelectedFee(fee);
                      setCustomFee("");
                    }}
                  >
                    ₹{fee}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-body">
                  ₹
                </span>
                <Input
                  type="number"
                  placeholder="Custom amount"
                  value={customFee}
                  onChange={(e) => {
                    setCustomFee(e.target.value);
                    setSelectedFee(0);
                  }}
                  className="pl-7 border-gray-200 bg-gray-50"
                  min="1"
                />
              </div>
            </div>

            <p className="text-xs text-gray-400 font-body">
              Entry fee deducted from wallet. Winner takes both entries.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreate(false)}
              className="flex-1 border-gray-200 font-body text-gray-600"
            >
              Cancel
            </Button>
            <Button
              className="flex-1 btn-green"
              onClick={handleCreate}
              disabled={createBattle.isPending || effectiveFee <= 0}
            >
              {createBattle.isPending ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : null}
              Create ₹{effectiveFee || 0}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
