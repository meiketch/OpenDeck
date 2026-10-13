import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PublicGameState, CardPack } from '../types/game.ts';
import { GoogleSheetModal } from './GoogleSheetModal.tsx';
import {
  Users,
  Copy,
  Check,
  QrCode,
  Layers,
  Settings,
  Plus,
  Play,
  Crown,
  LogOut,
  Info,
} from 'lucide-react';

interface LobbyViewProps {
  gameState: PublicGameState;
  myId: string;
  isHost: boolean;
  availablePacks: CardPack[];
  selectedPackIds: string[];
  onTogglePack: (packId: string) => void;
  onPackAdded: (pack: CardPack) => void;
  onUpdateSettings: (settings: { targetScore?: number; handSize?: number }) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  gameState,
  myId,
  isHost,
  availablePacks,
  selectedPackIds,
  onTogglePack,
  onPackAdded,
  onUpdateSettings,
  onStartGame,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showSheetModal, setShowSheetModal] = useState(false);

  const players = Object.values(gameState.players);
  const connectedPlayers = players.filter((p) => p.connected);

  const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${gameState.roomCode}`;

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalBlackCards = availablePacks
    .filter((p) => selectedPackIds.includes(p.id))
    .reduce((sum, p) => sum + p.blackCards.length, 0);

  const totalWhiteCards = availablePacks
    .filter((p) => selectedPackIds.includes(p.id))
    .reduce((sum, p) => sum + p.whiteCards.length, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-300">
      {/* Header mit Raum-Code */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-2xl mb-6 backdrop-blur">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-rose-500 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Lobby bereit
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              Raum-Code: <span className="font-mono text-rose-400">{gameState.roomCode}</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={copyInviteLink}
              className="flex-1 sm:flex-none bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold px-4 py-2.5 rounded-xl border border-zinc-700 flex items-center justify-center gap-2 transition cursor-pointer text-sm"
              title="Einladungslink kopieren"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Kopiert!' : 'Link kopieren'}
            </button>

            <button
              onClick={() => setShowQr(!showQr)}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 p-2.5 rounded-xl border border-zinc-700 transition cursor-pointer"
              title="QR-Code für Handy anzeigen"
            >
              <QrCode className="w-5 h-5 text-rose-400" />
            </button>

            <button
              onClick={onLeaveRoom}
              className="bg-zinc-800/80 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 p-2.5 rounded-xl border border-zinc-700/80 transition cursor-pointer"
              title="Lobby verlassen"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* QR Code Popdown */}
        {showQr && (
          <div className="mt-6 p-6 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200">
            <p className="text-sm font-semibold text-zinc-200 mb-3">
              Scanne den Code mit deinem Smartphone:
            </p>
            <div className="p-4 bg-white rounded-2xl shadow-xl">
              <QRCodeSVG value={inviteUrl} size={180} />
            </div>
            <p className="text-xs text-zinc-500 mt-3 font-mono">{inviteUrl}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Spielerliste */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-500" />
                Spieler ({connectedPlayers.length})
              </h2>
              <span className="text-xs text-zinc-400">Min. 2 Spieler</span>
            </div>

            <div className="space-y-2.5">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                    player.id === myId
                      ? 'bg-rose-500/10 border-rose-500/30 text-white'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-200'
                  } ${!player.connected ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shadow text-white"
                      style={{ backgroundColor: player.avatarColor }}
                    >
                      {player.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-1.5">
                        {player.name}
                        {player.id === myId && (
                          <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
                            Du
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {player.isHost ? (
                          <span className="text-amber-400 font-medium flex items-center gap-1">
                            <Crown className="w-3 h-3 inline" /> Host
                          </span>
                        ) : (
                          'Mitspieler'
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      player.connected ? 'bg-emerald-500' : 'bg-zinc-600'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/80 text-xs text-zinc-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>Teile den Raum-Code oder Link mit deinen Freunden, damit sie beitreten.</span>
          </div>
        </div>

        {/* Kartendecks & Einstellungen */}
        <div className="space-y-6">
          {/* Kartendecks */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-rose-500" />
                Kartendecks
              </h2>
              {isHost && (
                <button
                  type="button"
                  onClick={() => setShowSheetModal(true)}
                  className="text-xs bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600 hover:text-white px-2.5 py-1.5 rounded-xl font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Google Sheet
                </button>
              )}
            </div>

            <div className="space-y-2.5 mb-4 max-h-48 overflow-y-auto pr-1">
              {availablePacks.map((pack) => {
                const isSelected = selectedPackIds.includes(pack.id);
                return (
                  <div
                    key={pack.id}
                    onClick={() => isHost && onTogglePack(pack.id)}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition ${
                      isHost ? 'cursor-pointer' : ''
                    } ${
                      isSelected
                        ? 'bg-zinc-800/80 border-rose-500/50'
                        : 'bg-zinc-950/40 border-zinc-800/60 opacity-60'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-sm text-zinc-100">{pack.name}</p>
                      <p className="text-[11px] text-zinc-400">
                        {pack.blackCards.length} Fragen / {pack.whiteCards.length} Antworten
                      </p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                        isSelected
                          ? 'bg-rose-500 border-rose-500 text-white'
                          : 'border-zinc-700 bg-zinc-900'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-xs text-zinc-400 bg-zinc-950/60 rounded-xl p-2.5 flex justify-between font-mono">
              <span>Aktivierte Fragen: {totalBlackCards}</span>
              <span>Aktivierte Antworten: {totalWhiteCards}</span>
            </div>
          </div>

          {/* Spieleinstellungen (nur Host) */}
          {isHost ? (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-rose-500" />
                Einstellungen
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Punkte zum Sieg
                  </label>
                  <select
                    value={gameState.settings.targetScore}
                    onChange={(e) =>
                      onUpdateSettings({ targetScore: parseInt(e.target.value, 10) })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value={3}>3 Punkte (Kurz)</option>
                    <option value={5}>5 Punkte (Standard)</option>
                    <option value={7}>7 Punkte (Mittel)</option>
                    <option value={10}>10 Punkte (Lang)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Startkarten (max. 6 in der Hand)
                  </label>
                  <select
                    value={gameState.settings.handSize}
                    onChange={(e) =>
                      onUpdateSettings({ handSize: parseInt(e.target.value, 10) })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value={3}>3 Karten</option>
                    <option value={4}>4 Karten</option>
                    <option value={5}>5 Karten</option>
                    <option value={6}>6 Karten</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-xl text-center text-sm text-zinc-400">
              <p>Punkte zum Sieg: <strong className="text-zinc-200">{gameState.settings.targetScore}</strong></p>
              <p className="mt-1">Startkarten: <strong className="text-zinc-200">{gameState.settings.handSize}</strong></p>
            </div>
          )}
        </div>
      </div>

      {/* Start-Button */}
      <div className="text-center">
        {isHost ? (
          <button
            type="button"
            onClick={onStartGame}
            disabled={connectedPlayers.length < 2 || totalBlackCards === 0 || totalWhiteCards === 0}
            className="w-full sm:w-auto min-w-[280px] bg-rose-600 hover:bg-rose-500 text-white font-black text-lg py-4 px-8 rounded-2xl shadow-xl shadow-rose-600/30 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-3 mx-auto"
          >
            <Play className="w-6 h-6 fill-white" />
            Spiel starten
          </button>
        ) : (
          <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl max-w-md mx-auto text-sm text-zinc-300 flex items-center justify-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            Warte auf den Host zum Starten des Spiels...
          </div>
        )}
      </div>

      {/* Google Sheet Modal */}
      <GoogleSheetModal
        isOpen={showSheetModal}
        onClose={() => setShowSheetModal(false)}
        onPackAdded={onPackAdded}
      />
    </div>
  );
};
