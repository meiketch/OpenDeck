import {
  BlackCard,
  WhiteCard,
  CardPack,
  PublicGameState,
  GameSettings,
  Player,
} from '../types/game.ts';

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const MAX_HAND_SIZE = 6;
export const QUESTION_OPTIONS = 3;

export class HostGameEngine {
  public state: PublicGameState;
  private blackDeck: BlackCard[] = [];
  private whiteDeck: WhiteCard[] = [];
  private discardedBlack: BlackCard[] = [];
  private discardedWhite: WhiteCard[] = [];

  // Nur auf dem Host gespeichert:
  private playerHands: Record<string, WhiteCard[]> = {};
  private currentSubmissions: Record<string, WhiteCard[]> = {};
  private submissionToPlayerMap: Record<string, string> = {}; // 'sub_0' -> playerId
  private czarOrder: string[] = [];
  private czarIndex: number = -1;

  private onStateChange: (state: PublicGameState) => void;
  private onDealCards: (playerId: string, cards: WhiteCard[], replaceAll?: boolean) => void;

  constructor(
    roomCode: string,
    hostPlayer: { id: string; name: string; avatarColor: string },
    initialPacks: CardPack[],
    onStateChange: (state: PublicGameState) => void,
    onDealCards: (playerId: string, cards: WhiteCard[], replaceAll?: boolean) => void
  ) {
    this.onStateChange = onStateChange;
    this.onDealCards = onDealCards;

    const defaultSettings: GameSettings = {
      targetScore: 5,
      handSize: 6,
      czarTimerSeconds: 0,
      allowCustomBlanks: true,
    };

    const host: Player = {
      id: hostPlayer.id,
      name: hostPlayer.name,
      score: 0,
      isHost: true,
      isCzar: false,
      connected: true,
      avatarColor: hostPlayer.avatarColor,
    };

    this.state = {
      roomCode,
      phase: 'LOBBY',
      players: { [host.id]: host },
      czarId: '',
      currentBlackCard: null,
      blackOptions: [],
      revealedSubmissionIds: [],
      revealedSubmissions: [],
      lastWinner: null,
      settings: defaultSettings,
      roundNumber: 0,
      submittedPlayerIds: [],
    };

    this.czarOrder = [host.id];
    this.loadPacks(initialPacks);
  }

  public loadPacks(packs: CardPack[]) {
    let allBlack: BlackCard[] = [];
    let allWhite: WhiteCard[] = [];

    packs.forEach((p) => {
      allBlack = allBlack.concat(p.blackCards);
      allWhite = allWhite.concat(p.whiteCards);
    });

    this.blackDeck = shuffle(allBlack);
    this.whiteDeck = shuffle(allWhite);
  }

  public updateSettings(partial: Partial<GameSettings>) {
    this.state.settings = { ...this.state.settings, ...partial };
    this.emitState();
  }

  public addPlayer(id: string, name: string, avatarColor: string) {
    const existing = this.state.players[id];
    if (existing) {
      existing.name = name;
      existing.avatarColor = avatarColor;
      existing.connected = true;
    } else {
      this.state.players[id] = {
        id,
        name,
        score: 0,
        isHost: false,
        isCzar: false,
        connected: true,
        avatarColor,
      };
      if (!this.czarOrder.includes(id)) {
        this.czarOrder.push(id);
      }
    }

    // Wenn das Spiel bereits läuft, bekommt der neue Spieler Karten für die nächste Runde
    if (this.state.phase !== 'LOBBY' && !this.playerHands[id]) {
      this.playerHands[id] = this.drawWhiteCards(this.state.settings.handSize);
      this.onDealCards(id, this.playerHands[id], true);
    }

    this.emitState();
  }

  public setPlayerConnected(id: string, connected: boolean) {
    if (this.state.players[id]) {
      this.state.players[id].connected = connected;

      // Falls Czar die Verbindung verliert während JUDGING / QUESTION
      if (!connected && this.state.czarId === id && this.state.phase !== 'LOBBY') {
        this.rotateCzar();
      }

      this.checkSubmissionsComplete();
      this.emitState();
    }
  }

  public startGame() {
    const playerList = Object.values(this.state.players).filter((p) => p.connected);
    if (playerList.length < 2) {
      throw new Error('Mindestens 2 Spieler werden benötigt!');
    }

    // Scores zurücksetzen
    Object.values(this.state.players).forEach((p) => {
      p.score = 0;
      p.isCzar = false;
    });

    this.czarOrder = shuffle(playerList.map((p) => p.id));
    this.czarIndex = -1;
    this.state.roundNumber = 0;
    this.state.lastWinner = null;

    // Allen Spielern initiale Handkarten austeilen
    this.playerHands = {};
    playerList.forEach((p) => {
      const hand = this.drawWhiteCards(this.state.settings.handSize);
      this.playerHands[p.id] = hand;
      this.onDealCards(p.id, hand, true);
    });

    this.startNextRound();
  }

  public startNextRound() {
    this.rotateCzar();
    this.state.roundNumber++;

    // Vorherige Einreichungen ablegen
    Object.values(this.currentSubmissions).forEach((cards) => {
      this.discardedWhite.push(...cards);
    });
    this.currentSubmissions = {};
    this.submissionToPlayerMap = {};
    this.state.revealedSubmissions = [];
    this.state.revealedSubmissionIds = [];
    this.state.submittedPlayerIds = [];

    // Handkarten werden nicht automatisch aufgefüllt – Spieler ziehen selbst nach.
    Object.keys(this.state.players).forEach((pId) => {
      if (!this.playerHands[pId]) {
        this.playerHands[pId] = [];
      }
    });

    // Unbenutzte Optionen der Vorrunde zurück unters Deck
    this.blackDeck.unshift(...this.state.blackOptions);
    const options: BlackCard[] = [];
    for (let i = 0; i < QUESTION_OPTIONS; i++) {
      if (this.blackDeck.length === 0) {
        this.blackDeck = shuffle(this.discardedBlack);
        this.discardedBlack = [];
      }
      const card = this.blackDeck.pop();
      if (card) options.push(card);
    }

    this.state.blackOptions = options;
    this.state.currentBlackCard = null;
    this.state.phase = 'CZAR_SELECT';
    this.emitState();
  }

  public handleChooseQuestion(playerId: string, cardId: string) {
    if (this.state.phase !== 'CZAR_SELECT') return;
    if (playerId !== this.state.czarId) return;
    const chosen = this.state.blackOptions.find((c) => c.id === cardId);
    if (!chosen) return;

    this.blackDeck.unshift(...this.state.blackOptions.filter((c) => c.id !== cardId));
    this.state.blackOptions = [];
    this.state.currentBlackCard = chosen;
    this.state.phase = 'QUESTION';
    this.checkSubmissionsComplete();
    this.emitState();
  }

  public handleDrawCard(playerId: string) {
    if (this.state.phase === 'LOBBY' || !this.state.players[playerId]) return;
    const hand = (this.playerHands[playerId] ||= []);
    if (hand.length >= MAX_HAND_SIZE) return;
    const [card] = this.drawWhiteCards(1);
    if (!card) return;
    hand.push(card);
    this.onDealCards(playerId, [card], false);
  }

  public handleReveal(playerId: string, submissionId: string) {
    if (this.state.phase !== 'JUDGING' || playerId !== this.state.czarId) return;
    if (!this.submissionToPlayerMap[submissionId]) return;
    if (this.state.revealedSubmissionIds.includes(submissionId)) return;
    this.state.revealedSubmissionIds = [...this.state.revealedSubmissionIds, submissionId];
    this.emitState();
  }

  private rotateCzar() {
    const activeIds = this.czarOrder.filter(
      (id) => this.state.players[id] && this.state.players[id].connected
    );

    if (activeIds.length === 0) return;

    this.czarIndex = (this.czarIndex + 1) % activeIds.length;
    const newCzarId = activeIds[this.czarIndex];

    this.state.czarId = newCzarId;
    Object.values(this.state.players).forEach((p) => {
      p.isCzar = p.id === newCzarId;
    });
  }

  public handlePlayerSubmission(playerId: string, cardIds: string[]) {
    if (this.state.phase !== 'QUESTION') return;
    if (playerId === this.state.czarId) return; // Czar reicht keine Antworten ein
    if (this.currentSubmissions[playerId]) return; // Bereits eingereicht

    const requiredCount = this.state.currentBlackCard?.pick || 1;
    if (cardIds.length !== requiredCount) return;

    const hand = this.playerHands[playerId] || [];
    const submittedCards: WhiteCard[] = [];

    cardIds.forEach((cId) => {
      const idx = hand.findIndex((c) => c.id === cId);
      if (idx !== -1) {
        submittedCards.push(hand[idx]);
        hand.splice(idx, 1);
      }
    });

    if (submittedCards.length !== requiredCount) return;

    this.currentSubmissions[playerId] = submittedCards;
    this.state.submittedPlayerIds.push(playerId);

    this.checkSubmissionsComplete();
    this.emitState();
  }

  private checkSubmissionsComplete() {
    if (this.state.phase !== 'QUESTION') return;

    // Alle aktiven Spieler außer dem Czar müssen abgegeben haben
    const nonCzarActivePlayers = Object.values(this.state.players).filter(
      (p) => p.connected && p.id !== this.state.czarId
    );

    const allSubmitted = nonCzarActivePlayers.every(
      (p) => !!this.currentSubmissions[p.id]
    );

    if (allSubmitted && nonCzarActivePlayers.length > 0) {
      this.transitionToJudging();
    }
  }

  // Host kann Judging auch manuell auslösen (z.B. falls ein Spieler getrödelt hat)
  public forceJudging() {
    if (this.state.phase === 'QUESTION' && Object.keys(this.currentSubmissions).length > 0) {
      this.transitionToJudging();
    }
  }

  private transitionToJudging() {
    this.state.phase = 'JUDGING';
    this.state.revealedSubmissionIds = [];

    // Einreichungen anonymisieren und zufällig anordnen
    const playerIds = shuffle(Object.keys(this.currentSubmissions));
    this.submissionToPlayerMap = {};
    this.state.revealedSubmissions = playerIds.map((pId, idx) => {
      const subId = `sub_${idx + 1}`;
      this.submissionToPlayerMap[subId] = pId;
      return {
        id: subId,
        cards: this.currentSubmissions[pId],
      };
    });

    this.emitState();
  }

  public handleCzarPick(czarId: string, submissionId: string) {
    if (this.state.phase !== 'JUDGING') return;
    if (czarId !== this.state.czarId) return; // Nur der Czar darf küren

    if (!this.state.revealedSubmissionIds.includes(submissionId)) return;
    const winnerPlayerId = this.submissionToPlayerMap[submissionId];
    if (!winnerPlayerId || !this.state.players[winnerPlayerId]) return;

    const winningCards = this.currentSubmissions[winnerPlayerId];
    const winnerPlayer = this.state.players[winnerPlayerId];

    winnerPlayer.score += 1;

    this.state.lastWinner = {
      playerId: winnerPlayerId,
      playerName: winnerPlayer.name,
      blackCard: this.state.currentBlackCard!,
      cards: winningCards,
    };

    if (this.state.currentBlackCard) {
      this.discardedBlack.push(this.state.currentBlackCard);
    }

    // Siegbedingung prüfen
    if (winnerPlayer.score >= this.state.settings.targetScore) {
      this.state.phase = 'GAME_OVER';
    } else {
      this.state.phase = 'ROUND_END';
    }

    this.emitState();
  }

  public returnToLobby() {
    this.state.phase = 'LOBBY';
    this.state.currentBlackCard = null;
    this.state.blackOptions = [];
    this.state.revealedSubmissionIds = [];
    this.state.revealedSubmissions = [];
    this.state.lastWinner = null;
    this.state.submittedPlayerIds = [];
    this.emitState();
  }

  private drawWhiteCards(count: number): WhiteCard[] {
    const drawn: WhiteCard[] = [];
    for (let i = 0; i < count; i++) {
      if (this.whiteDeck.length === 0) {
        this.whiteDeck = shuffle(this.discardedWhite);
        this.discardedWhite = [];
      }
      if (this.whiteDeck.length > 0) {
        drawn.push(this.whiteDeck.pop()!);
      }
    }
    return drawn;
  }

  private emitState() {
    this.onStateChange({ ...this.state });
  }

  public getPlayerHand(playerId: string): WhiteCard[] {
    return this.playerHands[playerId] || [];
  }
}
