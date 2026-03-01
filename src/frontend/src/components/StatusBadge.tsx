import { BattleStatus, WalletTransactionStatus } from "../backend.d";

interface BattleStatusBadgeProps {
  status: BattleStatus;
}

export function BattleStatusBadge({ status }: BattleStatusBadgeProps) {
  const config: Record<BattleStatus, { label: string; className: string }> = {
    [BattleStatus.Open]: { label: "Open", className: "badge-open" },
    [BattleStatus.Active]: { label: "Active", className: "badge-active" },
    [BattleStatus.PendingResult]: {
      label: "Pending",
      className: "badge-pending",
    },
    [BattleStatus.Completed]: {
      label: "Completed",
      className: "badge-completed",
    },
    [BattleStatus.Disputed]: { label: "Disputed", className: "badge-disputed" },
  };

  const { label, className } = config[status] ?? {
    label: status,
    className: "badge-open",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-body ${className}`}
    >
      {label}
    </span>
  );
}

interface TxStatusBadgeProps {
  status: WalletTransactionStatus;
}

export function TxStatusBadge({ status }: TxStatusBadgeProps) {
  const config: Record<
    WalletTransactionStatus,
    { label: string; className: string }
  > = {
    [WalletTransactionStatus.Pending]: {
      label: "Pending",
      className: "badge-pending",
    },
    [WalletTransactionStatus.Completed]: {
      label: "Completed",
      className: "badge-completed",
    },
    [WalletTransactionStatus.Rejected]: {
      label: "Rejected",
      className: "badge-disputed",
    },
  };

  const { label, className } = config[status] ?? {
    label: status,
    className: "badge-pending",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-body ${className}`}
    >
      {label}
    </span>
  );
}
