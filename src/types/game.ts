export interface BlackCard {
  id: string;
  text: string;
  pick: number; // Wie viele weiße Karten müssen gespielt werden? Standard: 1
  pack?: string;
  author?: string;
}

export interface WhiteCard {
  id: string;
  text: string;
  pack?: string;
  author?: string;
}

export interface CardPack {
  id: string;
  name: string;
  description?: string;
  blackCards: BlackCard[];
  whiteCards: WhiteCard[];
}

export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  isCzar: boolean;
  connected: boolean;
  avatarColor: string;
}

export interface Submission {
  playerId: string;
  cards: WhiteCard[];
}

export interface RevealedSubmission {
  id: string; // anonyme ID wie 'sub_1'
  cards: WhiteCard[];
}

export type GamePhase =
  | 'LOBBY'
  | 'CZAR_SELECT'
  | 'QUESTION'
  | 'JUDGING'
  | 'ROUND_END'
  | 'GAME_OVER';

export interface GameSettings {
  targetScore: number;
  handSize: number;
  czarTimerSeconds: number; // 0 für unendlich
  allowCustomBlanks: boolean;
  googleSheetUrl?: string;
}

export interface PublicGameState {
  roomCode: string;
  phase: GamePhase;
  players: Record<string, Player>;
  czarId: string;
  currentBlackCard: BlackCard | null;
  blackOptions: BlackCard[]; // Auswahl an Fragekarten für den Czar
  revealedSubmissionIds: string[]; // Vom Czar bereits aufgedeckte Antworten
  revealedSubmissions: RevealedSubmission[];
  lastWinner: {
    playerId: string;
    playerName: string;
    blackCard: BlackCard;
    cards: WhiteCard[];
  } | null;
  settings: GameSettings;
  roundNumber: number;
  submittedPlayerIds: string[]; // Um zu sehen wer schon abgegeben hat (ohne die Karten zu verraten)
}

export type NetworkMessage =
  | { type: 'STATE_SYNC'; state: PublicGameState }
  | { type: 'DEAL_CARDS'; cards: WhiteCard[]; replaceAll?: boolean }
  | { type: 'JOIN_REQUEST'; name: string; avatarColor: string }
  | { type: 'SUBMIT_CARDS'; cardIds: string[] }
  | { type: 'CZAR_PICK'; submissionId: string }
  | { type: 'CHOOSE_QUESTION'; cardId: string }
  | { type: 'REVEAL_SUBMISSION'; submissionId: string }
  | { type: 'DRAW_CARD' }
  | { type: 'START_GAME' }
  | { type: 'NEXT_ROUND' }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<GameSettings> }
  | { type: 'REACTION'; emoji: string; fromPlayer: string };
