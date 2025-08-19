import { useState, useEffect, useRef } from 'react';
import { Trophy, Users, RotateCcw, Plus, Minus, Edit3, Crown, Medal, Award, Menu, X } from 'lucide-react';

interface HistoryEntry {
  points: number;
  timestamp: string;
  type: 'add' | 'subtract';
}

interface Player {
  id: number;
  name: string;
  score: number;
  history: HistoryEntry[];
}

const ScoreTracker = () => {
  const [gameState, setGameState] = useState<'setup' | 'playing'>('setup');
  const [playerCount, setPlayerCount] = useState(2);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [customScore, setCustomScore] = useState('');
  const [activeCustomPlayer, setActiveCustomPlayer] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  
  const customInputRef = useRef<HTMLInputElement>(null);

  // Utilitaires pour les cookies
  const setCookie = (name: string, value: any, hours: number = 2): void => {
    const date = new Date();
    date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + JSON.stringify(value) + ";" + expires + ";path=/;SameSite=Lax";
  };

  const getCookie = (name: string): any => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        try {
          return JSON.parse(c.substring(nameEQ.length, c.length));
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  };

  const deleteCookie = (name: string): void => {
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  // Charger les données sauvegardées au démarrage
  useEffect(() => {
    const savedData = getCookie('scoreTrackerData');
    if (savedData && savedData.players) {
      setPlayers(savedData.players);
      setPlayerCount(savedData.players.length);
      setGameState(savedData.gameState || 'setup');
    }
  }, []);

  // Sauvegarder les données à chaque modification
  useEffect(() => {
    if (players.length > 0) {
      setCookie('scoreTrackerData', {
        players,
        gameState,
        timestamp: Date.now()
      });
    }
  }, [players, gameState]);

  // Initialiser les joueurs quand le nombre change
  useEffect(() => {
    if (gameState === 'setup') {
      const newPlayers = [];
      for (let i = 0; i < playerCount; i++) {
        const existingPlayer = players.find(p => p.id === i + 1);
        newPlayers.push({
          id: i + 1,
          name: existingPlayer?.name || `Joueur ${i + 1}`,
          score: existingPlayer?.score || 0,
          history: existingPlayer?.history || []
        });
      }
      setPlayers(newPlayers);
    }
  }, [playerCount, gameState]);

  // Focus sur l'input personnalisé quand il s'ouvre
  useEffect(() => {
    if (activeCustomPlayer !== null && customInputRef.current) {
      setTimeout(() => {
        customInputRef.current.focus();
      }, 100);
    }
  }, [activeCustomPlayer]);

  const updatePlayerName = (playerId: number, newName: string): void => {
    setPlayers(prev => prev.map(player =>
      player.id === playerId 
        ? { ...player, name: newName || `Joueur ${playerId}` }
        : player
    ));
  };

  const addScore = (playerId: number, points: number, isSubtraction: boolean = false): void => {
    const actualPoints = isSubtraction ? -Math.abs(points) : Math.abs(points);
    
    setPlayers(prev => prev.map(player =>
      player.id === playerId 
        ? { 
            ...player, 
            score: Math.max(0, player.score + actualPoints),
            history: [
              ...player.history,
              {
                points: actualPoints,
                timestamp: new Date().toLocaleTimeString(),
                type: isSubtraction ? 'subtract' : 'add'
              }
            ]
          }
        : player
    ));
  };

  const handleCustomScore = (playerId: number): void => {
    const points = parseInt(customScore);
    if (!isNaN(points) && points > 0) {
      addScore(playerId, points);
      setCustomScore('');
      setActiveCustomPlayer(null);
    }
  };

  const handleCustomSubtract = (playerId: number): void => {
    const points = parseInt(customScore);
    if (!isNaN(points) && points > 0) {
      addScore(playerId, points, true);
      setCustomScore('');
      setActiveCustomPlayer(null);
    }
  };

  const resetGame = (): void => {
    setPlayers(prev => prev.map(player => ({
      ...player,
      score: 0,
      history: []
    })));
    setShowResetConfirm(false);
    deleteCookie('scoreTrackerData');
  };

  const startGame = () => {
    setGameState('playing');
    setShowMenu(false);
  };

  const backToSetup = () => {
    setGameState('setup');
    setShowMenu(false);
  };

  // Trier les joueurs par score pour le classement
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const getRankIcon = (rank: number): JSX.Element => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />;
      default: return <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs sm:text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3: return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default: return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
    }
  };

  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-600 p-3 sm:p-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20">
            <div className="text-center mb-6 sm:mb-8">
              <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-yellow-400" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Compteur de Points</h1>
              <p className="text-indigo-900 text-sm sm:text-base">Configuration de la partie</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-white/90 font-medium mb-3 text-sm sm:text-base">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                  Nombre de joueurs
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[2, 3, 4].map(count => (
                    <button
                      key={count}
                      onClick={() => setPlayerCount(count)}
                      className={`p-4 rounded-xl font-medium transition-all duration-200 text-lg sm:text-xl ${
                        playerCount === count
                          ? 'bg-white text-indigo-600 shadow-lg transform scale-105'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white/90 font-medium mb-3 text-sm sm:text-base">
                  Noms des joueurs
                </label>
                <div className="space-y-3">
                  {players.map(player => (
                    <input
                      key={player.id}
                      type="text"
                      placeholder={`Joueur ${player.id}`}
                      value={player.name}
                      onChange={(e) => updatePlayerName(player.id, e.target.value)}
                      className="w-full p-4 rounded-xl bg-white/20 text-white placeholder-white/60 border border-white/30 focus:border-white focus:bg-white/30 focus:outline-none transition-all duration-200 text-base"
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={startGame}
                className="w-full bg-white text-indigo-600 p-4 sm:p-5 rounded-xl font-bold text-lg sm:text-xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 transform active:scale-95 shadow-lg"
              >
                Commencer la partie
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-600">
      {/* Header mobile optimisé */}
      <div className="sticky top-0 z-40 bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
            <h1 className="text-lg sm:text-2xl font-bold text-white">Compteur de Points</h1>
          </div>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-200"
          >
            {showMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Menu mobile */}
        {showMenu && (
          <div className="bg-white/10 backdrop-blur-lg border-t border-white/20 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={backToSetup}
                className="px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all duration-200 text-center"
              >
                Configuration
              </button>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-4 py-3 bg-red-500/80 text-indigo-900 rounded-xl hover:bg-red-600 active:bg-red-700 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4 max-w-6xl mx-auto">
        {/* Classement optimisé mobile */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-xl border border-white/20">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
            Classement
          </h2>
          <div className="space-y-2 sm:space-y-3">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`p-3 sm:p-4 rounded-xl ${getRankColor(index + 1)} flex items-center justify-between shadow-lg`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  {getRankIcon(index + 1)}
                  <span className="font-bold text-base sm:text-lg truncate max-w-32 sm:max-w-none">{player.name}</span>
                </div>
                <span className="text-xl sm:text-2xl font-bold">{player.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grille de joueurs adaptative */}
        <div className={`grid gap-4 sm:gap-6 ${
          players.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' : 
          players.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4'
        }`}>
          {players.map(player => (
            <div
              key={player.id}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 shadow-xl border border-white/20"
            >
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 truncate">{player.name}</h3>
                <div className="text-3xl sm:text-4xl font-bold text-yellow-400">{player.score}</div>
              </div>

              {/* Boutons d'action optimisés tactile */}
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    onClick={() => addScore(player.id, 1)}
                    className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-indigo-900 p-3 sm:p-4 rounded-xl font-bold text-lg transition-all duration-200 transform active:scale-95 shadow-lg"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => addScore(player.id, 2)}
                    className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-indigo-900 p-3 sm:p-4 rounded-xl font-bold text-lg transition-all duration-200 transform active:scale-95 shadow-lg"
                  >
                    +2
                  </button>
                </div>

                {/* Score personnalisé */}
                {activeCustomPlayer === player.id ? (
                  <div className="space-y-3">
                    <input
                      ref={customInputRef}
                      type="number"
                      inputMode="numeric"
                      value={customScore}
                      onChange={(e) => setCustomScore(e.target.value)}
                      placeholder="Points personnalisés"
                      className="w-full p-3 sm:p-4 rounded-xl bg-white/20 text-white placeholder-white/60 border border-white/30 focus:border-white focus:bg-white/30 focus:outline-none text-base"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleCustomScore(player.id);
                        }
                      }}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleCustomScore(player.id)}
                        className="bg-white text-blue-600 p-2 sm:p-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-1 text-sm hover:bg-gray-100"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Ajouter</span>
                        <span className="sm:hidden">+</span>
                      </button>
                      <button
                        onClick={() => handleCustomSubtract(player.id)}
                        className="bg-white text-red-600 p-2 sm:p-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-1 text-sm hover:bg-gray-100"
                      >
                        <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Retirer</span>
                        <span className="sm:hidden">-</span>
                      </button>
                      <button
                        onClick={() => setActiveCustomPlayer(null)}
                        className="bg-white text-gray-700 p-2 sm:p-3 rounded-lg font-medium transition-all duration-200 text-sm hover:bg-gray-100"
                      >
                        <span className="hidden sm:inline">Annuler</span>
                        <span className="sm:hidden">×</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveCustomPlayer(player.id)}
                    className="w-full bg-white text-purple-600 p-3 sm:p-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 transform active:scale-95 hover:bg-gray-100"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="text-sm sm:text-base">Score personnalisé</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    onClick={() => addScore(player.id, 1, true)}
                    className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-indigo-900 p-3 sm:p-4 rounded-xl font-bold text-lg transition-all duration-200 transform active:scale-95 shadow-lg"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => addScore(player.id, 2, true)}
                    className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-indigo-900 p-3 sm:p-4 rounded-xl font-bold text-lg transition-all duration-200 transform active:scale-95 shadow-lg"
                  >
                    -2
                  </button>
                </div>
              </div>

              {/* Historique récent */}
              {player.history.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-white/80 text-xs sm:text-sm mb-2">Dernières actions:</p>
                  <div className="space-y-1">
                    {player.history.slice(-2).reverse().map((entry, index) => (
                      <div key={index} className="text-xs text-white/70 flex justify-between">
                        <span className={entry.type === 'subtract' ? 'text-red-300' : 'text-green-300'}>
                          {entry.type === 'subtract' ? '' : '+'}{entry.points} pts
                        </span>
                        <span>{entry.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modal de confirmation reset */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 max-w-sm w-full">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Confirmer la remise à zéro</h3>
              <p className="text-white/80 mb-6 text-sm sm:text-base">
                Êtes-vous sûr de vouloir remettre tous les scores à zéro ? Cette action est irréversible.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-indigo-900 p-3 sm:p-4 rounded-xl font-medium transition-all duration-200"
                >
                  Annuler
                </button>
                <button
                  onClick={resetGame}
                  className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 text-indigo-900 p-3 sm:p-4 rounded-xl font-medium transition-all duration-200"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreTracker;