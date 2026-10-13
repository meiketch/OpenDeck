import { joinRoom, selfId, MessageAction } from '@trystero-p2p/mqtt';
import { PublicGameState, WhiteCard, NetworkMessage } from '../types/game.ts';

export interface NetworkCallbacks {
  onPeerJoin: (peerId: string) => void;
  onPeerLeave: (peerId: string) => void;
  onStateSync: (state: PublicGameState) => void;
  onDealCards: (cards: WhiteCard[], replaceAll?: boolean) => void;
  onMessageReceived: (message: NetworkMessage, senderId: string) => void;
}

type RoomType = ReturnType<typeof joinRoom>;

export class GameNetwork {
  private room: RoomType | null = null;
  public myId: string = selfId;
  public isHost: boolean = false;

  private stateAction: MessageAction<string> | null = null;
  private dealAction: MessageAction<string> | null = null;
  private msgAction: MessageAction<string> | null = null;

  init(roomCode: string, isHost: boolean, callbacks: NetworkCallbacks) {
    this.isHost = isHost;
    const cleanRoomCode = roomCode.trim().toUpperCase();

    // Raum beitreten mit standardisiertem AppId Prefix
    const room = joinRoom(
      { appId: 'opendeck-cards-free-v1' },
      cleanRoomCode
    );
    this.room = room;

    // Aktionen definieren
    const stateAct = room.makeAction<string>('state');
    const dealAct = room.makeAction<string>('deal');
    const msgAct = room.makeAction<string>('msg');

    this.stateAction = stateAct;
    this.dealAction = dealAct;
    this.msgAction = msgAct;

    // Peer Handlers
    room.onPeerJoin = (peerId: string) => {
      callbacks.onPeerJoin(peerId);
    };

    room.onPeerLeave = (peerId: string) => {
      callbacks.onPeerLeave(peerId);
    };

    // State Sync Receiver
    stateAct.onMessage = (rawJson: string) => {
      try {
        if (!this.isHost) {
          const state: PublicGameState = JSON.parse(rawJson);
          callbacks.onStateSync(state);
        }
      } catch (e) {
        console.error('Fehler beim Parsen von StateSync:', e);
      }
    };

    // Deal Cards Receiver
    dealAct.onMessage = (rawJson: string) => {
      try {
        const payload: { cards: WhiteCard[]; replaceAll?: boolean } = JSON.parse(rawJson);
        callbacks.onDealCards(payload.cards, payload.replaceAll);
      } catch (e) {
        console.error('Fehler beim Parsen von DealCards:', e);
      }
    };

    // Network Message Receiver
    msgAct.onMessage = (rawJson: string, context: { peerId: string }) => {
      try {
        const message: NetworkMessage = JSON.parse(rawJson);
        callbacks.onMessageReceived(message, context.peerId);
      } catch (e) {
        console.error('Fehler beim Parsen von NetworkMessage:', e);
      }
    };
  }

  // Host sendet Game State an alle oder gezielt an einen neu beigetretenen Peer
  broadcastState(state: PublicGameState, targetPeerId?: string) {
    if (this.stateAction) {
      const json = JSON.stringify(state);
      this.stateAction.send(json, targetPeerId ? { target: targetPeerId } : undefined);
    }
  }

  // Host teilt einem bestimmten Spieler private Handkarten zu
  dealCardsToPlayer(playerId: string, cards: WhiteCard[], replaceAll?: boolean) {
    if (this.dealAction) {
      const json = JSON.stringify({ cards, replaceAll });
      this.dealAction.send(json, { target: playerId });
    }
  }

  // Beliebige Netzwerknachricht senden (z.B. Spieler reicht Antwort ein oder Czar wählt Sieger)
  sendMessage(message: NetworkMessage, targetPeerId?: string) {
    if (this.msgAction) {
      const json = JSON.stringify(message);
      this.msgAction.send(json, targetPeerId ? { target: targetPeerId } : undefined);
    }
  }

  leave() {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
  }
}
