import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Random "mo:core/Random";

import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  // Record types
  type User = {
    principal : Principal;
    username : Text;
    accountNumber : Text;
    mobileNumber : Text;
    walletBalance : Nat;
    registeredTimestamp : Time.Time;
  };

  public type UserProfile = {
    username : Text;
    accountNumber : Text;
    mobileNumber : Text;
    walletBalance : Nat;
    registeredTimestamp : Time.Time;
  };

  module UserProfile {
    public func fromUser(user : User) : UserProfile {
      {
        username = user.username;
        accountNumber = user.accountNumber;
        mobileNumber = user.mobileNumber;
        walletBalance = user.walletBalance;
        registeredTimestamp = user.registeredTimestamp;
      };
    };
  };

  type BattleStatus = {
    #Open;
    #Active;
    #PendingResult;
    #Completed;
    #Disputed;
  };

  type Battle = {
    id : Text;
    creator : Principal;
    opponent : ?Principal;
    entryFee : Nat;
    status : BattleStatus;
    roomCode : ?Text;
    winner : ?Principal;
    createdTimestamp : Time.Time;
  };

  type ChatMessage = {
    battleId : Text;
    sender : Principal;
    text : Text;
    timestamp : Time.Time;
  };

  type WalletTransactionType = {
    #Deposit;
    #Withdrawal;
    #BattleEntry;
    #BattleWin;
  };

  type WalletTransactionStatus = {
    #Pending;
    #Completed;
    #Rejected;
  };

  type WalletTransaction = {
    id : Text;
    user : Principal;
    txType : WalletTransactionType;
    amount : Nat;
    status : WalletTransactionStatus;
    timestamp : Time.Time;
    notes : Text;
  };

  type WinnerClaim = {
    battleId : Text;
    claimant : Principal;
    claimedWinner : Principal;
    evidenceBlobId : Storage.ExternalBlob;
    timestamp : Time.Time;
  };

  // Order modules
  module WalletTransaction {
    public func compare(a : WalletTransaction, b : WalletTransaction) : Order.Order {
      Text.compare(a.id, b.id);
    };
  };

  module Battle {
    public func compare(a : Battle, b : Battle) : Order.Order {
      Text.compare(a.id, b.id);
    };
  };

  module WinnerClaim {
    public func compare(a : WinnerClaim, b : WinnerClaim) : Order.Order {
      Text.compare(a.battleId, b.battleId);
    };
  };

  // Stable structures
  let winnerClaims = List.empty<WinnerClaim>();

  // Mixins
  include MixinStorage();

  // Persistent storage
  let users = Map.empty<Principal, User>();
  let battles = Map.empty<Text, Battle>();
  let chatMessages = Map.empty<Text, List.List<ChatMessage>>();
  let walletTransactions = Map.empty<Text, WalletTransaction>();

  // Authorization state (must be declared after persistent data structures)
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User profile functions (required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };

    switch (users.get(caller)) {
      case (null) { null };
      case (?user) { ?UserProfile.fromUser(user) };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };

    switch (users.get(user)) {
      case (null) { null };
      case (?u) { ?UserProfile.fromUser(u) };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    switch (users.get(caller)) {
      case (null) {
        Runtime.trap("User not registered");
      };
      case (?existingUser) {
        let updatedUser : User = {
          principal = caller;
          username = profile.username;
          accountNumber = profile.accountNumber;
          mobileNumber = profile.mobileNumber;
          walletBalance = existingUser.walletBalance;
          registeredTimestamp = existingUser.registeredTimestamp;
        };
        users.add(caller, updatedUser);
      };
    };
  };

  public shared ({ caller }) func saveMobileNumber(mobileNumber : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update mobile number");
    };

    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        let updatedUser = { user with mobileNumber };
        users.add(caller, updatedUser);
      };
    };
  };

  // User functions
  public shared ({ caller }) func register(username : Text, mobileNumber : Text) : async () {
    if (users.containsKey(caller)) {
      Runtime.trap("User already registered");
    };

    let newUser : User = {
      principal = caller;
      username;
      accountNumber = "";
      mobileNumber;
      walletBalance = 0;
      registeredTimestamp = Time.now();
    };

    users.add(caller, newUser);

    // Assign user role in access control system
    AccessControl.assignRole(accessControlState, caller, caller, #user);
  };

  public shared ({ caller }) func saveAccountNumber(accountNumber : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update account number");
    };

    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        let updatedUser = { user with accountNumber };
        users.add(caller, updatedUser);
      };
    };
  };

  public query ({ caller }) func getMe() : async User {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can access this function");
    };

    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) { user };
    };
  };

  public query func listBattles() : async [Battle] {
    // Public function - accessible to all including guests
    let allBattles = battles.values().toArray();

    let filtered = allBattles.filter(
      func(battle) {
        let st = battle.status;
        st == #Open or st == #Active;
      }
    );

    filtered.sort();
  };

  public shared ({ caller }) func createBattle(entryFee : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can create battles");
    };

    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not registered") };
      case (?user) {
        if (user.walletBalance < entryFee) {
          Runtime.trap("Insufficient balance");
        };

        let battleId = "battle_" # Time.now().toText();
        let newBattle : Battle = {
          id = battleId;
          creator = caller;
          opponent = null;
          entryFee;
          status = #Open;
          roomCode = null;
          winner = null;
          createdTimestamp = Time.now();
        };

        // Deduct entry fee
        let updatedUser = {
          user with
          walletBalance = user.walletBalance - entryFee : Nat;
        };
        users.add(caller, updatedUser);

        battles.add(battleId, newBattle);
      };
    };
  };

  public shared ({ caller }) func joinBattle(battleId : Text) : async () {
    let random = Random.crypto();

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can join battles");
    };

    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        switch (battles.get(battleId)) {
          case (null) { Runtime.trap("Battle not found") };
          case (?battle) {
            if (battle.status != #Open) {
              Runtime.trap("Battle is not open for joining");
            };
            if (user.walletBalance < battle.entryFee) {
              Runtime.trap("Insufficient balance");
            };
            if (battle.creator == caller) {
              Runtime.trap("Cannot join your own battle");
            };

            // Deduct entry fee
            let updatedUser = {
              user with
              walletBalance = user.walletBalance - battle.entryFee : Nat;
            };
            users.add(caller, updatedUser);

            let randomValue = await* random.nat64();
            let roomCodeValue = randomValue.toText();
            let updatedBattle = {
              battle with
              opponent = ?caller;
              status = #Active;
              roomCode = ?roomCodeValue;
            };
            battles.add(battleId, updatedBattle);
          };
        };
      };
    };
  };

  public query ({ caller }) func getBattleRoom(battleId : Text) : async {
    battle : Battle;
    messages : [ChatMessage];
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can access battle rooms");
    };

    switch (battles.get(battleId)) {
      case (null) { Runtime.trap("Battle not found") };
      case (?battle) {
        if (battle.creator != caller and (battle.opponent != ?caller)) {
          Runtime.trap("Access denied: Only battle participants can access this room");
        };

        let messages = switch (chatMessages.get(battleId)) {
          case (null) { List.empty<ChatMessage>() };
          case (?msgs) { msgs };
        };

        { battle; messages = messages.toArray() };
      };
    };
  };

  public shared ({ caller }) func sendChatMessage(battleId : Text, text : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can send chat messages");
    };

    switch (battles.get(battleId)) {
      case (null) { Runtime.trap("Battle not found") };
      case (?battle) {
        if (battle.creator != caller and (battle.opponent != ?caller)) {
          Runtime.trap("Access denied: Only battle participants can send messages");
        };

        let newMessage : ChatMessage = {
          battleId;
          sender = caller;
          text;
          timestamp = Time.now();
        };

        let messages = switch (chatMessages.get(battleId)) {
          case (null) { List.empty<ChatMessage>() };
          case (?msgs) { msgs };
        };

        messages.add(newMessage);
        chatMessages.add(battleId, messages);
      };
    };
  };

  public shared ({ caller }) func claimWin(battleId : Text, evidenceBlobId : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can claim wins");
    };

    switch (battles.get(battleId)) {
      case (null) { Runtime.trap("Battle not found") };
      case (?battle) {
        // Verify caller is a participant
        if (battle.creator != caller and (battle.opponent != ?caller)) {
          Runtime.trap("Access denied: Only battle participants can claim wins");
        };

        // Verify battle is in Active status
        if (battle.status != #Active) {
          Runtime.trap("Battle must be in Active status to claim win");
        };

        let updatedBattle = { battle with status = #PendingResult };
        battles.add(battleId, updatedBattle);

        let newClaim : WinnerClaim = {
          battleId;
          claimant = caller;
          claimedWinner = caller;
          evidenceBlobId;
          timestamp = Time.now();
        };

        winnerClaims.add(newClaim);
      };
    };
  };

  public shared ({ caller }) func requestDeposit(amount : Nat, upiOrBank : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can request deposits");
    };

    let txId = "tx_" # Time.now().toText();
    let newTx : WalletTransaction = {
      id = txId;
      user = caller;
      txType = #Deposit;
      amount;
      status = #Pending;
      timestamp = Time.now();
      notes = upiOrBank;
    };

    walletTransactions.add(txId, newTx);
  };

  public shared ({ caller }) func requestWithdrawal(amount : Nat, upiOrBank : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can request withdrawals");
    };

    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        if (user.walletBalance < amount) {
          Runtime.trap("Insufficient balance");
        };

        let txId = "tx_" # Time.now().toText();
        let newTx : WalletTransaction = {
          id = txId;
          user = caller;
          txType = #Withdrawal;
          amount;
          status = #Pending;
          timestamp = Time.now();
          notes = upiOrBank;
        };

        // Deduct balance
        let updatedUser = {
          user with
          walletBalance = user.walletBalance - amount : Nat;
        };
        users.add(caller, updatedUser);

        walletTransactions.add(txId, newTx);
      };
    };
  };

  // Admin functions
  public shared ({ caller }) func setAdmin(newAdmin : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set admin");
    };

    AccessControl.assignRole(accessControlState, caller, newAdmin, #admin);
  };

  public shared ({ caller }) func listAllBattles() : async [Battle] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list all battles");
    };

    battles.values().toArray().sort();
  };

  public shared ({ caller }) func listPendingClaims() : async [WinnerClaim] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list pending claims");
    };

    winnerClaims.toArray().sort();
  };

  public shared ({ caller }) func approveWin(battleId : Text, winner : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve wins");
    };

    switch (battles.get(battleId)) {
      case (null) { Runtime.trap("Battle not found") };
      case (?battle) {
        let prize = battle.entryFee * 2;
        let updatedBattle = {
          battle with
          status = #Completed;
          winner = ?winner;
        };
        battles.add(battleId, updatedBattle);

        switch (users.get(winner)) {
          case (null) { Runtime.trap("Winner not found") };
          case (?user) {
            let updatedUser = {
              user with
              walletBalance = user.walletBalance + prize;
            };
            users.add(winner, updatedUser);
          };
        };
      };
    };
  };

  public shared ({ caller }) func rejectClaim(battleId : Text, reason : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reject claims");
    };

    switch (battles.get(battleId)) {
      case (null) { Runtime.trap("Battle not found") };
      case (?battle) {
        let updatedBattle = { battle with status = #Disputed };
        battles.add(battleId, updatedBattle);

        switch (users.get(battle.creator)) {
          case (null) { Runtime.trap("Creator not found") };
          case (?creator) {
            let updatedCreator = {
              creator with
              walletBalance = creator.walletBalance + battle.entryFee;
            };
            users.add(battle.creator, updatedCreator);
          };
        };
        switch (battle.opponent) {
          case (null) {};
          case (?opp) {
            switch (users.get(opp)) {
              case (null) { Runtime.trap("Opponent not found") };
              case (?opponent) {
                let updatedOpponent = {
                  opponent with
                  walletBalance = opponent.walletBalance + battle.entryFee;
                };
                users.add(opp, updatedOpponent);
              };
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func listPendingTransactions() : async [WalletTransaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list pending transactions");
    };

    let allTx = walletTransactions.values().toArray();
    let filtered = allTx.filter(
      func(tx) {
        tx.status == #Pending;
      }
    );
    filtered.sort();
  };

  public shared ({ caller }) func approveDeposit(txId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve deposits");
    };

    switch (walletTransactions.get(txId)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?tx) {
        if (tx.status != #Pending or tx.txType != #Deposit) {
          Runtime.trap("Invalid deposit status");
        };

        let updatedTx = { tx with status = #Completed };
        walletTransactions.add(txId, updatedTx);

        switch (users.get(tx.user)) {
          case (null) { Runtime.trap("User not found") };
          case (?user) {
            let updatedUser = {
              user with
              walletBalance = user.walletBalance + tx.amount;
            };
            users.add(tx.user, updatedUser);
          };
        };
      };
    };
  };

  public shared ({ caller }) func approveWithdrawal(txId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve withdrawals");
    };

    switch (walletTransactions.get(txId)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?tx) {
        if (tx.status != #Pending or tx.txType != #Withdrawal) {
          Runtime.trap("Invalid withdrawal status");
        };

        let updatedTx = { tx with status = #Completed };
        walletTransactions.add(txId, updatedTx);
      };
    };
  };

  public shared ({ caller }) func rejectWithdrawal(txId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reject withdrawals");
    };

    switch (walletTransactions.get(txId)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?tx) {
        if (tx.status != #Pending or tx.txType != #Withdrawal) {
          Runtime.trap("Invalid withdrawal status");
        };

        let updatedTx = { tx with status = #Rejected };
        walletTransactions.add(txId, updatedTx);

        switch (users.get(tx.user)) {
          case (null) { Runtime.trap("User not found") };
          case (?user) {
            let updatedUser = {
              user with
              walletBalance = user.walletBalance + tx.amount;
            };
            users.add(tx.user, updatedUser);
          };
        };
      };
    };
  };
};
