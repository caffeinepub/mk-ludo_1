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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  Clock,
  Copy,
  Loader2,
  Send,
  Swords,
  Trophy,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
// ExternalBlob runtime class - imported from backend module
import { ExternalBlob } from "../backend";
import { BattleStatus } from "../backend.d";
import { BattleStatusBadge } from "../components/StatusBadge";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  paisaToRupees,
  useClaimWin,
  useGetBattleRoom,
  useSendChatMessage,
} from "../hooks/useQueries";

function RoomCodeBox({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Room code copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative rounded-xl border border-gold/40 bg-gold/5 p-4 animate-gold-pulse"
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-gold/5 via-transparent to-gold/5" />
      <p className="text-xs text-gold/80 font-body uppercase tracking-widest mb-2">
        Ludo King Room Code
      </p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-3xl font-black font-display text-gold tracking-widest">
          {code}
        </span>
        <button
          type="button"
          onClick={copyCode}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gold/15 hover:bg-gold/25 text-gold transition-colors text-sm font-semibold font-body"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </motion.div>
  );
}

export default function BattleRoomPage() {
  // TanStack Router: access route params via the strict param selector
  const { battleId } = useParams({ strict: false }) as { battleId: string };
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: roomData, isLoading } = useGetBattleRoom(battleId ?? "");
  const sendMessage = useSendChatMessage();
  const claimWin = useClaimWin();

  const [message, setMessage] = useState("");
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const myPrincipal = identity?.getPrincipal().toString();
  const battle = roomData?.battle;
  const messages = roomData?.messages ?? [];

  // Scroll to bottom when new messages arrive
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages.length is intentional trigger
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  async function handleSend() {
    if (!message.trim() || !battleId) return;
    try {
      await sendMessage.mutateAsync({ battleId, text: message.trim() });
      setMessage("");
    } catch {
      toast.error("Failed to send message");
    }
  }

  async function handleClaimWin() {
    if (!screenshotFile || !battleId) {
      toast.error("Please upload a screenshot as evidence");
      return;
    }

    try {
      const bytes = new Uint8Array(await screenshotFile.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setUploadProgress(pct);
      });

      await claimWin.mutateAsync({ battleId, evidenceBlobId: blob });
      toast.success("Win claim submitted! Waiting for admin verification.");
      setShowClaimModal(false);
      setScreenshotFile(null);
      setUploadProgress(0);
    } catch {
      toast.error("Failed to submit win claim");
    }
  }

  if (!battleId) {
    navigate({ to: "/" });
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-32 bg-muted/40" />
        <Skeleton className="h-32 w-full rounded-xl bg-muted/40" />
        <Skeleton className="h-64 w-full rounded-xl bg-muted/40" />
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <AlertCircle size={40} className="text-destructive/60" />
        <p className="text-muted-foreground font-body">Battle not found</p>
        <Button variant="outline" onClick={() => navigate({ to: "/" })}>
          Back to Lobby
        </Button>
      </div>
    );
  }

  const isMyBattle =
    battle.creator.toString() === myPrincipal ||
    battle.opponent?.toString() === myPrincipal;

  const canClaim = isMyBattle && battle.status === BattleStatus.Active;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="w-9 h-9 rounded-full glass-card border border-border/50 flex items-center justify-center hover:border-gold/40 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-display font-bold">Battle Room</h1>
            <BattleStatusBadge status={battle.status} />
          </div>
          <p className="text-xs text-muted-foreground font-body">
            Entry: ₹{paisaToRupees(battle.entryFee)} each
          </p>
        </div>
      </div>

      {/* Battle Info Card */}
      <div className="glass-card rounded-xl p-4 border border-border/50">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground font-body mb-1">
              Player 1
            </p>
            <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center mx-auto mb-1">
              <Swords size={16} className="text-blue-400" />
            </div>
            <p className="text-sm font-bold font-body text-foreground truncate">
              {battle.creator.toString().slice(0, 8)}...
              {battle.creator.toString() === myPrincipal && (
                <span className="text-gold"> (You)</span>
              )}
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground font-body mb-1">
              Player 2
            </p>
            <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto mb-1">
              <Swords size={16} className="text-red-400" />
            </div>
            {battle.opponent ? (
              <p className="text-sm font-bold font-body text-foreground truncate">
                {battle.opponent.toString().slice(0, 8)}...
                {battle.opponent.toString() === myPrincipal && (
                  <span className="text-gold"> (You)</span>
                )}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground font-body italic">
                Waiting...
              </p>
            )}
          </div>
        </div>

        {/* Prize Pool */}
        <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-body">
            Prize Pool
          </span>
          <span className="text-lg font-black font-display text-gold">
            ₹{paisaToRupees(battle.entryFee * 2n)}
          </span>
        </div>
      </div>

      {/* Room Code (Active battle) */}
      {battle.status === BattleStatus.Active && battle.roomCode && (
        <RoomCodeBox code={battle.roomCode} />
      )}

      {/* Open - waiting for opponent */}
      {battle.status === BattleStatus.Open && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 flex items-center gap-3">
          <Clock size={18} className="text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold font-body text-yellow-300">
              Waiting for opponent
            </p>
            <p className="text-xs text-yellow-400/70 font-body">
              Share this battle ID with a friend to join:{" "}
              {battle.id.slice(0, 16)}...
            </p>
          </div>
        </div>
      )}

      {/* Pending Result */}
      {battle.status === BattleStatus.PendingResult && (
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 flex items-center gap-3">
          <Clock size={18} className="text-orange-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold font-body text-orange-300">
              Waiting for admin verification
            </p>
            <p className="text-xs text-orange-400/70 font-body">
              A win claim has been submitted. Admin will verify and settle.
            </p>
          </div>
        </div>
      )}

      {/* Disputed */}
      {battle.status === BattleStatus.Disputed && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold font-body text-red-300">
              Battle Disputed
            </p>
            <p className="text-xs text-red-400/70 font-body">
              Admin is reviewing this battle.
            </p>
          </div>
        </div>
      )}

      {/* Completed */}
      {battle.status === BattleStatus.Completed && battle.winner && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-xl border border-gold/40 bg-gold/10 p-5 text-center"
        >
          <Trophy size={32} className="text-gold mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-body mb-1">Winner</p>
          <p className="text-lg font-black font-display text-gold">
            {battle.winner.toString() === myPrincipal
              ? "🎉 You Won!"
              : `${battle.winner.toString().slice(0, 16)}...`}
          </p>
          <p className="text-2xl font-black font-display text-foreground mt-1">
            ₹{paisaToRupees(battle.entryFee * 2n)}
          </p>
        </motion.div>
      )}

      {/* Chat Section */}
      <div className="glass-card rounded-xl border border-border/50 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-border/40">
          <h3 className="font-display font-bold text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Battle Chat
          </h3>
        </div>

        <ScrollArea className="h-64 px-4 py-2">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground text-xs font-body py-8">
              No messages yet. Say hello!
            </p>
          ) : (
            <div className="flex flex-col gap-2.5 py-2">
              {messages.map((msg) => {
                const isMe = msg.sender.toString() === myPrincipal;
                const date = new Date(Number(msg.timestamp / 1_000_000n));
                const msgKey = `${msg.sender.toString()}-${msg.timestamp.toString()}`;
                return (
                  <div
                    key={msgKey}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm font-body ${
                        isMe
                          ? "bg-gold/20 text-foreground rounded-br-sm"
                          : "bg-muted/50 text-foreground rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-xs text-muted-foreground/60 font-body mt-0.5 px-1">
                      {date.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Chat Input */}
        <div className="px-3 py-3 border-t border-border/40 flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="bg-input/50 border-border text-sm"
            disabled={!isMyBattle}
          />
          <Button
            size="icon"
            className="btn-gold w-10 h-10 flex-shrink-0"
            onClick={handleSend}
            disabled={!message.trim() || sendMessage.isPending || !isMyBattle}
          >
            {sendMessage.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>
      </div>

      {/* Declare Winner Button */}
      {canClaim && (
        <Button
          className="btn-gold w-full h-12 text-base font-display font-bold"
          onClick={() => setShowClaimModal(true)}
        >
          <Trophy size={18} className="mr-2" />
          Declare Winner & Upload Screenshot
        </Button>
      )}

      {/* Claim Win Dialog */}
      <Dialog open={showClaimModal} onOpenChange={setShowClaimModal}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Trophy size={20} className="text-gold" />
              Claim Victory
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-5 py-2">
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3">
              <p className="text-xs text-yellow-300 font-body leading-relaxed">
                ⚠️ Upload a clear screenshot of your Ludo King win screen. False
                claims will result in account suspension.
              </p>
            </div>

            <div>
              <Label className="text-sm font-body mb-2 block">
                Upload Win Screenshot *
              </Label>
              <button
                type="button"
                className="w-full border-2 border-dashed border-border/60 rounded-xl p-6 text-center cursor-pointer hover:border-gold/40 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    setScreenshotFile(e.target.files?.[0] ?? null)
                  }
                />
                {screenshotFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <Check size={24} className="text-green-400" />
                    <p className="text-sm font-semibold font-body text-green-300">
                      {screenshotFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-body">
                      {(screenshotFile.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload size={24} className="text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground font-body">
                      Tap to upload screenshot
                    </p>
                    <p className="text-xs text-muted-foreground/60 font-body">
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                )}
              </button>
            </div>

            {claimWin.isPending && uploadProgress > 0 && (
              <div>
                <div className="flex justify-between text-xs text-muted-foreground font-body mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowClaimModal(false)}
              className="flex-1 border-border font-body"
              disabled={claimWin.isPending}
            >
              Cancel
            </Button>
            <Button
              className="btn-gold flex-1"
              onClick={handleClaimWin}
              disabled={claimWin.isPending || !screenshotFile}
            >
              {claimWin.isPending ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <Trophy size={16} className="mr-2" />
              )}
              Submit Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
