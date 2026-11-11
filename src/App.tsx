import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { GameState, GameMode, SkillType, PlayerSaveData, Boss } from './game/types';
import { loadSaveData, writeSaveData } from './game/save';
import { 
  UserAccount, 
  getActiveUser, 
  logoutUser, 
  loadUserSaveData, 
  writeUserSaveData,
  verifyAdminAuthorization 
} from './game/auth';
import { submitScoreToLeaderboard } from './game/leaderboard';
import { sound } from './game/audio';
import { HUD } from './components/HUD';
import { MobileControls } from './components/MobileControls';
import { MainMenu } from './components/MainMenu';
import { LoadingScreen } from './components/LoadingScreen';
import { AuthModal } from './components/AuthModal';
import { ShopModal } from './components/ShopModal';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { WorldSelectModal } from './components/WorldSelectModal';
import { MissionsModal } from './components/MissionsModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { TestChecklistModal } from './components/TestChecklistModal';
import { AboutModal } from './components/AboutModal';
import { CodexModal } from './components/CodexModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // App Lifecycle Stages: LOADING -> AUTH (if not logged in) -> READY
  const [appStage, setAppStage] = useState<'LOADING' | 'AUTH' | 'READY'>('LOADING');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getActiveUser());
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Player Save Data (Isolated per User)
  const [saveData, setSaveData] = useState<PlayerSaveData>(() => {
    const active = getActiveUser();
    return active ? loadUserSaveData(active.id) : loadSaveData();
  });

  // Game UI State
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [gameMode, setGameMode] = useState<GameMode>('ENDLESS');

  // Live HUD Stats
  const [hudStats, setHudStats] = useState<{
    distance: number;
    coins: number;
    speed: number;
    paletteTier: string;
    activeSkill: SkillType | null;
    skillTimeLeft: number;
    skillCooldown: number;
    skillCharges: number;
    boss: Boss | null;
    powerSurgeActive?: boolean;
    timeRemaining?: number;
    combo?: number;
    comboTimer?: number;
    dashCooldown?: number;
    isDashing?: boolean;
    ghostDelta?: number | null;
    score?: number;
    level?: number;
    xp?: number;
    isFlying?: boolean;
    flightProgress?: number;
    flightDistanceRemaining?: number;
    tagTeamActive?: boolean;
    isHardcore?: boolean;
    isWaitingAtRescueBox?: boolean;
    teasingMessage?: string | null;
  }>({
    distance: 0,
    coins: 0,
    speed: 280,
    paletteTier: 'Monochrome Grayscale',
    activeSkill: null,
    skillTimeLeft: 0,
    skillCooldown: 0,
    skillCharges: 3,
    boss: null,
    powerSurgeActive: false,
    combo: 1,
    comboTimer: 0,
    dashCooldown: 0,
    isDashing: false,
    ghostDelta: null,
    score: 0,
    isFlying: false,
    flightProgress: 0,
    flightDistanceRemaining: 0,
    tagTeamActive: false,
    isHardcore: false,
    isWaitingAtRescueBox: false,
    teasingMessage: null,
  });

  // Modals
  const [showShop, setShowShop] = useState(false);
  const [showCharacters, setShowCharacters] = useState(false);
  const [showWorlds, setShowWorlds] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [showCodex, setShowCodex] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTestChecklist, setShowTestChecklist] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Game Over Details
  const [gameOverResult, setGameOverResult] = useState<{
    distance: number;
    coins: number;
    isNewRecord: boolean;
    xpEarned?: number;
    level?: number;
    highestCombo?: number;
  }>({ distance: 0, coins: 0, isNewRecord: false, xpEarned: 0, highestCombo: 1 });

  // Update save data helper
  const handleUpdateSave = useCallback((newSave: PlayerSaveData) => {
    setSaveData(newSave);
    if (currentUser) {
      writeUserSaveData(currentUser.id, newSave);
    } else {
      writeSaveData(newSave);
    }
    if (engineRef.current) {
      engineRef.current.setSaveData(newSave);
    }
  }, [currentUser]);

  // Loading Screen Complete Callback
  const handleLoadingComplete = () => {
    const active = getActiveUser();
    if (active) {
      setCurrentUser(active);
      const userSave = loadUserSaveData(active.id);
      setSaveData(userSave);
      if (engineRef.current) {
        engineRef.current.setSaveData(userSave);
      }
      setAppStage('READY');
    } else {
      setAppStage('AUTH');
    }
  };

  // User Authenticated Callback
  const handleAuthenticated = (user: UserAccount) => {
    setCurrentUser(user);
    const userSave = loadUserSaveData(user.id);
    if (user.displayName && !userSave.playerName) {
      userSave.playerName = user.displayName;
    }
    if (user.country && !userSave.playerCountry) {
      userSave.playerCountry = user.country;
    }
    setSaveData(userSave);
    if (engineRef.current) {
      engineRef.current.setSaveData(userSave);
    }
    setAppStage('READY');
    setShowAuthModal(false);
  };

  // User Logout Callback
  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setShowAuthModal(true);
  };

  // Fullscreen Sizable Toggle for PC & Mobile
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Initialize GameEngine
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, saveData, {
      onStateChange: (newState) => {
        setGameState(newState);
      },
      onStatsUpdate: (stats) => {
        setHudStats(stats);
      },
      onReviveOffered: () => {
        setGameState('REVIVING');
      },
      onGameOver: (result) => {
        setGameOverResult(result);
        setGameState('GAME_OVER');
        handleUpdateSave(engine.saveData);

        // Auto-sync score to Live Global Leaderboard!
        if (result.distance > 0) {
          const playerName = engine.saveData.playerName || currentUser?.displayName || 'Courier';
          const countryCode = engine.saveData.playerCountry || currentUser?.country || 'US';
          const flag = countryCode === 'JP' ? '🇯🇵' : countryCode === 'DE' ? '🇩🇪' : countryCode === 'GB' ? '🇬🇧' : countryCode === 'FR' ? '🇫🇷' : countryCode === 'KR' ? '🇰🇷' : '🇺🇸';

          submitScoreToLeaderboard({
            name: playerName,
            email: currentUser?.email,
            country: countryCode,
            flag,
            distance: result.distance,
            mode: gameMode === 'HARDCORE' ? 'HARDCORE' : 'ENDLESS',
            character: engine.saveData.selectedCharacter || 'Classic',
          });
        }
      },
    });

    engineRef.current = engine;

    return () => {
      engine.destroy();
    };
  }, []);

  // Keep engine save data in sync
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSaveData(saveData);
    }
  }, [saveData]);

  // Keyboard Shortcuts & Touch Gestures
  useEffect(() => {
    let touchStartY = 0;
    let touchStartX = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (e.code === 'KeyF' || ((e.code === 'Space' || e.code === 'Enter') && hudStats.powerSurgeActive)) {
        if (gameState === 'PLAYING' && hudStats.powerSurgeActive) {
          e.preventDefault();
          engineRef.current?.triggerPowerSurge();
          return;
        }
      }

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (gameState === 'MENU') {
          startGame();
        } else if (gameState === 'PLAYING') {
          engineRef.current?.triggerJump();
        }
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        if (gameState === 'PLAYING') {
          engineRef.current?.triggerSlide();
        }
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') {
        e.preventDefault();
        if (gameState === 'PLAYING') {
          engineRef.current?.triggerDash();
        }
      } else if (e.code === 'KeyE' || e.code === 'KeyX') {
        e.preventDefault();
        if (gameState === 'PLAYING') {
          engineRef.current?.triggerActiveSkill();
        }
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        if (gameState === 'PLAYING') {
          engineRef.current?.pauseGame();
        } else if (gameState === 'PAUSED') {
          engineRef.current?.resumeGame();
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (gameState !== 'PLAYING') return;
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;
      const diffY = touchEndY - touchStartY;
      const diffX = touchEndX - touchStartX;

      if (diffX > 50 && Math.abs(diffY) < 40) {
        // Swipe right = Dash burst
        engineRef.current?.triggerDash();
      } else if (diffY < -35) {
        // Swipe up = Jump
        engineRef.current?.triggerJump();
      } else if (diffY > 35) {
        // Swipe down = Slide / Fast Fall
        engineRef.current?.triggerSlide();
      } else if (Math.abs(diffX) < 15 && Math.abs(diffY) < 15) {
        // Quick Screen Tap: In Flight Mode flaps wings; if Power Surge ready, unleashes one-shot attack!
        if (hudStats.isFlying) {
          engineRef.current?.triggerJump();
        } else if (hudStats.powerSurgeActive) {
          engineRef.current?.triggerPowerSurge();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameState, hudStats.powerSurgeActive, hudStats.isFlying]);

  // Actions
  const startGame = () => {
    engineRef.current?.startGame(gameMode);
    setShowShop(false);
    setShowCharacters(false);
    setShowWorlds(false);
    setShowMissions(false);
    setShowCodex(false);
    setShowSettings(false);
    setShowTestChecklist(false);
    setShowLeaderboard(false);
    setShowAdmin(false);
    setShowAuthModal(false);
  };

  const handleRevive = () => {
    engineRef.current?.revivePlayer();
    handleUpdateSave(engineRef.current!.saveData);
  };

  const handleRestart = () => {
    engineRef.current?.startGame(gameMode);
  };

  const handleMainMenu = () => {
    engineRef.current?.endGame();
    engineRef.current!.gameState = 'MENU';
    setGameState('MENU');
    sound.stopMusic();
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center select-none font-sans-clean">
      
      {/* 1. Initial Arcade Loading Screen */}
      {appStage === 'LOADING' && (
        <LoadingScreen onComplete={handleLoadingComplete} />
      )}

      {/* 2. Mandatory Login / Sign Up Gate */}
      {appStage === 'AUTH' && (
        <AuthModal
          isMandatory={true}
          onAuthenticated={handleAuthenticated}
        />
      )}

      {/* 3. Non-Mandatory Switch Account / Login Modal */}
      {showAuthModal && appStage === 'READY' && (
        <AuthModal
          isMandatory={false}
          onAuthenticated={handleAuthenticated}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* 2D Canvas Container (Responsive Sizable Retro Aspect Ratio) */}
      <div className="relative w-full h-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="crisp-canvas w-full h-full object-contain max-w-[177.78vh] max-h-[56.25vw] bg-black shadow-2xl transition-all"
        />

        {/* Retro CRT Scanlines & Subtle Edge Vignette */}
        <div className="absolute inset-0 scanlines pointer-events-none" />
        <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/60 pointer-events-none" />

        {/* HUD Overlay (Playing & Paused States) */}
        {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
          <HUD
            distance={hudStats.distance}
            coins={hudStats.coins}
            highScore={saveData.highScoreDistance}
            speed={hudStats.speed}
            revivalWings={saveData.revivalWings}
            paletteTier={hudStats.paletteTier}
            activeSkill={hudStats.activeSkill}
            skillTimeLeft={hudStats.skillTimeLeft}
            skillCooldown={hudStats.skillCooldown}
            skillCharges={hudStats.skillCharges}
            selectedSkill={saveData.selectedSkill}
            boss={hudStats.boss}
            powerSurgeActive={hudStats.powerSurgeActive}
            timeRemaining={hudStats.timeRemaining}
            combo={hudStats.combo}
            comboTimer={hudStats.comboTimer}
            dashCooldown={hudStats.dashCooldown}
            isDashing={hudStats.isDashing}
            ghostDelta={hudStats.ghostDelta}
            score={hudStats.score}
            isFlying={hudStats.isFlying}
            flightProgress={hudStats.flightProgress}
            flightDistanceRemaining={hudStats.flightDistanceRemaining}
            tagTeamActive={hudStats.tagTeamActive}
            isHardcore={hudStats.isHardcore}
            isWaitingAtRescueBox={hudStats.isWaitingAtRescueBox}
            teasingMessage={hudStats.teasingMessage}
            onPause={() => engineRef.current?.pauseGame()}
            onActivateSkill={() => engineRef.current?.triggerActiveSkill()}
            onPowerSurgeStrike={() => engineRef.current?.triggerPowerSurge()}
          />
        )}

        {/* Mobile Touch Controls (Playing State) */}
        {gameState === 'PLAYING' && (
          <MobileControls
            onJump={() => engineRef.current?.triggerJump()}
            onDoubleJump={() => engineRef.current?.triggerJump()}
            onSlide={() => engineRef.current?.triggerSlide()}
            onDash={() => engineRef.current?.triggerDash()}
            dashCooldown={hudStats.dashCooldown}
            isDashing={hudStats.isDashing}
            onSkill={() => engineRef.current?.triggerActiveSkill()}
            selectedSkill={saveData.selectedSkill}
            skillCharges={saveData.skillCharges[saveData.selectedSkill] || 0}
            skillCooldown={hudStats.skillCooldown}
            activeSkill={hudStats.activeSkill}
            powerSurgeActive={hudStats.powerSurgeActive}
            onPowerSurge={() => engineRef.current?.triggerPowerSurge()}
          />
        )}

        {/* Main Menu (Admin button removed from bottom bar; only visible in profile for verified master admin) */}
        {gameState === 'MENU' && appStage === 'READY' && (
          <MainMenu
            saveData={saveData}
            selectedMode={gameMode}
            currentUser={currentUser}
            onSelectMode={setGameMode}
            onStartGame={startGame}
            onOpenShop={() => setShowShop(true)}
            onOpenCharacters={() => setShowCharacters(true)}
            onOpenWorlds={() => setShowWorlds(true)}
            onOpenMissions={() => setShowMissions(true)}
            onOpenCodex={() => setShowCodex(true)}
            onOpenSettings={() => setShowSettings(true)}
            onOpenTestChecklist={() => setShowTestChecklist(true)}
            onOpenAbout={() => setShowAbout(true)}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            onOpenAdmin={() => {
              const check = verifyAdminAuthorization(currentUser);
              if (check.isAuthorized) {
                setShowAdmin(true);
              } else {
                sound.playCollision();
                setShowAuthModal(true);
              }
            }}
            onOpenAuth={() => setShowAuthModal(true)}
            onLogout={handleLogout}
            onToggleFullscreen={handleToggleFullscreen}
            onToggleGhostMode={() => {
              const updated = { ...saveData, ghostModeEnabled: !saveData.ghostModeEnabled };
              handleUpdateSave(updated);
            }}
          />
        )}

        {/* Pause Screen */}
        {gameState === 'PAUSED' && (
          <PauseModal
            saveData={saveData}
            onResume={() => engineRef.current?.resumeGame()}
            onRestart={handleRestart}
            onMainMenu={handleMainMenu}
            onUpdateSave={handleUpdateSave}
          />
        )}

        {/* Game Over / Revival Screen */}
        {(gameState === 'GAME_OVER' || gameState === 'REVIVING') && (
          <GameOverModal
            distance={gameOverResult.distance}
            coins={gameOverResult.coins}
            isNewRecord={gameOverResult.isNewRecord}
            saveData={saveData}
            isReviving={gameState === 'REVIVING'}
            xpEarned={gameOverResult.xpEarned}
            highestCombo={gameOverResult.highestCombo}
            score={hudStats.score}
            onRevive={handleRevive}
            onRestart={handleRestart}
            onOpenShop={() => setShowShop(true)}
            onMainMenu={handleMainMenu}
          />
        )}

        {/* International Global Leaderboard Modal */}
        {showLeaderboard && (
          <LeaderboardModal
            saveData={saveData}
            onUpdateSave={handleUpdateSave}
            onClose={() => setShowLeaderboard(false)}
          />
        )}

        {/* Owner Admin Dashboard Modal (Restricted to Anthony anthonystunt234@gmail.com with 2FA) */}
        {showAdmin && (
          <AdminDashboardModal
            saveData={saveData}
            currentUser={currentUser}
            onUpdateSave={handleUpdateSave}
            onClose={() => setShowAdmin(false)}
          />
        )}

        {/* Codex Modal */}
        {showCodex && (
          <CodexModal
            saveData={saveData}
            onClose={() => setShowCodex(false)}
          />
        )}

        {/* Shop Modal */}
        {showShop && (
          <ShopModal
            saveData={saveData}
            onUpdateSave={handleUpdateSave}
            onClose={() => setShowShop(false)}
          />
        )}

        {/* Characters Roster Modal */}
        {showCharacters && (
          <CharacterSelectModal
            saveData={saveData}
            onUpdateSave={handleUpdateSave}
            onClose={() => setShowCharacters(false)}
          />
        )}

        {/* Worlds Modal */}
        {showWorlds && (
          <WorldSelectModal
            saveData={saveData}
            onUpdateSave={handleUpdateSave}
            onClose={() => setShowWorlds(false)}
          />
        )}

        {/* Missions Modal */}
        {showMissions && (
          <MissionsModal
            saveData={saveData}
            onUpdateSave={handleUpdateSave}
            onClose={() => setShowMissions(false)}
          />
        )}

        {/* Audio / Settings Modal */}
        {showSettings && (
          <PauseModal
            saveData={saveData}
            onResume={() => setShowSettings(false)}
            onRestart={handleRestart}
            onMainMenu={handleMainMenu}
            onUpdateSave={handleUpdateSave}
          />
        )}

        {/* QA Test Checklist Modal */}
        {showTestChecklist && (
          <TestChecklistModal
            onClose={() => setShowTestChecklist(false)}
          />
        )}

        {/* About & Instructions Modal */}
        {showAbout && (
          <AboutModal
            onClose={() => setShowAbout(false)}
          />
        )}
      </div>
    </div>
  );
}
