import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExternalBlob } from "../backend";
import type {
  Battle,
  User,
  WalletTransaction,
  WinnerClaim,
} from "../backend.d";
import { UserRole } from "../backend.d";
import { useActor } from "./useActor";

// ── Helpers ──────────────────────────────────────────────────

export function paisaToRupees(paise: bigint): string {
  const rupees = Number(paise) / 100;
  return rupees.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function rupeesToPaise(rupees: number): bigint {
  return BigInt(Math.round(rupees * 100));
}

// ── Queries ──────────────────────────────────────────────────

export function useGetMe() {
  const { actor, isFetching } = useActor();
  return useQuery<User | null>({
    queryKey: ["me"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getMe();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();
  return useQuery<UserRole>({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) return UserRole.guest;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useListBattles() {
  const { actor, isFetching } = useActor();
  return useQuery<Battle[]>({
    queryKey: ["battles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listBattles();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
  });
}

export function useGetBattleRoom(battleId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<{
    messages: {
      battleId: string;
      sender: Principal;
      text: string;
      timestamp: bigint;
    }[];
    battle: Battle;
  }>({
    queryKey: ["battleRoom", battleId],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getBattleRoom(battleId);
    },
    enabled: !!actor && !isFetching && !!battleId,
    refetchInterval: 5_000,
  });
}

export function useGetCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

// Admin queries
export function useListAllBattles() {
  const { actor, isFetching } = useActor();
  return useQuery<Battle[]>({
    queryKey: ["allBattles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllBattles();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
  });
}

export function useListPendingClaims() {
  const { actor, isFetching } = useActor();
  return useQuery<WinnerClaim[]>({
    queryKey: ["pendingClaims"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPendingClaims();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
  });
}

export function useListPendingTransactions() {
  const { actor, isFetching } = useActor();
  return useQuery<WalletTransaction[]>({
    queryKey: ["pendingTransactions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPendingTransactions();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
  });
}

// ── Mutations ────────────────────────────────────────────────

export function useRegister() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      username,
      mobileNumber,
    }: { username: string; mobileNumber: string }) => {
      if (!actor) throw new Error("No actor");
      await actor.register(username, mobileNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
      queryClient.invalidateQueries({ queryKey: ["callerRole"] });
    },
  });
}

export function useCreateBattle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entryFee: bigint) => {
      if (!actor) throw new Error("No actor");
      await actor.createBattle(entryFee);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["battles"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useJoinBattle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (battleId: string) => {
      if (!actor) throw new Error("No actor");
      await actor.joinBattle(battleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["battles"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useSendChatMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      battleId,
      text,
    }: { battleId: string; text: string }) => {
      if (!actor) throw new Error("No actor");
      await actor.sendChatMessage(battleId, text);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["battleRoom", vars.battleId],
      });
    },
  });
}

export function useClaimWin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      battleId,
      evidenceBlobId,
    }: { battleId: string; evidenceBlobId: ExternalBlob }) => {
      if (!actor) throw new Error("No actor");
      await actor.claimWin(battleId, evidenceBlobId);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["battleRoom", vars.battleId],
      });
      queryClient.invalidateQueries({ queryKey: ["battles"] });
    },
  });
}

export function useRequestDeposit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amount,
      upiOrBank,
    }: { amount: bigint; upiOrBank: string }) => {
      if (!actor) throw new Error("No actor");
      await actor.requestDeposit(amount, upiOrBank);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useRequestWithdrawal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amount,
      upiOrBank,
    }: { amount: bigint; upiOrBank: string }) => {
      if (!actor) throw new Error("No actor");
      await actor.requestWithdrawal(amount, upiOrBank);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

// Admin mutations
export function useApproveWin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      battleId,
      winner,
    }: { battleId: string; winner: Principal }) => {
      if (!actor) throw new Error("No actor");
      await actor.approveWin(battleId, winner);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allBattles"] });
      queryClient.invalidateQueries({ queryKey: ["pendingClaims"] });
    },
  });
}

export function useRejectClaim() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      battleId,
      reason,
    }: { battleId: string; reason: string }) => {
      if (!actor) throw new Error("No actor");
      await actor.rejectClaim(battleId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingClaims"] });
    },
  });
}

export function useApproveDeposit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (txId: string) => {
      if (!actor) throw new Error("No actor");
      await actor.approveDeposit(txId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingTransactions"] });
    },
  });
}

export function useApproveWithdrawal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (txId: string) => {
      if (!actor) throw new Error("No actor");
      await actor.approveWithdrawal(txId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingTransactions"] });
    },
  });
}

export function useRejectWithdrawal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (txId: string) => {
      if (!actor) throw new Error("No actor");
      await actor.rejectWithdrawal(txId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingTransactions"] });
    },
  });
}

export function useSetAdmin() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (newAdmin: Principal) => {
      if (!actor) throw new Error("No actor");
      await actor.setAdmin(newAdmin);
    },
  });
}

export function useAssignUserRole() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error("No actor");
      await actor.assignCallerUserRole(user, role);
    },
  });
}

export function useSaveAccountNumber() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountNumber: string) => {
      if (!actor) throw new Error("No actor");
      await actor.saveAccountNumber(accountNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}
