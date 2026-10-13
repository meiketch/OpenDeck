import Papa from 'papaparse';
import { BlackCard, WhiteCard, CardPack } from '../types/game.ts';
import { DEFAULT_BLACK_CARDS, DEFAULT_WHITE_CARDS } from '../data/defaultCards.ts';

/**
 * Zählt wie viele Antworten eine schwarze Karte benötigt,
 * basierend auf Unterstrichen (z.B. '___').
 */
export function calculatePickCount(text: string): number {
  const matches = text.match(/_{3,}/g);
  if (!matches || matches.length === 0) {
    return 1;
  }
  return matches.length;
}

/**
 * Parst CSV-Inhalte entweder aus:
 * 1) 2-Spalten-Modus (Spalte A = Schwarze Karten/Fragen, Spalte B = Weiße Karten/Antworten)
 * 2) Spalten mit Headern (Typ/Type, Text/Karte, Pack, Pick, Autor)
 */
export function parseCardsCsv(csvContent: string, packName: string = 'Freunde-Pack'): {
  blackCards: BlackCard[];
  whiteCards: WhiteCard[];
} {
  const parsed = Papa.parse<string[]>(csvContent.trim(), {
    skipEmptyLines: 'greedy',
    header: false,
  });

  const rows = parsed.data;
  if (!rows || rows.length === 0) {
    return { blackCards: [], whiteCards: [] };
  }

  const blackCards: BlackCard[] = [];
  const whiteCards: WhiteCard[] = [];

  const firstRow = rows[0].map((c) => c.toLowerCase().trim());
  const hasTypeHeader = firstRow.includes('type') || firstRow.includes('typ');
  const hasTextHeader = firstRow.includes('text') || firstRow.includes('karte') || firstRow.includes('frage');

  if (hasTypeHeader && hasTextHeader) {
    // Header-basierte Tabelle
    const typeIdx = firstRow.findIndex((h) => h === 'type' || h === 'typ');
    const textIdx = firstRow.findIndex((h) => h === 'text' || h === 'karte' || h === 'frage');
    const packIdx = firstRow.findIndex((h) => h === 'pack' || h === 'kategorie');
    const pickIdx = firstRow.findIndex((h) => h === 'pick' || h === 'lücken');
    const authorIdx = firstRow.findIndex((h) => h === 'author' || h === 'autor');

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[textIdx]) continue;

      const type = (row[typeIdx] || '').toLowerCase().trim();
      const text = row[textIdx].trim();
      if (!text) continue;

      const currentPack = (packIdx !== -1 && row[packIdx]?.trim()) || packName;
      const author = authorIdx !== -1 ? row[authorIdx]?.trim() : undefined;

      const isBlack =
        type === 'black' ||
        type === 'schwarz' ||
        type === 'frage' ||
        type === 'question' ||
        type === 'b';

      if (isBlack) {
        let pick = 1;
        if (pickIdx !== -1 && row[pickIdx]) {
          const parsedPick = parseInt(row[pickIdx].trim(), 10);
          if (!isNaN(parsedPick) && parsedPick > 0) pick = parsedPick;
        } else {
          pick = calculatePickCount(text);
        }

        blackCards.push({
          id: `custom_b_${blackCards.length + 1}`,
          text,
          pick,
          pack: currentPack,
          author,
        });
      } else {
        whiteCards.push({
          id: `custom_w_${whiteCards.length + 1}`,
          text,
          pack: currentPack,
          author,
        });
      }
    }
  } else {
    // 2-Spalten Layout (Spalte A = Fragen, Spalte B = Antworten)
    // Optional kann Zeile 1 ein Header sein wie "Fragen | Antworten"
    let startIndex = 0;
    const cellA0 = (rows[0][0] || '').toLowerCase().trim();
    const cellB0 = (rows[0][1] || '').toLowerCase().trim();
    if (
      cellA0.includes('frage') ||
      cellA0.includes('schwarz') ||
      cellB0.includes('antwort') ||
      cellB0.includes('weiß')
    ) {
      startIndex = 1;
    }

    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i];
      const colA = (row[0] || '').trim();
      const colB = (row[1] || '').trim();

      if (colA) {
        blackCards.push({
          id: `csv_b_${blackCards.length + 1}`,
          text: colA,
          pick: calculatePickCount(colA),
          pack: packName,
        });
      }

      if (colB) {
        whiteCards.push({
          id: `csv_w_${whiteCards.length + 1}`,
          text: colB,
          pack: packName,
        });
      }
    }
  }

  return { blackCards, whiteCards };
}

export function createCardPackFromCsv(
  csvContent: string,
  packName: string,
  sourceName: string
): CardPack {
  const { blackCards, whiteCards } = parseCardsCsv(csvContent, packName);

  if (blackCards.length === 0 && whiteCards.length === 0) {
    throw new Error(`Keine gültigen Karten in ${sourceName} gefunden. Prüfe die Spalten und den CSV-Inhalt.`);
  }

  return {
    id: `pack_csv_${Date.now()}`,
    name: packName,
    description: `Geladen aus ${sourceName} (${blackCards.length} Fragen, ${whiteCards.length} Antworten)`,
    blackCards,
    whiteCards,
  };
}

/**
 * Lädt alle verfügbaren Packs (Standard + gespeicherte Custom Decks)
 */
export function getSavedPacks(): CardPack[] {
  const defaultPack: CardPack = {
    id: 'pack_default',
    name: 'OpenDeck Standard (Deutsch)',
    description: '30 lustige Fragen und 50 pointierte Antworten für den schnellen Start.',
    blackCards: DEFAULT_BLACK_CARDS,
    whiteCards: DEFAULT_WHITE_CARDS,
  };

  try {
    const raw = localStorage.getItem('opendeck_custom_packs');
    if (raw) {
      const customPacks: CardPack[] = JSON.parse(raw);
      return [defaultPack, ...customPacks];
    }
  } catch (err) {
    console.error('Fehler beim Laden gespeicherter Packs:', err);
  }

  return [defaultPack];
}

/**
 * Speichert ein neues CardPack im LocalStorage
 */
export function saveCustomPack(pack: CardPack): void {
  try {
    const current = getSavedPacks().filter((p) => p.id !== 'pack_default' && p.id !== pack.id);
    current.push(pack);
    localStorage.setItem('opendeck_custom_packs', JSON.stringify(current));
  } catch (err) {
    console.error('Fehler beim Speichern des Packs:', err);
  }
}

/**
 * Löscht ein Custom Pack aus dem LocalStorage
 */
export function deleteCustomPack(packId: string): void {
  try {
    const current = getSavedPacks().filter((p) => p.id !== 'pack_default' && p.id !== packId);
        localStorage.setItem('opendeck_custom_packs', JSON.stringify(current));
  } catch (err) {
    console.error('Fehler beim Löschen des Packs:', err);
  }
}
