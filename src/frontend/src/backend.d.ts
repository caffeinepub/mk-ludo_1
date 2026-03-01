import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export interface User {
    registeredTimestamp: Time;
    principal: Principal;
    username: string;
    mobileNumber: string;
    accountNumber: string;
    walletBalance: bigint;
}
export interface WalletTransaction {
    id: string;
    status: WalletTransactionStatus;
    user: Principal;
    notes: string;
    timestamp: Time;
    txType: WalletTransactionType;
    amount: bigint;
}
export interface WinnerClaim {
    battleId: string;
    evidenceBlobId: ExternalBlob;
    claimant: Principal;
    claimedWinner: Principal;
    timestamp: Time;
}
export interface ChatMessage {
    battleId: string;
    text: string;
    sender: Principal;
    timestamp: Time;
}
export interface Battle {
    id: string;
    status: BattleStatus;
    creator: Principal;
    winner?: Principal;
    createdTimestamp: Time;
    entryFee: bigint;
    roomCode?: string;
    opponent?: Principal;
}
export interface UserProfile {
    registeredTimestamp: Time;
    username: string;
    mobileNumber: string;
    accountNumber: string;
    walletBalance: bigint;
}
export enum BattleStatus {
    Disputed = "Disputed",
    Open = "Open",
    PendingResult = "PendingResult",
    Active = "Active",
    Completed = "Completed"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum WalletTransactionStatus {
    Rejected = "Rejected",
    Completed = "Completed",
    Pending = "Pending"
}
export enum WalletTransactionType {
    Deposit = "Deposit",
    BattleEntry = "BattleEntry",
    Withdrawal = "Withdrawal",
    BattleWin = "BattleWin"
}
export interface backendInterface {
    approveDeposit(txId: string): Promise<void>;
    approveWin(battleId: string, winner: Principal): Promise<void>;
    approveWithdrawal(txId: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    claimWin(battleId: string, evidenceBlobId: ExternalBlob): Promise<void>;
    createBattle(entryFee: bigint): Promise<void>;
    getBattleRoom(battleId: string): Promise<{
        messages: Array<ChatMessage>;
        battle: Battle;
    }>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMe(): Promise<User>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    joinBattle(battleId: string): Promise<void>;
    listAllBattles(): Promise<Array<Battle>>;
    listBattles(): Promise<Array<Battle>>;
    listPendingClaims(): Promise<Array<WinnerClaim>>;
    listPendingTransactions(): Promise<Array<WalletTransaction>>;
    register(username: string, mobileNumber: string): Promise<void>;
    rejectClaim(battleId: string, reason: string): Promise<void>;
    rejectWithdrawal(txId: string): Promise<void>;
    requestDeposit(amount: bigint, upiOrBank: string): Promise<void>;
    requestWithdrawal(amount: bigint, upiOrBank: string): Promise<void>;
    saveAccountNumber(accountNumber: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveMobileNumber(mobileNumber: string): Promise<void>;
    sendChatMessage(battleId: string, text: string): Promise<void>;
    setAdmin(newAdmin: Principal): Promise<void>;
}
