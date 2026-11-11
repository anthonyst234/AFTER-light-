import React, { useState } from 'react';
import { PlayerSaveData } from '../game/types';
import { 
  UserAccount, 
  getAllRegisteredUsers, 
  loadUserSaveData, 
  writeUserSaveData, 
  deleteUserAccount,
  getAdminPassword,
  setAdminPassword,
  getAdmin2FACode,
  setAdmin2FACode,
  MASTER_ADMIN_EMAIL,
  verifyAdminAuthorization,
  isAuthorizedAdmin
} from '../game/auth';
import { getGlobalLeaderboard, removeLeaderboardEntry, clearAllLeaderboardScores } from '../game/leaderboard';
import { CHARACTER_SKINS, WORLDS_CONFIG } from '../game/constants';
import { sound } from '../game/audio';
import { 
  X, ShieldAlert, Database, RefreshCw, Sparkles, Check, KeyRound, Users, Trophy, Lock, Unlock, Eye, Trash2, PlusCircle, CheckCircle2
} from 'lucide-react';

interface AdminDashboardModalProps {
  saveData: PlayerSaveData;
  currentUser: UserAccount | null;
  onUpdateSave: (newSave: PlayerSaveData) => void;
  onClose: () => void;
}

/**
 * Security Wrapper Function:
 * Intercepts any trigger or render attempt of the Admin Dashboard.
 * Strictly verifies the current user's email against the hardcoded admin email
 * (anthonystunt234@gmail.com) and verifies their active authentication status.
 * Ensures only the authorized owner can trigger or view it.
 */
export function withAdminSecurity(
  Component: React.ComponentType<AdminDashboardModalProps>
): React.FC<AdminDashboardModalProps> {
  return function SecuredAdminDashboard(props: AdminDashboardModalProps) {
    const authStatus = verifyAdminAuthorization(props.currentUser);

    if (!authStatus.isAuthorized) {
      return (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 font-sans select-none">
          <div className="bg-red-950/95 border-2 border-red-500 rounded-2xl p-6 max-w-md w-full text-center flex flex-col items-center shadow-2xl shadow-red-950/50">
            <ShieldAlert className="w-14 h-14 text-red-400 mb-3 animate-bounce" />
            <h2 className="font-pixel text-base text-white tracking-wider mb-2">
              SECURITY ACCESS RESTRICTED
            </h2>
            <div className="text-xs text-red-200 font-mono mb-4 bg-red-900/40 p-3 rounded-xl border border-red-700/50 text-left">
              <span className="font-bold block text-red-300 mb-1">Authorization Check Failed:</span>
              <span>{authStatus.reason}</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mb-5">
              Only verified Master Admin <span className="text-amber-400 font-bold">{MASTER_ADMIN_EMAIL}</span> is permitted to trigger or view this console.
            </p>
            <button
              onClick={props.onClose}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-pixel text-xs rounded-xl cursor-pointer border border-slate-700 active:scale-95 transition-all shadow-md"
            >
              RETURN TO SAFETY
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

const AdminDashboardModalContent: React.FC<AdminDashboardModalProps> = ({
  saveData,
  currentUser,
  onUpdateSave,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'REGISTRY' | 'ECONOMY' | 'LEADERBOARD' | 'SECURITY'>('REGISTRY');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Player Registry & Storage Inspection state
  const [users, setUsers] = useState<UserAccount[]>(() => getAllRegisteredUsers());
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [selectedUserData, setSelectedUserData] = useState<PlayerSaveData | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Security Credentials state
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdmin2FA, setNewAdmin2FA] = useState('');

  // Leaderboard entries state
  const [leaderboardScores, setLeaderboardScores] = useState(() => getGlobalLeaderboard());

  const notify = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Guard: Confirm Master Admin only
  const isMasterAdmin = currentUser?.role === 'ADMIN' && currentUser.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

  // Inspect specific user's storage
  const handleInspectUser = (user: UserAccount) => {
    sound.playClick();
    setSelectedUser(user);
    const data = loadUserSaveData(user.id);
    setSelectedUserData(data);
  };

  // Modify inspected player's storage
  const handleModifyInspectedUserCoins = (amount: number) => {
    if (!selectedUser || !selectedUserData) return;
    sound.playCoin();
    const updated: PlayerSaveData = {
      ...selectedUserData,
      coins: selectedUserData.coins + amount,
      lifetimeCoins: selectedUserData.lifetimeCoins + amount,
    };
    writeUserSaveData(selectedUser.id, updated);
    setSelectedUserData(updated);
    notify(`Injected +${amount} Coins into ${selectedUser.displayName}'s storage!`);
  };

  const handleModifyInspectedUserWings = (amount: number) => {
    if (!selectedUser || !selectedUserData) return;
    sound.playRevival();
    const updated: PlayerSaveData = {
      ...selectedUserData,
      revivalWings: selectedUserData.revivalWings + amount,
    };
    writeUserSaveData(selectedUser.id, updated);
    setSelectedUserData(updated);
    notify(`Added +${amount} Wings to ${selectedUser.displayName}'s storage!`);
  };

  const handleDeleteUser = (userId: string) => {
    sound.playCollision();
    deleteUserAccount(userId);
    const updatedUsers = getAllRegisteredUsers();
    setUsers(updatedUsers);
    if (selectedUser?.id === userId) {
      setSelectedUser(null);
      setSelectedUserData(null);
    }
    notify('Player account and isolated storage purged.');
  };

  // Global Economy & Cheats for Active Runner
  const handleAddCoins = (amount: number) => {
    sound.playCoin();
    const updated = {
      ...saveData,
      coins: saveData.coins + amount,
      lifetimeCoins: saveData.lifetimeCoins + amount,
    };
    onUpdateSave(updated);
    notify(`+${amount} Coins added to active profile!`);
  };

  const handleAddWings = (count: number) => {
    sound.playRevival();
    const updated = {
      ...saveData,
      revivalWings: saveData.revivalWings + count,
    };
    onUpdateSave(updated);
    notify(`+${count} Angel Revival Wings added!`);
  };

  const handleUnlockAll = () => {
    sound.playBossDefeat();
    const allChars = CHARACTER_SKINS.map((c) => c.id);
    const allWorlds = WORLDS_CONFIG.map((w) => w.id);
    onUpdateSave({
      ...saveData,
      unlockedCharacters: allChars,
      unlockedWorlds: allWorlds,
      unlockedWings: ['NONE', 'PAPER_WINGS', 'ANGEL_WINGS', 'DARK_WINGS', 'MECHANICAL_WINGS', 'GOLDEN_WINGS', 'CELESTIAL_WINGS'],
      unlockedHeads: ['NONE', 'TINY_HALO', 'CROWN', 'HOOD', 'HEADPHONES', 'MASK', 'BANDANA'],
      unlockedTrails: ['NONE', 'EMBER_TRAIL', 'GHOST_TRAIL', 'SPARK_TRAIL', 'STAR_TRAIL', 'SMOKE_TRAIL'],
      unlockedCompanions: ['NONE', 'POCKET_BIRD', 'FLOATING_SPIRIT', 'MINI_ROBOT', 'TINY_GHOST'],
    });
    notify('All 12 Skins, 6 Worlds, and All Accessories Unlocked!');
  };

  // Security Credentials Update
  const handleUpdateCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdminPassword.trim().length >= 4) {
      setAdminPassword(newAdminPassword.trim());
    }
    if (newAdmin2FA.trim().length >= 4) {
      setAdmin2FACode(newAdmin2FA.trim());
    }
    sound.playLevelUp();
    setNewAdminPassword('');
    setNewAdmin2FA('');
    notify('Master Admin Security Credentials Updated Successfully!');
  };

  // Leaderboard moderation
  const handleDeleteScore = (id: string) => {
    sound.playCollision();
    removeLeaderboardEntry(id);
    setLeaderboardScores(getGlobalLeaderboard());
    notify('Score entry deleted from Global Leaderboard.');
  };

  const handlePurgeLeaderboard = () => {
    sound.playCollision();
    clearAllLeaderboardScores();
    setLeaderboardScores(getGlobalLeaderboard());
    notify('Leaderboard cleared and re-seeded.');
  };

  // Deny access if not master admin
  if (!isMasterAdmin) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-sans select-none">
        <div className="bg-red-950/90 border-2 border-red-500 rounded-2xl p-6 max-w-md w-full text-center flex flex-col items-center">
          <ShieldAlert className="w-12 h-12 text-red-400 mb-3 animate-bounce" />
          <h2 className="font-pixel text-base text-white tracking-wider mb-2">ACCESS RESTRICTED</h2>
          <p className="text-xs text-red-200 font-mono mb-5">
            This dashboard is strictly reserved for the Master Admin ({MASTER_ADMIN_EMAIL}). Your session lacks authorization.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-pixel text-xs rounded-xl cursor-pointer"
          >
            RETURN TO GAME
          </button>
        </div>
      </div>
    );
  }

  // Filtered users
  const filteredUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      u.email.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 font-sans select-none overflow-y-auto">
      <div className="bg-slate-950 border border-amber-500/60 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-red-950/70 via-slate-950 to-amber-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-md">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-pixel text-sm sm:text-base text-white tracking-wide">
                  MASTER ADMIN DASHBOARD
                </h2>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-mono font-bold">
                  ANTHONY ONLY
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Authorized Session: <span className="text-amber-300 font-bold">{MASTER_ADMIN_EMAIL}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-4 gap-2 text-xs font-mono overflow-x-auto">
          <button
            onClick={() => setActiveTab('REGISTRY')}
            className={`py-3 px-3.5 font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'REGISTRY'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>PLAYER STORAGE INSPECTOR ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ECONOMY')}
            className={`py-3 px-3.5 font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ECONOMY'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>LIVE ECONOMY & INJECTOR</span>
          </button>

          <button
            onClick={() => setActiveTab('LEADERBOARD')}
            className={`py-3 px-3.5 font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'LEADERBOARD'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>LEADERBOARD MODERATOR</span>
          </button>

          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`py-3 px-3.5 font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'SECURITY'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>CREDENTIALS & 2FA PIN</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/60 px-5 py-2.5 flex items-center gap-2 text-xs text-emerald-200 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 font-sans">
          
          {/* TAB 1: PLAYER REGISTRY & STORAGE INSPECTOR */}
          {activeTab === 'REGISTRY' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-pixel text-xs text-white font-bold">
                    ISOLATED PLAYER STORAGE & REGISTRY
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Every player has private storage. Only you, the Master Admin, can inspect and manage accounts.
                  </p>
                </div>

                <input
                  type="text"
                  placeholder="Filter by Call Sign or Email..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Grid: Player List on Left, Selected Player Storage on Right */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Player List */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 max-h-[380px] overflow-y-auto flex flex-col gap-2">
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">
                    REGISTERED COURIERS ({filteredUsers.length})
                  </span>

                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleInspectUser(user)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        selectedUser?.id === user.id
                          ? 'bg-amber-500/15 border-amber-400 text-white'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-xs">
                          {user.role === 'ADMIN' ? '👑' : '🏃'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-pixel text-[8.5px] font-bold text-white flex items-center gap-1">
                            {user.displayName}
                            {user.role === 'ADMIN' && (
                              <span className="text-[7.5px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300">
                                OWNER
                              </span>
                            )}
                          </span>
                          <span className="font-mono text-[9px] text-slate-400">{user.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {user.isEmailVerified ? (
                          <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                            VERIFIED
                          </span>
                        ) : (
                          <span className="text-[8px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60">
                            PENDING
                          </span>
                        )}
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Inspect Selected Player Storage */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col">
                  {selectedUser && selectedUserData ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div>
                          <h4 className="font-pixel text-xs text-amber-300 font-bold">
                            {selectedUser.displayName}
                          </h4>
                          <span className="font-mono text-[10px] text-slate-400">{selectedUser.email}</span>
                        </div>
                        {selectedUser.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleDeleteUser(selectedUser.id)}
                            className="p-1.5 text-red-400 hover:text-white bg-red-950/50 hover:bg-red-900 rounded-lg border border-red-800 transition-colors cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Storage Snapshot */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-500 block">CURRENT COINS</span>
                          <span className="text-amber-300 font-bold">${selectedUserData.coins}</span>
                        </div>
                        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-500 block">HIGH SCORE (ENDLESS)</span>
                          <span className="text-cyan-300 font-bold">{selectedUserData.highScoreDistance}m</span>
                        </div>
                        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-500 block">HARDCORE RECORD</span>
                          <span className="text-rose-400 font-bold">{selectedUserData.hardcoreHighScore || 0}m</span>
                        </div>
                        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-500 block">REVIVAL WINGS</span>
                          <span className="text-sky-300 font-bold">{selectedUserData.revivalWings} Wings</span>
                        </div>
                      </div>

                      {/* Unlocked Assets */}
                      <div className="text-[10px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                        <div>Skins Unlocked: <span className="text-white font-bold">{selectedUserData.unlockedCharacters.length}</span> / {CHARACTER_SKINS.length}</div>
                        <div>Worlds Unlocked: <span className="text-white font-bold">{selectedUserData.unlockedWorlds.length}</span> / {WORLDS_CONFIG.length}</div>
                        <div>Missions Active: <span className="text-white font-bold">{selectedUserData.missions.length}</span></div>
                      </div>

                      {/* Storage Edit Actions */}
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => handleModifyInspectedUserCoins(1000)}
                          className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-pixel text-[8px] font-bold rounded-lg cursor-pointer transition-colors"
                        >
                          +1K COINS
                        </button>
                        <button
                          onClick={() => handleModifyInspectedUserWings(5)}
                          className="flex-1 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-pixel text-[8px] font-bold rounded-lg cursor-pointer transition-colors"
                        >
                          +5 WINGS
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono text-xs p-6 text-center">
                      <Eye className="w-8 h-8 text-slate-600 mb-2" />
                      <span>Select a courier from the left list to inspect their private storage, scores, and balance.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE ECONOMY & CHEAT INJECTOR */}
          {activeTab === 'ECONOMY' && (
            <div className="flex flex-col gap-4">
              <h3 className="font-pixel text-xs text-white font-bold">
                MASTER PROFILE INJECTOR & TESTING CHEATS
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Instantly credit your personal admin profile with currency, wings, or unlocked cosmetics.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleAddCoins(5000)}
                  className="p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 rounded-xl text-left flex items-center justify-between cursor-pointer transition-all"
                >
                  <div>
                    <div className="font-pixel text-[10px] text-amber-300 font-bold">+5,000 COINS</div>
                    <div className="text-[10px] text-slate-400 font-mono">Inject gold into your balance</div>
                  </div>
                  <PlusCircle className="w-5 h-5 text-amber-400" />
                </button>

                <button
                  onClick={() => handleAddWings(5)}
                  className="p-3 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-400/40 rounded-xl text-left flex items-center justify-between cursor-pointer transition-all"
                >
                  <div>
                    <div className="font-pixel text-[10px] text-sky-300 font-bold">+5 REVIVAL WINGS</div>
                    <div className="text-[10px] text-slate-400 font-mono">Instant second-chance wings</div>
                  </div>
                  <PlusCircle className="w-5 h-5 text-sky-400" />
                </button>

                <button
                  onClick={handleUnlockAll}
                  className="p-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-400/40 rounded-xl text-left flex items-center justify-between cursor-pointer transition-all"
                >
                  <div>
                    <div className="font-pixel text-[10px] text-purple-300 font-bold">UNLOCK ALL CHARACTERS & WORLDS</div>
                    <div className="text-[10px] text-slate-400 font-mono">All 12 skins + 6 worlds + wings</div>
                  </div>
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    onUpdateSave({
                      ...saveData,
                      coins: 100,
                      revivalWings: 1,
                      highScoreDistance: 0,
                      hardcoreHighScore: 0,
                    });
                    notify('Reset active balance to starter baseline.');
                  }}
                  className="p-3 bg-red-950/20 hover:bg-red-950/40 border border-red-500/40 rounded-xl text-left flex items-center justify-between cursor-pointer transition-all"
                >
                  <div>
                    <div className="font-pixel text-[10px] text-red-300 font-bold">RESET ACTIVE VAULT</div>
                    <div className="text-[10px] text-slate-400 font-mono">Return balance to default starter</div>
                  </div>
                  <RefreshCw className="w-5 h-5 text-red-400" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: LEADERBOARD MODERATOR */}
          {activeTab === 'LEADERBOARD' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-pixel text-xs text-white font-bold">
                    GLOBAL LEADERBOARD MODERATION
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Moderate international score entries or purge suspicious runs.
                  </p>
                </div>

                <button
                  onClick={handlePurgeLeaderboard}
                  className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-600 rounded-xl text-[10px] text-red-200 font-mono cursor-pointer"
                >
                  Reset Leaderboard
                </button>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 max-h-[350px] overflow-y-auto flex flex-col gap-2">
                {leaderboardScores.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-pixel text-xs text-amber-400 font-bold">#{entry.rank}</span>
                      <span className="text-sm">{entry.flag}</span>
                      <div>
                        <div className="font-pixel text-[9px] text-white font-bold">{entry.name}</div>
                        <div className="text-[9px] text-slate-400 font-mono">
                          {entry.distance}m · {entry.mode} · {entry.character}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteScore(entry.id)}
                      className="p-1.5 text-red-400 hover:text-white bg-red-950/40 rounded-lg hover:bg-red-900 transition-colors cursor-pointer"
                      title="Remove Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY & CREDENTIALS CONFIG */}
          {activeTab === 'SECURITY' && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="font-pixel text-xs text-white font-bold">
                  MASTER ADMIN SECURITY CONFIGURATION
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Manage your personal Master Admin Password and Dual-Factor 2FA Code.
                </p>
              </div>

              <form onSubmit={handleUpdateCredentials} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 max-w-lg">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    UPDATE MASTER ADMIN PASSWORD (CURRENT: <code className="text-amber-400">{getAdminPassword()}</code>)
                  </label>
                  <input
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Enter new admin password"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    UPDATE 2FA SECURITY CODE (CURRENT: <code className="text-amber-400">{getAdmin2FACode()}</code>)
                  </label>
                  <input
                    type="text"
                    value={newAdmin2FA}
                    onChange={(e) => setNewAdmin2FA(e.target.value)}
                    placeholder="e.g. 779900"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-2 py-2.5 bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 active:scale-95 text-slate-950 font-pixel text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/20"
                >
                  SAVE MASTER CREDENTIALS
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const AdminDashboardModal = withAdminSecurity(AdminDashboardModalContent);
