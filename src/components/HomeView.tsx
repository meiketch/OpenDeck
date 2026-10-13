import React, { useState, useEffect } from 'react';
import { Play, LogIn, Sparkles, FileSpreadsheet, ShieldCheck, Heart } from 'lucide-react';
import { GoogleSheetModal } from './GoogleSheetModal.tsx';
import { CardPack } from '../types/game.ts';

const AVATAR_COLORS = [
  '#f43f5e', // rose
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

interface HomeViewProps {
  initialRoomCode?: string;
  onCreateRoom: (playerName: string, avatarColor: string) => void;
  onJoinRoom: (roomCode: string, playerName: string, avatarColor: string) => void;
  onPackAdded: (pack: CardPack) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  initialRoomCode = '',
  onCreateRoom,
  onJoinRoom,
  onPackAdded,
}) => {
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('opendeck_player_name') || '';
  });
  const [avatarColor, setAvatarColor] = useState(() => {
    return localStorage.getItem('opendeck_avatar_color') || AVATAR_COLORS[0];
  });
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [mode, setMode] = useState<'create' | 'join'>(initialRoomCode ? 'join' : 'create');
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode);
      setMode('join');
    }
  }, [initialRoomCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = playerName.trim();
    if (!trimmedName) {
      setError('Bitte gib deinen Spielernamen ein.');
      return;
    }

    localStorage.setItem('opendeck_player_name', trimmedName);
    localStorage.setItem('opendeck_avatar_color', avatarColor);

    if (mode === 'create') {
      onCreateRoom(trimmedName, avatarColor);
    } else {
      const trimmedCode = roomCode.trim().toUpperCase();
      if (!trimmedCode) {
        setError('Bitte gib den Raum-Code ein.');
        return;
      }
      onJoinRoom(trimmedCode, trimmedName, avatarColor);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex-1 flex flex-col justify-center">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs px-3 py-1.5 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            100% Kostenlos • P2P WebRTC • Eigene Karten
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white mb-2">
            OpenDeck
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base font-medium">
            Das böse, witzige Kartenspiel für dich und deine Freunde.
          </p>
        </div>

        {/* Action Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur">
          {/* Tabs: Erstellen / Beitreten */}
          <div className="grid grid-cols-2 p-1 bg-zinc-950 rounded-2xl border border-zinc-800 mb-6">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`py-2.5 rounded-xl text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                mode === 'create'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              Raum erstellen
            </button>
            <button
              type="button"
              onClick={() => setMode('join')}
              className={`py-2.5 rounded-xl text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                mode === 'join'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Beitreten
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nickname */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Dein Spielername
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="z.B. Mike, Alex, Chef..."
                maxLength={20}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-500 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Avatar Farbe */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Wähle deine Spielerfarbe
              </label>
              <div className="flex items-center justify-between gap-2 pt-1">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full transition transform cursor-pointer ${
                      avatarColor === color
                        ? 'ring-4 ring-white/50 scale-110 shadow-lg'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Raum-Code (nur bei Join) */}
            {mode === 'join' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Raum-Code
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="z.B. K7QM"
                  maxLength={4}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-500 font-mono font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-xl font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-rose-600/30 transition cursor-pointer text-base flex items-center justify-center gap-2 mt-2"
            >
              {mode === 'create' ? (
                <>
                  <Play className="w-5 h-5 fill-white" />
                  Lobby eröffnen
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Spiel beitreten
                </>
              )}
            </button>
          </form>

          {/* Quick-Button: Google Sheet ansehen / importieren */}
          <div className="mt-6 pt-5 border-t border-zinc-800 flex justify-center">
            <button
              type="button"
              onClick={() => setShowSheetModal(true)}
              className="text-xs text-zinc-400 hover:text-rose-400 font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Google Sheets Anleitung & Deck-Import
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="text-center text-xs text-zinc-500 pt-8 space-y-1">
        <p className="flex items-center justify-center gap-1">
          Gebaut mit <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> für gemütliche Spieleabende.
        </p>
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Ende-zu-Ende Direktverbindung über WebRTC. Keine Serverkosten, keine Datenspeicherung.
        </p>
      </footer>

      {/* Google Sheet Modal */}
      <GoogleSheetModal
        isOpen={showSheetModal}
        onClose={() => setShowSheetModal(false)}
        onPackAdded={onPackAdded}
      />
    </div>
  );
};
