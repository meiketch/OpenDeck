import React, { useState } from 'react';
import { CardPack } from '../types/game.ts';
import { createCardPackFromCsv, fetchCardsFromGoogleSheet, saveCustomPack } from '../services/sheetsParser.ts';
import { X, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPackAdded: (pack: CardPack) => void;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  onPackAdded,
}) => {
  const [url, setUrl] = useState('');
  const [packName, setPackName] = useState('Freunde-Deck');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CardPack | null>(null);

  if (!isOpen) return null;

  const handleTestAndLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPreview(null);

    if (!url.trim()) {
      setError('Bitte gib einen Google Sheet Link ein.');
      return;
    }

    setIsLoading(true);
    try {
      const pack = await fetchCardsFromGoogleSheet(url, packName.trim() || 'Freunde-Deck');
      setPreview(pack);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Konnte Google Sheet nicht laden.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setError(null);
    setPreview(null);
    setIsLoading(true);
    try {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Bitte wähle eine CSV-Datei aus.');
      }

      const csvText = await file.text();
      const pack = createCardPackFromCsv(csvText, packName.trim() || 'Freunde-Deck', `der Datei „${file.name}“`);
      setPreview(pack);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Konnte CSV-Datei nicht laden.');
    } finally {
      setIsLoading(false);
      input.value = '';
    }
  };

  const handleSaveAndUse = () => {
    if (preview) {
      saveCustomPack(preview);
      onPackAdded(preview);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Google Sheets Karten-Sync</h2>
            <p className="text-sm text-zinc-400">Gemeinsam mit Freunden Karten anlegen</p>
          </div>
        </div>

        {/* Kurze Anleitung */}
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 mb-5 text-xs text-zinc-300 space-y-2">
          <p className="font-semibold text-zinc-100 flex items-center gap-1.5">
            💡 So legt ihr euer Google Sheet an:
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-400">
            <li>
              <strong className="text-zinc-200">Spalte A:</strong> Schwarze Karten (Fragen mit <code className="bg-zinc-800 px-1 py-0.5 rounded text-rose-400">___</code> für Lücken)
            </li>
            <li>
              <strong className="text-zinc-200">Spalte B:</strong> Weiße Karten (Witzige Antworten)
            </li>
            <li>
              In Google Sheets: <strong className="text-zinc-200">Datei → Freigeben → Jeder mit Link darf ansehen</strong> oder <strong className="text-zinc-200">Im Web veröffentlichen → CSV</strong>. Füge den normalen Freigabelink oder den veröffentlichten CSV-Link ein.
            </li>
          </ul>
        </div>

        <form onSubmit={handleTestAndLoad} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Name des Decks
            </label>
            <input
              type="text"
              value={packName}
              onChange={(e) => setPackName(e.target.value)}
              placeholder="z.B. Mikes Insider Deck"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Google Sheet Link (URL)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Oder CSV-Datei vom Gerät laden
            </label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleLocalFileChange}
              disabled={isLoading}
              className="w-full text-sm text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:font-semibold file:text-zinc-100 hover:file:bg-zinc-700 disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-3 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {preview && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl p-4 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <p className="font-semibold text-white">Karten erfolgreich geladen!</p>
                <p className="text-xs text-emerald-300/80 mt-1">
                  Gefunden: <strong>{preview.blackCards.length}</strong> Fragen (schwarz) und{' '}
                  <strong>{preview.whiteCards.length}</strong> Antworten (weiß).
                </p>
              </div>
            </div>
          )}

          <div className="pt-2 flex gap-3">
            {!preview ? (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-rose-600/30"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Lade Tabelle...
                  </>
                ) : (
                  <>Link testen & laden</>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveAndUse}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-600/30"
              >
                <CheckCircle2 className="w-5 h-5" />
                Deck speichern & aktivieren
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
