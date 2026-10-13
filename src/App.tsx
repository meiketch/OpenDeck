import { useState, useEffect, useRef } from 'react';
import { HomeView } from './components/HomeView.tsx';
import { LobbyView } from './components/LobbyView.tsx';
import { GameView } from './components/GameView.tsx';
import { PublicGameState, WhiteCard, CardPack, NetworkMessage } from './types/game.ts';
import { GameNetwork } from './services/network.ts';
import { HostGameEngine } from './services/gameEngine.ts';
import { deleteCustomPack, getSavedPacks, saveCustomPack } from './services/sheetsParser.ts';

export function App() {
  const [view, setView] = useState<'HOME' | 'GAME'>('HOME');
  const [gameState, setGameState] = useState<PublicGameState | null>(null);
  const [myHand, setMyHand] = useState<WhiteCard[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [availablePacks, setAvailablePacks] = useState<CardPack[]>(() => getSavedPacks());
  const [selectedPackIds, setSelectedPackIds] = useState<string[]>(() => {
    const packs = getSavedPacks();
    return packs.map((p) => p.id);
  });

  const networkRef = useRef<GameNetwork | null>(null);
  const engineRef = useRef<HostGameEngine | null>(null);
  const myPlayerInfoRef = useRef<{ name: string; avatarColor: string } | null>(null);

  // URL Query Params für direkten Raum-Beitritt
  const [urlRoomCode, setUrlRoomCode] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setUrlRoomCode(room.toUpperCase());
    }
  }, []);

  const handlePackAdded = (newPack: CardPack) => {
    saveCustomPack(newPack);
    const updated = getSavedPacks();
    setAvailablePacks(updated);
    setSelectedPackIds((prev) => [...prev, newPack.id]);

    if (engineRef.current && isHost) {
      const activePacks = updated.filter((p) => [...selectedPackIds, newPack.id].includes(p.id));
      engineRef.current.loadPacks(activePacks);
    }
  };

  const handleDeletePack = (packId: string) => {
    if (!isHost || packId === 'pack_default') return;

    deleteCustomPack(packId);
    const updated = getSavedPacks();
    let newSelected = selectedPackIds.filter((id) => id !== packId);
    if (newSelected.length === 0) {
      newSelected = ['pack_default'];
    }

    setAvailablePacks(updated);
    setSelectedPackIds(newSelected);

    if (engineRef.current) {
      engineRef.current.loadPacks(updated.filter((p) => newSelected.includes(p.id)));
    }
  };

  const handleTogglePack = (packId: string) => {
    if (!isHost) return;
    let newSelected: string[];
    if (selectedPackIds.includes(packId)) {
      if (selectedPackIds.length <= 1) return; // Mindestens ein Pack muss aktiv sein
      newSelected = selectedPackIds.filter((id) => id !== packId);
    } else {
      newSelected = [...selectedPackIds, packId];
    }
    setSelectedPackIds(newSelected);

    if (engineRef.current) {
      const activePacks = availablePacks.filter((p) => newSelected.includes(p.id));
      engineRef.current.loadPacks(activePacks);
    }
  };

  const handleCreateRoom = (playerName: string, avatarColor: string) => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const roomCode = Array.from(
      { length: 4 },
      () => alphabet[Math.floor(Math.random() * alphabet.length)]
    ).join('');
    const network = new GameNetwork();
    networkRef.current = network;
    setIsHost(true);

    myPlayerInfoRef.current = { name: playerName, avatarColor };

    const activePacks = availablePacks.filter((p) => selectedPackIds.includes(p.id));

    const engine = new HostGameEngine(
      roomCode,
      { id: network.myId, name: playerName, avatarColor },
      activePacks,
      (newState) => {
        setGameState(newState);
        network.broadcastState(newState);
      },
      (targetId, cards, replaceAll) => {
        if (targetId === network.myId) {
          setMyHand((prev) => (replaceAll ? cards : [...prev, ...cards]));
        } else {
          network.dealCardsToPlayer(targetId, cards, replaceAll);
        }
      }
    );

    engineRef.current = engine;
    setGameState(engine.state);

    network.init(roomCode, true, {
      onPeerJoin: (peerId) => {
        // Send state to peer so they have room info
        network.broadcastState(engine.state, peerId);
      },
      onPeerLeave: (peerId) => {
        engine.setPlayerConnected(peerId, false);
      },
      onStateSync: () => {},
      onDealCards: () => {},
      onMessageReceived: (msg, senderId) => {
        handleHostIncomingMessage(msg, senderId, engine);
      },
    });

    setView('GAME');
  };

  const handleJoinRoom = (roomCode: string, playerName: string, avatarColor: string) => {
    const network = new GameNetwork();
    networkRef.current = network;
    setIsHost(false);
    myPlayerInfoRef.current = { name: playerName, avatarColor };

    network.init(roomCode, false, {
      onPeerJoin: () => {
        // Spieler meldet sich beim Host an
        network.sendMessage({
          type: 'JOIN_REQUEST',
          name: playerName,
          avatarColor,
        });
      },
      onPeerLeave: () => {},
      onStateSync: (syncedState) => {
        setGameState(syncedState);
      },
      onDealCards: (cards, replaceAll) => {
        setMyHand((prev) => (replaceAll ? cards : [...prev, ...cards]));
      },
      onMessageReceived: () => {},
    });

    // Sofortige Beitrittsanfrage senden
    setTimeout(() => {
      network.sendMessage({
        type: 'JOIN_REQUEST',
        name: playerName,
        avatarColor,
      });
    }, 500);

    setView('GAME');
  };

  const handleHostIncomingMessage = (
    msg: NetworkMessage,
    senderId: string,
    engine: HostGameEngine
  ) => {
    switch (msg.type) {
      case 'JOIN_REQUEST':
        engine.addPlayer(senderId, msg.name, msg.avatarColor);
        break;
      case 'SUBMIT_CARDS':
        engine.handlePlayerSubmission(senderId, msg.cardIds);
        break;
      case 'CZAR_PICK':
        engine.handleCzarPick(senderId, msg.submissionId);
        break;
      case 'CHOOSE_QUESTION':
        engine.handleChooseQuestion(senderId, msg.cardId);
        break;
      case 'REVEAL_SUBMISSION':
        engine.handleReveal(senderId, msg.submissionId);
        break;
      case 'DRAW_CARD':
        engine.handleDrawCard(senderId);
        break;
      case 'NEXT_ROUND':
        if (senderId === engine.state.czarId) {
          engine.startNextRound();
        }
        break;
    }
  };

  const handleStartGame = () => {
    if (engineRef.current && isHost) {
      try {
        engineRef.current.startGame();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Konnte Spiel nicht starten.');
      }
    }
  };

  const handleUpdateSettings = (settings: { targetScore?: number; handSize?: number }) => {
    if (engineRef.current && isHost) {
      engineRef.current.updateSettings(settings);
    }
  };

  const handleSubmitCards = (cardIds: string[]) => {
    // Lokale Hand updaten
    setMyHand((prev) => prev.filter((c) => !cardIds.includes(c.id)));

    if (isHost && engineRef.current) {
      engineRef.current.handlePlayerSubmission(networkRef.current!.myId, cardIds);
    } else if (networkRef.current) {
      networkRef.current.sendMessage({ type: 'SUBMIT_CARDS', cardIds });
    }
  };

  const handleChooseQuestion = (cardId: string) => {
    if (isHost && engineRef.current) {
      engineRef.current.handleChooseQuestion(networkRef.current!.myId, cardId);
    } else if (networkRef.current) {
      networkRef.current.sendMessage({ type: 'CHOOSE_QUESTION', cardId });
    }
  };

  const handleReveal = (submissionId: string) => {
    if (isHost && engineRef.current) {
      engineRef.current.handleReveal(networkRef.current!.myId, submissionId);
    } else if (networkRef.current) {
      networkRef.current.sendMessage({ type: 'REVEAL_SUBMISSION', submissionId });
    }
  };

  const handleDrawCard = () => {
    if (isHost && engineRef.current) {
      engineRef.current.handleDrawCard(networkRef.current!.myId);
    } else if (networkRef.current) {
      networkRef.current.sendMessage({ type: 'DRAW_CARD' });
    }
  };

  const handleCzarPick = (submissionId: string) => {
    if (isHost && engineRef.current) {
      engineRef.current.handleCzarPick(networkRef.current!.myId, submissionId);
    } else if (networkRef.current) {
      networkRef.current.sendMessage({ type: 'CZAR_PICK', submissionId });
    }
  };

  const handleNextRound = () => {
    if (isHost && engineRef.current) {
      engineRef.current.startNextRound();
    } else if (networkRef.current) {
      networkRef.current.sendMessage({ type: 'NEXT_ROUND' });
    }
  };

  const handleReturnToLobby = () => {
    if (isHost && engineRef.current) {
      engineRef.current.returnToLobby();
    }
  };

  const handleForceJudging = () => {
    if (isHost && engineRef.current) {
      engineRef.current.forceJudging();
    }
  };

  const handleLeaveRoom = () => {
    if (networkRef.current) {
      networkRef.current.leave();
      networkRef.current = null;
    }
    engineRef.current = null;
    setGameState(null);
    setMyHand([]);
    setIsHost(false);
    setView('HOME');

    // URL bereinigen
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  if (view === 'HOME') {
    return (
      <HomeView
        initialRoomCode={urlRoomCode}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onPackAdded={handlePackAdded}
      />
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-zinc-300">Verbinde mit P2P-Raum...</p>
        </div>
      </div>
    );
  }

  const myId = networkRef.current ? networkRef.current.myId : '';

  if (gameState.phase === 'LOBBY') {
    return (
      <LobbyView
        gameState={gameState}
        myId={myId}
        isHost={isHost}
        availablePacks={availablePacks}
        selectedPackIds={selectedPackIds}
        onTogglePack={handleTogglePack}
        onPackAdded={handlePackAdded}
        onDeletePack={handleDeletePack}
        onUpdateSettings={handleUpdateSettings}
        onStartGame={handleStartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  return (
    <GameView
      gameState={gameState}
      myId={myId}
      isHost={isHost}
      hand={myHand}
      onSubmitCards={handleSubmitCards}
      onCzarPick={handleCzarPick}
      onNextRound={handleNextRound}
      onReturnToLobby={handleReturnToLobby}
      onForceJudging={handleForceJudging}
      onChooseQuestion={handleChooseQuestion}
      onReveal={handleReveal}
      onDrawCard={handleDrawCard}
    />
  );
}

export default App;
