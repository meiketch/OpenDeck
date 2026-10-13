# 🃏 OpenDeck — Open-Source-Kartenspiel (0 € Serverkosten)

**OpenDeck** ist ein quelloffenes, kostenloses Multiplayer-Kartenspiel mit Frage- und Antwortkarten, das speziell dafür entwickelt wurde, **gemeinsam mit Freunden eigene Karten anzulegen** und **vollkommen kostenlos (0,00 € Serverkosten)** betrieben zu werden.

---

## ✨ Features

- 💸 **0 € Serverkosten dauerhaft**: Läuft komplett als statische Web-App. Die Multiplayer-Synchronisation erfolgt per **Peer-to-Peer WebRTC DataChannels** (über `@trystero-p2p/mqtt` mit kostenlosen öffentlichen MQTT-Brokern für das Signaling).
- 📊 **Eigene Kartendecks importieren**: Lade Karten als CSV-Datei direkt von deinem Gerät.
- 📱 **Mobile-First & Touch-optimiert**: Perfekt auf Smartphones spielbar (Karten tippen, wischen, responsive Ansicht).
- 🎲 **Eingebautes Starterdeck**: 30 deutsche schwarze Fragen und 50 pointierte weiße Antworten sofort spielbereit.
- 👑 **Vollständige Spielmechanik**:
  - Raum-Codes & QR-Codes zum sekundenschnellen Beitreten am Handy
  - Rundenzyklus mit rotierendem "Czar" (Karten-Richter)
  - Anonymisierte Antworten, Vorlesen & Sieger-Kürung
  - Punktestand, anpassbares Punkteziel und Konfetti-Siegesfeiern (`canvas-confetti`)

---

## 📝 Eigene Karten importieren

Erstelle deine Karten in einer Tabellenkalkulation und exportiere sie als CSV:

1. Lege zwei Spalten an:
   - **Spalte A:** Schwarze Karten / Fragen. Verwende drei oder mehr Unterstriche (`___`) als Lücken, in die Antworten eingesetzt werden. Wenn eine Frage 2 Lücken enthält (z.B. *„Wenn alles schiefgeht, hilft nur noch ___ und ___.“*), verlangt das Spiel automatisch 2 weiße Karten von den Spielern!
   - **Spalte B:** Weiße Karten / Antworten (Pointen, Insider-Gags, absurde Begriffe).
2. Exportiere oder speichere die Tabelle als **CSV-Datei**.
3. Klicke in OpenDeck auf **Eigenes Kartendeck per CSV importieren** oder in der Lobby auf **CSV importieren**.
4. Vergib einen Namen, wähle die CSV-Datei von deinem Gerät aus und prüfe die Vorschau.
5. Klicke auf **Deck speichern & aktivieren**.

---

## 🚀 0-Euro-Hosting (Bereitstellung)

Da OpenDeck keine eigene Backend-Infrastruktur oder Datenbank benötigt, kann das Spiel auf jedem kostenlosen Static-Hosting-Dienst bereitgestellt werden:

### Option 1: Vercel (Empfohlen - 1 Minute)
1. Installiere das Vercel CLI oder verbinde dein GitHub Repository auf [vercel.com](https://vercel.com):
   ```bash
   npm i -g vercel
   vercel
   ```
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Fertig! Deine eigene URL (z.B. `https://opendeck.vercel.app`) ist online.

### Option 2: Cloudflare Pages (Extrem schnell & unbegrenzter Traffic)
1. Gehe zu [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create application** → **Pages**.
2. GitHub Repository verknüpfen.
3. Build-Einstellungen:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Kosten: **0,00 € dauerhaft**.

### Option 3: GitHub Pages
1. Push den Code auf GitHub.
2. In den Repository-Einstellungen unter **Pages** die Quelle auf *GitHub Actions* setzen.

---

## 💻 Lokale Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Lokalen Entwicklungsserver starten
npm run dev

# Produktions-Build testen
npm run build
npm run preview
```
