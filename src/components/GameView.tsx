import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  PublicGameState,
  WhiteCard as IWhiteCard,
} from '../types/game.ts';
import { BlackCard, WhiteCard } from './Card.tsx';
import { MAX_HAND_SIZE } from '../services/gameEngine.ts';
import {
  Crown,
  Trophy,
  Send,
  ArrowRight,
  RotateCcw,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface GameViewProps {
  gameState: PublicGameState;
  myId: string;
  isHost: boolean;
  hand: IWhiteCard[];
  onSubmitCards: (cardIds: string[]) => void;
  onCzarPick: (submissionId: string) => void;
  onNextRound: () => void;
  onReturnToLobby: () => void;
  onForceJudging: () => void;
  onChooseQuestion: (cardId: string) => void;
  onReveal: (submissionId: string) => void;
  onDrawCard: () => void;
}

export const GameView: React.FC<GameViewProps> = ({
  gameState,
  myId,
  isHost,
  hand,
  onSubmitCards,
  onCzarPick,
  onNextRound,
  onReturnToLobby,
  onForceJudging,
  onChooseQuestion,
  onReveal,
  onDrawCard,
}) => {
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [showScoreboard, setShowScoreboard] = useState(false);

  const isCzar = gameState.czarId === myId;
  const currentBlackCard = gameState.currentBlackCard;
  const pickCount = currentBlackCard?.pick || 1;
  const hasSubmitted = gameState.submittedPlayerIds.includes(myId);

  const playersList = Object.values(gameState.players).sort((a, b) => b.score - a.score);
  const czarPlayer = gameState.players[gameState.czarId];

  // Confetti bei Rundenende oder Spielende
  useEffect(() => {
    if (gameState.phase === 'ROUND_END' || gameState.phase === 'GAME_OVER') {
      confetti({
        particleCount: gameState.phase === 'GAME_OVER' ? 150 : 80,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [gameState.phase]);

  // Bei neuer Runde Selektion zurücksetzen
  useEffect(() => {
    if (gameState.phase === 'QUESTION') {
      setSelectedCardIds([]);
      setSelectedSubmissionId(null);
    }
  }, [gameState.phase, gameState.roundNumber]);

  const toggleSelectHandCard = (cardId: string) => {
    if (hasSubmitted || isCzar || gameState.phase !== 'QUESTION') return;

    if (selectedCardIds.includes(cardId)) {
      setSelectedCardIds(selectedCardIds.filter((id) => id !== cardId));
    } else {
      if (pickCount === 1) {
        setSelectedCardIds([cardId]);
      } else {
        if (selectedCardIds.length < pickCount) {
          setSelectedCardIds([...selectedCardIds, cardId]);
        } else {
          // Ersetze älteste Auswahl
          setSelectedCardIds([...selectedCardIds.slice(1), cardId]);
        }
      }
    }
  };

  const handleSendSubmission = () => {
    if (selectedCardIds.length === pickCount) {
      onSubmitCards(selectedCardIds);
    }
  };

  const handleConfirmCzarPick = () => {
    if (isCzar && selectedSubmissionId) {
      onCzarPick(selectedSubmissionId);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-6xl mx-auto px-4 py-4 sm:py-6 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-zinc-900/90 border border-zinc-800 rounded-2xl px-4 py-3 shadow-xl backdrop-blur mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 font-black text-xs sm:text-sm px-2.5 py-1 rounded-xl">
            Runde {gameState.roundNumber}
          </div>

          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-300">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-zinc-400">Czar:</span>
            <span className="text-white font-bold">{czarPlayer?.name || 'Wird ermittelt'}</span>
            {isCzar && (
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] px-1.5 py-0.5 rounded font-black">
                DU!
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowScoreboard(!showScoreboard)}
          className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-xl border border-zinc-700 text-xs sm:text-sm font-semibold transition cursor-pointer"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Punkte</span>
          {showScoreboard ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Aufklappbares Scoreboard */}
      {showScoreboard && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 shadow-2xl animate-in slide-in-from-top-3 duration-200">
          <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-400 mb-3 flex items-center justify-between">
            <span>Rangliste (Ziel: {gameState.settings.targetScore} Punkte)</span>
            <Users className="w-4 h-4 text-zinc-500" />
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {playersList.map((player, index) => (
              <div
                key={player.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                  player.id === myId
                    ? 'bg-rose-500/10 border-rose-500/30 text-white font-bold'
                    : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-zinc-500 font-mono text-[11px] w-4">#{index + 1}</span>
                  <div
                    className="w-5 h-5 rounded-full shrink-0 text-[10px] flex items-center justify-center font-bold text-white shadow"
                    style={{ backgroundColor: player.avatarColor }}
                  >
                    {player.name[0]}
                  </div>
                  <span className="truncate">{player.name}</span>
                </div>
                <span className="font-mono font-black text-rose-400 ml-2">{player.score} P</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Game Stage */}
      <div className="flex-1 flex flex-col items-center justify-center my-4">
        {/* Schwarze Karte */}
        {currentBlackCard && (
          <div className="mb-6 transform transition hover:scale-102 duration-200">
            <BlackCard card={currentBlackCard} size="lg" />
          </div>
        )}

        {gameState.phase === 'QUESTION' && !isCzar && !hasSubmitted && selectedCardIds.length > 0 && (
          <div className="mb-4 flex flex-wrap justify-center gap-2 max-w-xl">
            {selectedCardIds.map((id, i) => (
              <div key={id} className="bg-white text-zinc-900 text-xs font-semibold rounded-lg px-3 py-1.5 shadow">
                Lücke {i + 1}: {hand.find((c) => c.id === id)?.text}
              </div>
            ))}
          </div>
        )}

        {/* Phase: CZAR_SELECT (Czar wählt eine Fragekarte) */}
        {gameState.phase === 'CZAR_SELECT' && (
          <div className="w-full max-w-4xl text-center mb-6">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 mb-6 shadow-xl">
              <h2 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                {isCzar
                  ? 'Wähle eine Fragekarte für diese Runde!'
                  : `${czarPlayer?.name || 'Der Czar'} wählt gerade die Fragekarte...`}
              </h2>
            </div>
            <div className="flex flex-wrap items-stretch justify-center gap-4">
              {gameState.blackOptions.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  disabled={!isCzar}
                  onClick={() => onChooseQuestion(card.id)}
                  className={`rounded-2xl transition ${
                    isCzar ? 'cursor-pointer hover:scale-105 hover:ring-4 hover:ring-rose-500' : 'cursor-default'
                  }`}
                >
                  <BlackCard card={card} size="md" className="text-left" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status / Anweisungs-Banner */}
        {gameState.phase === 'QUESTION' && (
          <div className="w-full max-w-xl text-center mb-6">
            {isCzar ? (
              <div className="bg-amber-400/10 border border-amber-400/20 text-amber-200 rounded-2xl p-4 flex flex-col items-center gap-2">
                <Crown className="w-6 h-6 text-amber-400 animate-bounce" />
                <p className="font-bold text-base">Du bist der Czar!</p>
                <p className="text-xs text-amber-300/80">
                  Lehn dich zurück, während die anderen Spieler ihre besten Karten auswählen.
                </p>
                <div className="mt-2 text-xs font-semibold bg-zinc-950/40 px-3 py-1 rounded-full text-zinc-300">
                  {gameState.submittedPlayerIds.length} von{' '}
                  {Math.max(0, playersList.filter((p) => p.connected).length - 1)} Antworten da
                </div>
                {isHost && gameState.submittedPlayerIds.length > 0 && (
                  <button
                    onClick={onForceJudging}
                    className="mt-2 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1 rounded-lg border border-zinc-700 transition"
                  >
                    Vorzeitig auflösen
                  </button>
                )}
              </div>
            ) : hasSubmitted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl p-4 flex items-center justify-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <div className="text-left">
                  <p className="font-bold text-sm">Karte(n) eingereicht!</p>
                  <p className="text-xs text-emerald-400/80">
                    Warten auf die restlichen Mitspieler...
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
                <div className="text-center sm:text-left">
                  <p className="font-bold text-zinc-100 text-sm">
                    Wähle {pickCount} {pickCount === 1 ? 'Karte' : 'Karten'} aus deiner Hand:
                  </p>
                  <p className="text-xs text-zinc-400">
                    Ausgewählt: {selectedCardIds.length} / {pickCount}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Deine Antworten bleiben verdeckt, bis der Czar sie aufdeckt.
                  </p>
                </div>

                <button
                  onClick={handleSendSubmission}
                  disabled={selectedCardIds.length !== pickCount}
                  className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-rose-600/30 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Fertig
                </button>
              </div>
            )}
          </div>
        )}

        {/* Phase: JUDGING (Der Czar liest vor und wählt Sieger) */}
        {gameState.phase === 'JUDGING' && (
          <div className="w-full max-w-4xl text-center mb-6">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 mb-6 shadow-xl">
              <h2 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                {isCzar
                  ? 'Lies die Karten vor und wähle die lustigste Antwort!'
                  : 'Der Czar liest die Antworten vor und kürt den Rundensieger...'}
              </h2>
            </div>

            {/* Anonymisierte Antworten (verdeckt bis der Czar sie aufdeckt) */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {gameState.revealedSubmissions.map((sub) => {
                const isSelected = selectedSubmissionId === sub.id;
                const isRevealed = gameState.revealedSubmissionIds.includes(sub.id);
                return (
                  <div
                    key={sub.id}
                    onClick={() => {
                      if (!isCzar) return;
                      if (!isRevealed) onReveal(sub.id);
                      else setSelectedSubmissionId(sub.id);
                    }}
                    className={`flex flex-col gap-2 p-2 rounded-2xl transition ${
                      isCzar ? 'cursor-pointer' : ''
                    } ${
                      isSelected
                        ? 'ring-4 ring-rose-500 scale-105 bg-rose-500/10'
                        : 'hover:scale-102'
                    }`}
                  >
                    <div className="flex gap-2">
                      {sub.cards.map((c, cIdx) =>
                        isRevealed ? (
                          <WhiteCard
                            key={`${sub.id}_${cIdx}`}
                            card={c}
                            size="md"
                            className="pointer-events-none"
                          />
                        ) : (
                          <div
                            key={`${sub.id}_${cIdx}`}
                            className="bg-zinc-800 border-2 border-zinc-600 rounded-2xl w-44 sm:w-52 min-h-[190px] flex items-center justify-center text-zinc-400 font-black text-sm"
                          >
                            {isCzar ? 'Antippen zum Aufdecken' : 'OpenDeck'}
                          </div>
                        )
                      )}
                    </div>
                    {isCzar && isSelected && isRevealed && (
                      <button
                        onClick={handleConfirmCzarPick}
                        className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-2.5 px-4 rounded-xl shadow-lg shadow-rose-600/40 text-sm transition animate-in zoom-in-95 duration-150"
                      >
                        👑 Als Sieger küren!
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Phase: ROUND_END (Rundensieger) */}
        {gameState.phase === 'ROUND_END' && gameState.lastWinner && (
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-center mb-6 animate-in zoom-in-95 duration-200">
            <div className="inline-flex p-3 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-2xl mb-3">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white mb-1">
              Rundensieger: <span className="text-rose-400">{gameState.lastWinner.playerName}</span>!
            </h2>
            <p className="text-xs text-zinc-400 mb-6">+1 Punkt für diese legendäre Kombination:</p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              {gameState.lastWinner.cards.map((c, idx) => (
                <WhiteCard key={idx} card={c} size="md" className="pointer-events-none" />
              ))}
            </div>

            {(isCzar || isHost) ? (
              <button
                onClick={onNextRound}
                className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white font-black py-3.5 px-8 rounded-2xl shadow-xl shadow-rose-600/30 transition text-base cursor-pointer inline-flex items-center justify-center gap-2"
              >
                Nächste Runde
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <p className="text-xs text-zinc-400 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 animate-spin text-zinc-500" />
                Warten auf Czar / Host für die nächste Runde...
              </p>
            )}
          </div>
        )}

        {/* Phase: GAME_OVER (Gesamtsieg) */}
        {gameState.phase === 'GAME_OVER' && gameState.lastWinner && (
          <div className="w-full max-w-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center mb-6 animate-in zoom-in-90 duration-300">
            <div className="inline-flex p-4 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-3xl mb-4 shadow-lg shadow-amber-400/20">
              <Crown className="w-12 h-12 animate-pulse" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white mb-2">
              🎉 {gameState.lastWinner.playerName} GEWINNT! 🎉
            </h1>
            <p className="text-zinc-400 text-sm mb-8">
              Hat zuerst die {gameState.settings.targetScore} Punkte erreicht und triumphiert!
            </p>

            {/* Podium */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 mb-8 max-w-md mx-auto space-y-2">
              {playersList.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-black text-zinc-500 w-4">#{idx + 1}</span>
                    <span className="font-bold text-zinc-200">{p.name}</span>
                  </div>
                  <span className="font-black text-rose-400 font-mono">{p.score} Punkte</span>
                </div>
              ))}
            </div>

            {isHost && (
              <button
                onClick={onReturnToLobby}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-6 rounded-2xl border border-zinc-700 transition cursor-pointer inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Zurück zur Lobby
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Stage: Eigene Handkarten */}
      {gameState.phase !== 'GAME_OVER' && (
        <div className="w-full pt-4 border-t border-zinc-800/80 mt-auto">
          <div className="flex items-center justify-between mb-3 px-2 gap-2">
            <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider">
              Deine Hand ({hand.length} / {MAX_HAND_SIZE} Karten)
            </span>
            <button
              onClick={onDrawCard}
              disabled={hand.length >= MAX_HAND_SIZE}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-700 font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Karte ziehen
            </button>
          </div>
          <p className="text-xs text-zinc-500 mb-2 px-2">
            {isCzar || gameState.phase !== 'QUESTION'
              ? 'Du kannst jederzeit nachziehen.'
              : hasSubmitted
                ? 'Bereits eingereicht'
                : 'Karten antippen zum Auswählen'}
          </p>

          <div className="flex gap-3 overflow-x-auto pb-4 pt-1 px-1 snap-x no-scrollbar">
            {hand.map((card) => {
              const selectedIdx = selectedCardIds.indexOf(card.id);
              const isSelected = selectedIdx !== -1;
              return (
                <div key={card.id} className="shrink-0 snap-start">
                  <WhiteCard
                    card={card}
                    isSelected={isSelected}
                    selectionOrder={pickCount > 1 && isSelected ? selectedIdx + 1 : undefined}
                    onClick={() => toggleSelectHandCard(card.id)}
                    disabled={hasSubmitted || isCzar || gameState.phase !== 'QUESTION'}
                    size="md"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
