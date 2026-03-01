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
import {
  ChevronRight,
  Loader2,
  Plus,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="battle-card glass-card rounded-xl p-4 relative overflow-hidden cursor-pointer"
      onClick={() =>
        isMine &&
        navigate({ to: "/battle/$battleId", params: { battleId: battle.id } })
      }
    >
      {/* Gold top strip for my battles */}
      {isMine && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent" />
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
            <Swords size={18} className="text-gold" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold font-display text-gold">
                ₹{paisaToRupees(battle.entryFee)}
              </span>
              <BattleStatusBadge status={battle.status} />
              {isMine && (
                <span className="text-xs text-muted-foreground font-body bg-muted/40 px-2 py-0.5 rounded-full">
                  Mine
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-body mt-0.5 truncate">
              ID: {battle.id.slice(0, 12)}...
            </p>
            <p className="text-xs text-muted-foreground/60 font-body">
              {battle.opponent ? "2 players" : "1 player"}
            </p>
          </div>
        </div>

        <div className="flex-shrink-0">
          {isMine ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-gold border border-gold/30 hover:bg-gold/10 h-9 px-3"
              onClick={(e) => {
                e.stopPropagation();
                navigate({
                  to: "/battle/$battleId",
                  params: { battleId: battle.id },
                });
              }}
            >
              Enter <ChevronRight size={14} className="ml-1" />
            </Button>
          ) : canJoin ? (
            <Button
              size="sm"
              className="btn-gold h-9 px-4"
              disabled={isJoining}
              onClick={(e) => {
                e.stopPropagation();
                onJoin(battle.id);
              }}
            >
              {isJoining ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                "Join"
              )}
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground font-body px-2">
              Full
            </span>
          )}
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
    <div className="flex flex-col gap-6">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-2xl overflow-hidden"
      >
        <img
          src="/assets/generated/ludo-hero-banner.dim_1200x400.jpg"
          alt="MK Ludo Arena"
          className="w-full h-40 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-display font-black text-foreground leading-tight">
              Battle <span className="text-gold">Arena</span>
            </h1>
            <p className="text-sm text-muted-foreground font-body">
              Play Ludo King. Win Real Money.
            </p>
          </div>
          <Button
            className="btn-gold h-11 px-5 text-sm font-display font-bold"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} className="mr-1.5" />
            Create Battle
          </Button>
        </div>
      </motion.div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            icon: Swords,
            value: `${battles.filter((b) => b.status === BattleStatus.Open).length}`,
            label: "Open",
          },
          {
            icon: Users,
            value: `${battles.filter((b) => b.status === BattleStatus.Active).length}`,
            label: "Live",
          },
          {
            icon: Trophy,
            value: `${battles.filter((b) => b.status === BattleStatus.Completed).length}`,
            label: "Completed",
          },
        ].map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="glass-card rounded-xl p-3 flex flex-col items-center gap-1 border border-border/50"
          >
            <Icon size={16} className="text-gold" />
            <span className="text-xl font-bold font-display text-foreground">
              {value}
            </span>
            <span className="text-xs text-muted-foreground font-body">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* My Battles */}
      {myBattles.length > 0 && (
        <section>
          <h2 className="text-lg font-display font-bold text-foreground mb-3 flex items-center gap-2">
            <Trophy size={18} className="text-gold" />
            My Battles
          </h2>
          <div className="flex flex-col gap-3">
            {myBattles.map((battle) => (
              <BattleCard
                key={battle.id}
                battle={battle}
                myPrincipal={myPrincipal}
                onJoin={handleJoin}
                isJoining={joiningId === battle.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Open Battles */}
      <section>
        <h2 className="text-lg font-display font-bold text-foreground mb-3 flex items-center gap-2">
          <Swords size={18} className="text-gold" />
          Open Battles
        </h2>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl bg-card/50" />
            ))}
          </div>
        ) : openBattles.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center border border-border/40">
            <Swords
              size={32}
              className="text-muted-foreground mx-auto mb-3 opacity-40"
            />
            <p className="text-muted-foreground font-body text-sm">
              No open battles right now.
            </p>
            <p className="text-muted-foreground/60 font-body text-xs mt-1">
              Create one and challenge a friend!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {openBattles.map((battle) => (
              <BattleCard
                key={battle.id}
                battle={battle}
                myPrincipal={myPrincipal}
                onJoin={handleJoin}
                isJoining={joiningId === battle.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Create Battle Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Create Battle
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-5 py-2">
            {me && (
              <div className="flex items-center justify-between text-sm rounded-lg bg-muted/30 px-3 py-2">
                <span className="text-muted-foreground font-body">
                  Your Balance
                </span>
                <span className="font-bold text-gold font-display">
                  ₹{paisaToRupees(me.walletBalance)}
                </span>
              </div>
            )}

            <div>
              <Label className="font-body text-sm mb-3 block">Entry Fee</Label>
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-body">
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
                  className="pl-7 bg-input/50 border-border"
                  min="1"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground font-body">
              Entry fee will be deducted from your wallet. Winner takes both
              entries.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreate(false)}
              className="flex-1 border-border font-body"
            >
              Cancel
            </Button>
            <Button
              className="btn-gold flex-1"
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
