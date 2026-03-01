import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import Time "mo:core/Time";

module {
  type OldActor = {
    winnerClaims : List.List<{ battleId : Text; claimant : Principal; claimedWinner : Principal; evidenceBlobId : Storage.ExternalBlob; timestamp : Time.Time }>;
    users : Map.Map<Principal, {
      principal : Principal;
      username : Text;
      accountNumber : Text;
      walletBalance : Nat;
      registeredTimestamp : Time.Time;
    }>;
    battles : Map.Map<Text, {
      id : Text;
      creator : Principal;
      opponent : ?Principal;
      entryFee : Nat;
      status : {
        #Open;
        #Active;
        #PendingResult;
        #Completed;
        #Disputed;
      };
      roomCode : ?Text;
      winner : ?Principal;
      createdTimestamp : Time.Time;
    }>;
    chatMessages : Map.Map<Text, List.List<{
      battleId : Text;
      sender : Principal;
      text : Text;
      timestamp : Time.Time;
    }>>;
    walletTransactions : Map.Map<Text, {
      id : Text;
      user : Principal;
      txType : {
        #Deposit;
        #Withdrawal;
        #BattleEntry;
        #BattleWin;
      };
      amount : Nat;
      status : {
        #Pending;
        #Completed;
        #Rejected;
      };
      timestamp : Time.Time;
      notes : Text;
    }>;
    accessControlState : AccessControl.AccessControlState;
  };

  type NewActor = {
    winnerClaims : List.List<{ battleId : Text; claimant : Principal; claimedWinner : Principal; evidenceBlobId : Storage.ExternalBlob; timestamp : Time.Time }>;
    users : Map.Map<Principal, {
      principal : Principal;
      username : Text;
      accountNumber : Text;
      mobileNumber : Text;
      walletBalance : Nat;
      registeredTimestamp : Time.Time;
    }>;
    battles : Map.Map<Text, {
      id : Text;
      creator : Principal;
      opponent : ?Principal;
      entryFee : Nat;
      status : {
        #Open;
        #Active;
        #PendingResult;
        #Completed;
        #Disputed;
      };
      roomCode : ?Text;
      winner : ?Principal;
      createdTimestamp : Time.Time;
    }>;
    chatMessages : Map.Map<Text, List.List<{
      battleId : Text;
      sender : Principal;
      text : Text;
      timestamp : Time.Time;
    }>>;
    walletTransactions : Map.Map<Text, {
      id : Text;
      user : Principal;
      txType : {
        #Deposit;
        #Withdrawal;
        #BattleEntry;
        #BattleWin;
      };
      amount : Nat;
      status : {
        #Pending;
        #Completed;
        #Rejected;
      };
      timestamp : Time.Time;
      notes : Text;
    }>;
    accessControlState : AccessControl.AccessControlState;
  };

  public func run(old : OldActor) : NewActor {
    let newUsers = old.users.map<Principal, { principal : Principal; username : Text; accountNumber : Text; walletBalance : Nat; registeredTimestamp : Time.Time }, { principal : Principal; username : Text; accountNumber : Text; mobileNumber : Text; walletBalance : Nat; registeredTimestamp : Time.Time }>(func(_principal, oldUser) { { oldUser with mobileNumber = "" } });
    { old with users = newUsers };
  };
};
