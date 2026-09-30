import { createSignal, createEffect, onMount, Show, Switch, Match, For, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import { render } from 'solid-js/web';
import './style.css';

// --- GEMMA 2B PASSAGE GENERATOR WIDGET ---
function GemmaPassageWidget() {
  const [passage, setPassage] = createSignal("Click generate to load a dynamic Gemma 2b passage...");
  const [length, setLength] = createSignal(40);
  const [loading, setLoading] = createSignal(false);

  const fetchAiPassage = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/generate-passage?length=${length()}`);
      if (res.ok) {
        const data = await res.json();
        setPassage(data.passage);
      } else {
        setPassage("Error generating passage from local AI.");
      }
    } catch (err) {
      setPassage("Connection error reaching local Nginx-JS gateway.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style="padding: 15px; border: 1px solid #3f51b5; border-radius: 6px; background: #fff; margin-bottom: 20px;">
      <h4 style="margin-top: 0; color: #3f51b5;">Gemma 2b Dynamic Passage Generator</h4>
      <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px; flex-wrap: wrap;">
        <label style="font-size: 13px;">
          Word Length: {length()}
          <input 
            type="range" 
            min="15" 
            max="120" 
            step="5" 
            value={length()} 
            onInput={(e) => setLength(Number(e.target.value))} 
            style="margin-left: 8px;"
          />
        </label>
        <button 
          onClick={fetchAiPassage} 
          disabled={loading()}
          style="padding: 6px 14px; background: #3f51b5; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;"
        >
          {loading() ? 'Generating...' : 'Generate Passage'}
        </button>
      </div>
      <div style="padding: 10px; background: #f8f9fa; border-radius: 4px; font-style: italic; font-size: 14px;">
        "{passage()}"
      </div>
    </div>
  );
}

// --- CURSOR COMPONENT ---
function Cursor(props) {
  return (
    <span class={`text-${props.color}-900 animate-ping`} style="font-weight: bold; margin-left: 2px;">|</span>
  );
}

// --- ATTEMPT & RACER COMPONENTS ---
function Attempt(props) {
  const [countdown, setCountdown] = createSignal(3);
  const [time, setTime] = createSignal(0);

  const mins = () => Math.floor(time() / 60);
  const secs = () => time() % 60;
  let timer = null;

  createEffect(() => {
    if (countdown() > 0) {
      setTimeout(() => setCountdown(countdown() - 1), 1000);
    } else {
      timer = setInterval(() => setTime(t => t + 1), 1000);
    }
  });

  createEffect(() => {
    if (props.typed() === props.passage()) {
      clearInterval(timer);
      props.setAttempt({ complete: true, result: Math.max(time() / 60, 0.01), words: props.passage().split(" ").length });
    }
  });

  onCleanup(() => {
    if (timer) clearInterval(timer);
  });

  return (
    <div class="text-xl" style="padding: 20px;">
      <Show when={countdown() !== 0}>
        <p style="font-size: 24px; color: #3f51b5; font-weight: bold;">Starting in: {countdown()}</p>
      </Show>

      <Show when={countdown() === 0}>
        <p style="margin-bottom: 15px; font-weight: bold;">Time: {mins()}m {secs()}s</p>
        <div style="line-height: 1.6; word-break: break-all;">
          {
            props.passage().split("").map((c, i) => {
              if (props.typed()[i] === c) {
                return (
                  <span>
                    <span style="color: #2e7d32;">{c}</span>
                    <Show when={i === props.typed().length - 1}><Cursor color="purple" /></Show>
                  </span>
                );
              } else if (props.typed()[i]) {
                return (
                  <span>
                    <span style="color: #c62828; background: #ffebee;">{c}</span>
                    <Show when={i === props.typed().length - 1}><Cursor color="purple" /></Show>
                  </span>
                );
              } else {
                return (
                  <span>
                    <Show when={props.typed().length === 0 && i === 0}><Cursor color="purple" /></Show>
                    <span>{c}</span>
                  </span>
                );
              }
            })
          }
        </div>
      </Show>
    </div>
  );
}

const validChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,/'\"!?@#$%^&*()_+-=<>\\|`~[]{};: ";
const validCharSet = new Set(validChars.split(""));

function Racer(props) {
  const [typed, setTyped] = createSignal("");
  const [ready, setReady] = createSignal(false);
  const [attempt, setAttempt] = createSignal({ complete: false, result: 0, words: 0 });

  onMount(() => {
    const handleKeyDown = (e) => {
      if (!ready()) return;
      if (typed().length >= props.passage().length) return;

      if (e.key === "Backspace") {
        setTyped(t => (t.length <= 1 ? "" : t.slice(0, -1)));
      } else if (validCharSet.has(e.key)) {
        setTyped(t => t + e.key);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    onCleanup(() => window.removeEventListener("keydown", handleKeyDown));
  });

  return (
    <div style="flex: 2; min-width: 280px; text-align: center; border: 1px solid #000; background: #fafafa; border-radius: 6px; padding: 20px;">
      <Show when={ready()} fallback={<button onClick={() => setReady(true)} style="padding: 10px 20px; background: #3f51b5; color: white; border: none; border-radius: 4px; cursor: pointer;">Click to Start TypeRoyale</button>}>
        <Attempt passage={props.passage} typed={typed} setAttempt={setAttempt} />
      </Show>

      <Show when={attempt().complete}>
        <div style="margin-top: 20px; padding: 15px; background: #e8f5e9; border: 1px solid #c8e6c9;">
          <h3>Race Complete!</h3>
          <p style="font-weight: bold; font-size: 22px; color: #2e7d32;">
            WPM: {Math.round(attempt().words / attempt().result)}
          </p>
        </div>
      </Show>
    </div>
  );
}

// --- TYPE ROYALE LOBBY WITH BOT GENERATOR & UP TO 8 CONCURRENT CURSORS ---
function TypeRoyaleLobby(props) {
  const [lobbyStore, setLobbyStore] = createStore({
    players: [
      { id: 'host', name: 'You (Host)', isBot: false, color: 'indigo', x: 50, y: 50 },
      { id: 'p2', name: 'Racer_X', isBot: false, color: 'blue', x: 150, y: 80 }
    ],
    botCps: 5,
    botErrorRate: 0.05,
    lobbyState: 'waiting',
    maxPlayers: 8
  });

  const handleAddBot = () => {
    if (lobbyStore.players.length >= lobbyStore.maxPlayers) return;
    const botId = `bot-${Math.random().toString(36).substr(2, 5)}`;
    const colors = ['red', 'green', 'amber', 'purple', 'teal', 'pink'];
    const newBot = {
      id: botId,
      name: `Bot_${Math.floor(Math.random() * 900 + 100)}`,
      isBot: true,
      cps: lobbyStore.botCps,
      errorRate: lobbyStore.botErrorRate,
      color: colors[Math.floor(Math.random() * colors.length)],
      x: Math.floor(Math.random() * 300),
      y: Math.floor(Math.random() * 200)
    };
    setLobbyStore('players', p => [...p, newBot]);
  };

  const handleRemovePlayer = (id) => {
    setLobbyStore('players', p => p.filter(item => item.id !== id));
  };

  return (
    <div style="flex: 2; min-width: 280px; border: 1px solid #3f51b5; background: #fff; border-radius: 6px; padding: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">
        <h3 style="margin: 0; color: #3f51b5;">Type Royale Lobby</h3>
        <span style={`padding: 4px 8px; font-size: 12px; border-radius: 12px; font-weight: bold; background: ${lobbyStore.players.length >= lobbyStore.maxPlayers ? '#ffebee; color: #c62828;' : '#e8f5e9; color: #2e7d32;'}`}>
          {lobbyStore.players.length} / {lobbyStore.maxPlayers} Players
        </span>
      </div>

      <div 
        style="position: relative; height: 160px; background: #f8f9fa; border: 1px dashed #ccc; border-radius: 4px; margin-bottom: 15px; overflow: hidden;"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          setLobbyStore('players', p => p.id === 'host', { x, y });
        }}
      >
        <div style="position: absolute; top: 6px; left: 8px; font-size: 11px; color: #888;">Multiplayer Cursor Arena</div>
        <For each={lobbyStore.players}>
          {(p) => (
            <div style={`position: absolute; left: ${p.x || 20}px; top: ${p.y || 20}px; transition: transform 0.05s linear; pointer-events: none; display: flex; align-items: center; gap: 4px;`}>
              <span style="font-size: 18px;">📍</span>
              <span style={`background: ${p.color === 'indigo' ? '#3f51b5' : '#333'}; color: white; padding: 1px 5px; font-size: 10px; border-radius: 3px; white-space: nowrap;`}>
                {p.name}
              </span>
            </div>
          )}
        </For>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; margin-bottom: 15px;">
        {Array.from({ length: lobbyStore.maxPlayers }).map((_, index) => {
          const player = lobbyStore.players[index];
          return (
            <div style={`padding: 8px; border-radius: 4px; border: 1px solid ${player ? '#c5cae9' : '#e0e0e0'}; background: ${player ? '#f3e5f5' : '#fafafa'}; display: flex; justify-content: space-between; align-items: center; font-size: 13px;`}>
              <Show when={player} fallback={<span style="color: #aaa; font-style: italic;">Slot #{index + 1} Open</span>}>
                <div>
                  <strong>{player.name}</strong>
                  <Show when={player.isBot}><div style="font-size: 10px; color: #666;">{player.cps} CPS | Err: {player.errorRate * 100}%</div></Show>
                </div>
                <Show when={!player.isBot && index !== 0}>
                  <span style="font-size: 10px; background: #3f51b5; color: white; padding: 2px 4px; border-radius: 2px;">USER</span>
                </Show>
                <Show when={player.isBot || index !== 0}>
                  <button onClick={() => handleRemovePlayer(player.id)} style="background: none; border: none; color: #d32f2f; cursor: pointer; font-weight: bold;">✕</button>
                </Show>
              </Show>
            </div>
          );
        })}
      </div>

      <Show when={lobbyStore.lobbyState === 'waiting'}>
        <div style="background: #f1f5f9; padding: 12px; border-radius: 4px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between;">
          <div style="display: flex; gap: 15px; flex-wrap: wrap; align-items: center;">
            <label style="font-size: 12px; display: flex; flex-direction: column;">
              Bot Speed (CPS: {lobbyStore.botCps}):
              <input type="range" min="1" max="15" value={lobbyStore.botCps} onInput={(e) => setLobbyStore('botCps', Number(e.target.value))} />
            </label>
            <label style="font-size: 12px; display: flex; flex-direction: column;">
              Error Rate ({Math.round(lobbyStore.botErrorRate * 100)}%):
              <input type="range" min="0" max="0.3" step="0.01" value={lobbyStore.botErrorRate} onInput={(e) => setLobbyStore('botErrorRate', Number(e.target.value))} />
            </label>
          </div>
          <div style="display: flex; gap: 8px;">
            <button 
              onClick={handleAddBot} 
              disabled={lobbyStore.players.length >= lobbyStore.maxPlayers}
              style="padding: 6px 12px; background: #334155; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;"
            >
              + Add Bot
            </button>
            <button 
              onClick={() => setLobbyStore('lobbyState', 'active')}
              style="padding: 6px 14px; background: #2e7d32; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;"
            >
              Start Match
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}

// --- LOBBY & PANEL COMPONENTS ---
function CopyToClipboard(props) {
  const [copied, setCopied] = createSignal(false);
  const getCode = () => (props.type === "Party" ? "squad-up-bababoory" : "square-up-match-99");

  return (
    <span 
      style="cursor: pointer; padding: 6px; display: inline-flex; align-items: center; gap: 5px; font-size: 14px;"
      onClick={() => {
        navigator.clipboard.writeText(getCode());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {props.type} Invite Code {copied() && <span style="color: green; font-size: 12px;">(Copied!)</span>}
    </span>
  );
}

const [gameStore, setGameStore] = createStore({ vis: "public", mode: "" });

const changeVis = (b) => setGameStore({ vis: b });
const changeMode = (b) => {
  if (gameStore.mode === b) setGameStore({ mode: "" });
  else setGameStore({ mode: b });
};

function GameButton(props) {
  return (
    <button
      onClick={() => {
        if (props.btype === "vis") changeVis(props.label);
        else if (props.btype === "mode") changeMode(props.label);
      }}
      style={`padding: 6px 12px; border: 1px solid #ccc; cursor: pointer; ${gameStore[props.btype] === props.label ? "background: #d1c4e9;" : "background: #fff;"}`}
    >
      {props.label}
    </button>
  );
}

function GameSelection() {
  return (
    <div style="padding: 10px;">
      <span style="display: flex; gap: 5px; margin-bottom: 10px; flex-wrap: wrap;">
        <GameButton label="practice" btype="vis" />
        <GameButton label="public" btype="vis" />
        <GameButton label="private" btype="vis" />
      </span>

      <Show when={gameStore.vis !== "practice"} fallback={<button style="padding: 6px 14px; background: #4caf50; color: white; border: none; cursor: pointer;">Start Practice</button>}>
        <span style="display: flex; gap: 5px; margin-bottom: 10px; flex-wrap: wrap;">
          <GameButton label="solo" btype="mode" />
          <GameButton label="duo" btype="mode" />
          <GameButton label="quads" btype="mode" />
          <Show when={gameStore.vis !== "private"}>
            <GameButton label="any" btype="mode" />
          </Show>
        </span>

        <Show when={gameStore.vis === "public"}>
          <p style="font-size: 14px; font-weight: bold; color: #555;">Finding public match...</p>
        </Show>

        <Show when={gameStore.vis === "private"}>
          <Show when={!gameStore.mode} fallback={<button style="padding: 6px 14px; background: #3f51b5; color: white; border: none; cursor: pointer;">Make Private Game</button>}>
            <span style="display: flex; gap: 5px; align-items: center; flex-wrap: wrap;">
              <input type="text" placeholder="Join Code" style="padding: 6px; border: 1px solid #ccc; flex: 1;" />
              <button style="padding: 6px 10px;">Join</button>
            </span>
          </Show>
        </Show>
      </Show>
    </div>
  );
}

function GamePanel() {
  const members = ["you", "member_2", "member_3", "member_4"];

  return (
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div style="padding: 10px; border: 1px solid #ffb300; border-radius: 4px;">
        <h4 style="margin: 0 0 8px 0;">Party Members</h4>
        <For each={members}>
          {(m, i) => <p style="margin: 4px 0; font-size: 14px;">{i() + 1}: {m}</p>}
        </For>
      </div>

      <div style="padding: 10px; border: 1px solid #ff9800; border-radius: 4px;">
        <h4 style="margin: 0 0 8px 0;">Game Selection</h4>
        <GameSelection />
      </div>

      <div style="padding: 10px; border: 1px solid #4caf50; border-radius: 4px; display: flex; flex-direction: column; gap: 4px;">
        <CopyToClipboard type="Party" />
        <CopyToClipboard type="Game" />
      </div>
    </div>
  );
}

function GamerTag() {
  return (
    <div style="padding: 10px; border-bottom: 1px solid #ddd;">
      <h4>GamerTag</h4>
      <p style="font-weight: bold; color: #3f51b5;">ProTypist_01</p>
    </div>
  );
}

function MyStats() {
  const stats = [
    { name: "Solo W/L", value: "69-69" },
    { name: "Duo W/L", value: "69-69" },
    { name: "Quad W/L", value: "69-69" },
    { name: "Total tests taken", value: "69" },
    { name: "Time Typed", value: "69m" },
    { name: "WPM Max/Avg", value: "100/69" },
    { name: "Accuracy", value: "1.00/.69" },
  ];

  return (
    <div style="padding: 10px; font-size: 13px; border: 1px solid #9c27b0;">
      <h4 style="margin: 0 0 8px 0;">My Stats</h4>
      <For each={stats}>
        {(stat) => (
          <p style="margin: 3px 0;"><strong>{stat.name}:</strong> {stat.value}</p>
        )}
      </For>
    </div>
  );
}

function Home() {
  return (
    <div class="main-grid" style="display: flex; flex-direction: column; gap: 20px; padding: 20px;">
      <GemmaPassageWidget />
      <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 240px; border: 1px solid #2196f3; border-radius: 4px;">
          <GamerTag />
          <MyStats />
        </div>
        <TypeRoyaleLobby />
        <div style="flex: 1; min-width: 240px; border: 1px solid #2196f3; border-radius: 4px;">
          <GamePanel />
        </div>
      </div>
    </div>
  );
}

// --- WHITEBOARD WITH DRAW TRACING & TEXT PLAYBACK ---
function Whiteboard(props) {
  let canvasRef;
  const [isRecording, setIsRecording] = createSignal(false);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [traces, setTraces] = createSignal([]);
  const [textNodes, setTextNodes] = createSignal([]);
  const [newText, setNewText] = createSignal('');
  const [textPos, setTextPos] = createSignal({ x: 100, y: 100 });
  const [saveStatus, setSaveStatus] = createSignal('');

  let startTime = 0;
  let currentStroke = [];

  onMount(async () => {
    try {
      const res = await fetch(`/boards/${props.boardId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.traces) setTraces(data.traces);
        if (data.textNodes) setTextNodes(data.textNodes);
        redrawAll();
      }
    } catch {}

    const canvas = canvasRef;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let drawing = false;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    const startDrawing = (e) => {
      drawing = true;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);

      if (isRecording()) {
        startTime = startTime || Date.now();
        currentStroke = [{ x, y, time: Date.now() - startTime }];
      }
    };

    const stopDrawing = () => {
      if (!drawing) return;
      drawing = false;
      if (isRecording() && currentStroke.length > 0) {
        setTraces([...traces(), { stroke: currentStroke, time: Date.now() - startTime }]);
        currentStroke = [];
      }
    };

    const draw = (e) => {
      if (!drawing) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ctx.lineTo(x, y);
      ctx.stroke();

      if (isRecording()) {
        currentStroke.push({ x, y, time: Date.now() - startTime });
      }
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    canvas.addEventListener('mousemove', draw);
  });

  const redrawAll = () => {
    const canvas = canvasRef;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    traces().forEach(t => {
      if (!t.stroke || t.stroke.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(t.stroke[0].x, t.stroke[0].y);
      for (let i = 1; i < t.stroke.length; i++) {
        ctx.lineTo(t.stroke[i].x, t.stroke[i].y);
      }
      ctx.stroke();
    });
  };

  const toggleRecord = () => {
    if (!isRecording()) {
      setIsRecording(true);
      startTime = Date.now();
      setTraces([]);
      setTextNodes([]);
      clearCanvas();
    } else {
      setIsRecording(false);
    }
  };

  const playbackTracesAndText = async () => {
    if (isPlaying()) return;
    setIsPlaying(true);
    clearCanvas();
    setTextNodes([]);

    const allTraces = traces();
    const allText = [...textNodes()];
    
    if (allTraces.length === 0 && allText.length === 0) {
      setIsPlaying(false);
      return;
    }

    const playStart = Date.now();
    let textIndex = 0;

    const interval = setInterval(() => {
      const elapsed = Date.now() - playStart;

      while (textIndex < allText.length && elapsed >= (allText[textIndex].time || textIndex * 1000)) {
        setTextNodes(prev => [...prev, allText[textIndex]]);
        textIndex++;
      }

      redrawAll();

      if (textIndex >= allText.length) {
        clearInterval(interval);
        setIsPlaying(false);
      }
    }, 100);
  };

  const clearCanvas = () => {
    const canvas = canvasRef;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTraces([]);
    setTextNodes([]);
  };

  const addTextBox = (e) => {
    e.preventDefault();
    if (!newText()) return;
    const node = { 
      id: Date.now(), 
      text: newText(), 
      x: textPos().x, 
      y: textPos().y,
      time: isRecording() ? Date.now() - startTime : 0 
    };
    setTextNodes([...textNodes(), node]);
    setNewText('');
  };

  const saveBoard = async () => {
    try {
      await fetch('/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId: props.boardId,
          traces: traces(),
          textNodes: textNodes(),
          owner: props.currentUser?.username || 'guest'
        })
      });
      setSaveStatus('Board saved successfully!');
      setTimeout(() => setSaveStatus(''), 2500);
    } catch {
      setSaveStatus('Failed to save board.');
    }
  };

  return (
    <div style="padding: 20px; overflow-x: auto;">
      <div style="background: #f4f4f4; padding: 12px; margin-bottom: 15px; border-radius: 4px; display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
        <button 
          onClick={toggleRecord} 
          style={`padding: 6px 14px; background: ${isRecording() ? '#d32f2f' : '#2196f3'}; color: white; border: none; cursor: pointer; font-weight: bold;`}
        >
          {isRecording() ? '🔴 Stop Recording' : '⏺ Record Trace'}
        </button>
        <button 
          onClick={playbackTracesAndText} 
          disabled={isPlaying()}
          style="padding: 6px 14px; background: #ff9800; color: white; border: none; cursor: pointer; font-weight: bold;"
        >
          {isPlaying() ? '▶ Playing...' : '▶ Playback Drawing & Text'}
        </button>
        <button onClick={clearCanvas} style="padding: 6px 12px; cursor: pointer;">Clear Board</button>
        <Show when={props.allowSave}>
          <button onClick={saveBoard} style="padding: 6px 12px; background: #4caf50; color: white; border: none; cursor: pointer;">Save Board</button>
        </Show>
        <Show when={saveStatus()}><span style="color: green; font-weight: bold;">{saveStatus()}</span></Show>
      </div>

      <form onSubmit={addTextBox} style="margin-bottom: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
        <input placeholder="Type text note..." value={newText()} onInput={(e) => setNewText(e.target.value)} style="padding: 6px; flex: 1; min-width: 150px;" />
        <input type="number" placeholder="X" value={textPos().x} onInput={(e) => setTextPos({ ...textPos(), x: Number(e.target.value) })} style="width: 70px; padding: 6px;" />
        <input type="number" placeholder="Y" value={textPos().y} onInput={(e) => setTextPos({ ...textPos(), y: Number(e.target.value) })} style="width: 70px; padding: 6px;" />
        <button type="submit" style="padding: 6px 12px;">Place Text Box</button>
      </form>

      <div style="position: relative; display: inline-block; max-width: 100%; overflow: auto;">
        <canvas ref={canvasRef} width="800" height="500" style="border: 1px solid #ccc; background: #fff; cursor: crosshair; display: block;" />
        <For each={textNodes()}>
          {(node) => (
            <div style={`position: absolute; left: ${node.x}px; top: ${node.y}px; background: rgba(255, 235, 59, 0.9); padding: 4px 8px; border: 1px solid #fbc02d; font-size: 14px; pointer-events: none; border-radius: 3px;`}>
              {node.text}
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

// --- AUTH (LOGIN & REGISTER) ---
function AuthScreen(props) {
  const [tab, setTab] = createSignal('login');
  const [username, setUsername] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [firstName, setFirstName] = createSignal('');
  const [lastName, setLastName] = createSignal('');
  const [error, setError] = createSignal('');
  const [success, setSuccess] = createSignal('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (tab() === 'login') {
      try {
        const res = await fetch('/user/authenticate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username(), password: password() }),
        });
        if (res.ok) {
          const user = await res.json();
          localStorage.setItem('currentUser', JSON.stringify(user));
          props.onLogin(user);
        } else {
          const data = await res.json();
          setError(data.message || 'Login failed');
        }
      } catch {
        setError('Server connection error.');
      }
    } else {
      try {
        const res = await fetch('/user/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username(), email: email(), password: password(), firstName: firstName(), lastName: lastName() }),
        });
        if (res.ok) {
          setSuccess('Registration successful! Please login.');
          setTab('login');
        } else {
          const data = await res.json();
          setError(data.message || 'Registration failed');
        }
      } catch {
        setError('Server connection error.');
      }
    }
  };

  return (
    <div style="max-width: 400px; margin: 40px auto; padding: 20px; border: 1px solid #ddd; border-radius: 6px; background: #fff;">
      <div style="display: flex; margin-bottom: 20px; border-bottom: 2px solid #eee;">
        <button 
          onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
          style={`flex: 1; padding: 10px; background: none; border: none; font-weight: bold; cursor: pointer; border-bottom: ${tab() === 'login' ? '3px solid #3f51b5' : 'none'}; color: ${tab() === 'login' ? '#3f51b5' : '#666'};`}
        >
          Login
        </button>
        <button 
          onClick={() => { setTab('register'); setError(''); setSuccess(''); }}
          style={`flex: 1; padding: 10px; background: none; border: none; font-weight: bold; cursor: pointer; border-bottom: ${tab() === 'register' ? '3px solid #3f51b5' : 'none'}; color: ${tab() === 'register' ? '#3f51b5' : '#666'};`}
        >
          Register
        </button>
      </div>

      <Show when={error()}><div style="color: red; margin-bottom: 10px; font-size: 14px;">{error()}</div></Show>
      <Show when={success()}><div style="color: green; margin-bottom: 10px; font-size: 14px;">{success()}</div></Show>

      <form onSubmit={handleSubmit} style="display: flex; flex-direction: column; gap: 12px;">
        <input style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;" placeholder="Username" value={username()} onInput={(e) => setUsername(e.target.value)} required />
        <Show when={tab() === 'register'}>
          <input style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;" type="email" placeholder="Email" value={email()} onInput={(e) => setEmail(e.target.value)} required />
          <input style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;" placeholder="First Name" value={firstName()} onInput={(e) => setFirstName(e.target.value)} required />
          <input style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;" placeholder="Last Name" value={lastName()} onInput={(e) => setLastName(e.target.value)} required />
        </Show>
        <input style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;" type="password" placeholder="Password" value={password()} onInput={(e) => setPassword(e.target.value)} required />
        <button type="submit" style="padding: 10px 15px; background: #3f51b5; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
          {tab() === 'login' ? 'Login' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}

// --- ADMIN DASHBOARD PANEL ---
function AdminDashboard() {
  const [authed, setAuthed] = createSignal(false);
  const [username, setUsername] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [error, setError] = createSignal('');
  const [blacklisted, setBlacklisted] = createSignal([]);
  const [newValue, setNewValue] = createSignal('');
  const [newReason, setNewReason] = createSignal('');
  const [newType, setNewType] = createSignal('IP Address');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username(), password: password() })
      });
      if (res.ok) {
        setAuthed(true);
        fetchBlacklist();
      } else {
        setError('Invalid admin username or password');
      }
    } catch {
      setError('Connection error');
    }
  };

  const fetchBlacklist = async () => {
    try {
      const res = await fetch('/admin/blacklist');
      if (res.ok) setBlacklisted(await res.json());
    } catch {}
  };

  const addBlacklist = async (e) => {
    e.preventDefault();
    if (newValue()) {
      try {
        const res = await fetch('/admin/blacklist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: newType(), value: newValue(), reason: newReason() })
        });
        if (res.ok) {
          const item = await res.json();
          setBlacklisted([...blacklisted(), item]);
          setNewValue('');
          setNewReason('');
        }
      } catch {}
    }
  };

  const removeBlacklist = async (id) => {
    try {
      await fetch(`/admin/blacklist/${id}`, { method: 'DELETE' });
      setBlacklisted(blacklisted().filter(item => item._id !== id));
    } catch {}
  };

  return (
    <div style="max-width: 800px; margin: 40px auto; padding: 20px;">
      <h2>Admin Control Panel</h2>
      <Show when={authed()} fallback={
        <form onSubmit={handleAdminLogin} style="background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 6px; max-width: 400px;">
          <h4>Admin Authentication Required</h4>
          <Show when={error()}><div style="color: red; margin-bottom: 10px;">{error()}</div></Show>
          <div style="margin-bottom: 10px;"><input style="width: 100%; padding: 8px;" placeholder="Admin Username" value={username()} onInput={(e) => setUsername(e.target.value)} required /></div>
          <div style="margin-bottom: 10px;"><input style="width: 100%; padding: 8px;" type="password" placeholder="Admin Password" value={password()} onInput={(e) => setPassword(e.target.value)} required /></div>
          <button type="submit" style="padding: 8px 15px; background: #3f51b5; color: white; border: none; cursor: pointer;">Access Admin Panel</button>
        </form>
      }>
        <div style="margin-top: 20px;">
          <form onSubmit={addBlacklist} style="background: #f9f9f9; padding: 15px; margin-bottom: 20px; border: 1px solid #ddd;">
            <h4>Add Entity to Blacklist</h4>
            <div style="display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
              <select value={newType()} onChange={(e) => setNewType(e.target.value)} style="padding: 6px;">
                <option value="IP Address">IP Address</option>
                <option value="Username">Username</option>
              </select>
              <input placeholder="Value" value={newValue()} onInput={(e) => setNewValue(e.target.value)} style="padding: 6px; flex: 1; min-width: 120px;" required />
              <input placeholder="Reason" value={newReason()} onInput={(e) => setNewReason(e.target.value)} style="padding: 6px; flex: 1; min-width: 120px;" required />
              <button type="submit" style="padding: 6px 12px; background: #d32f2f; color: white; border: none;">Blacklist</button>
            </div>
          </form>

          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead>
                <tr style="background: #3f51b5; color: white;">
                  <th style="padding: 10px; border: 1px solid #ddd;">Type</th>
                  <th style="padding: 10px; border: 1px solid #ddd;">Target Value</th>
                  <th style="padding: 10px; border: 1px solid #ddd;">Reason</th>
                  <th style="padding: 10px; border: 1px solid #ddd;">Action</th>
                </tr>
              </thead>
              <tbody>
                <For each={blacklisted()}>
                  {(item) => (
                    <tr>
                      <td style="padding: 10px; border: 1px solid #ddd;">{item.type}</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">{item.value}</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">{item.reason}</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">
                        <button onClick={() => removeBlacklist(item._id)} style="padding: 4px 8px; background: #f44336; color: white; border: none; cursor: pointer;">Remove</button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </div>
      </Show>
    </div>
  );
}

// --- SUBDOMAIN PUBLIC WHITEBOARD VIEW ---
function SubdomainWhiteboard(props) {
  return (
    <div style="padding: 20px;">
      <h2 style="color: #3f51b5; margin-bottom: 5px;">Public Whiteboard: {props.username}</h2>
      <p style="color: #666; margin-bottom: 20px;">Viewing shared whiteboard subspace for <strong>{props.username}</strong>.</p>
      <Whiteboard boardId={`${props.username}-board`} currentUser={{ username: props.username }} allowSave={false} />
    </div>
  );
}

// --- MAIN APP COMPONENT ---
function App() {
  const [currentUser, setCurrentUser] = createSignal(null);
  const [route, setRoute] = createSignal(window.location.pathname);
  const [subdomain, setSubdomain] = createSignal(null);

  onMount(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) setCurrentUser(user);
    window.addEventListener('popstate', () => setRoute(window.location.pathname));

    const host = window.location.hostname;
    const parts = host.split('.');
    if (parts.length > 1 && parts[parts.length - 1] === 'localhost' && parts[0] !== 'localhost') {
      setSubdomain(parts[0]);
    }
  });

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setRoute(path);
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    navigate('/');
  };

  return (
    <div>
      <nav class="toolbar">
        <div onClick={() => navigate('/')} style="cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 8px;">
          Whitebored.io & TypeRoyale
          <Show when={subdomain()}><span style="background: #ff9800; font-size: 11px; padding: 2px 6px; border-radius: 4px;">subdomain: {subdomain()}</span></Show>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <Show when={!subdomain()}>
            <a onClick={() => navigate('/')} style="cursor: pointer;">Home</a>
            <Show when={currentUser()}>
              <a onClick={() => navigate('/whiteboard')} style="cursor: pointer;">Whiteboard</a>
              <a href={`http://${currentUser().username}.localhost`} target="_blank" rel="noopener noreferrer" style="color: #ffeb3b; font-weight: bold;">My Subboard ↗</a>
            </Show>
            <a onClick={() => navigate('/admin')} style="cursor: pointer; display: inline-flex; align-items: center;" title="Open Admin Panel">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </a>
          </Show>
        </div>
        <div>
          <Show when={subdomain()}>
            <span style="font-size: 14px;">Viewing user workspace: <strong>{subdomain()}</strong></span>
          </Show>
          <Show when={!subdomain()}>
            <Show when={currentUser()} fallback={
              <a onClick={() => navigate('/auth')} style="font-weight: bold; cursor: pointer;">Login / Register</a>
            }>
              <span style="margin-right: 15px;">Hello, {currentUser().username}</span>
              <button onClick={logout} style="padding: 4px 8px; cursor: pointer;">Logout</button>
            </Show>
          </Show>
        </div>
      </nav>

      <div>
        <Show when={subdomain()} fallback={
          <Switch>
            <Match when={route() === '/'}>
              <Home />
            </Match>
            <Match when={route() === '/whiteboard'}>
              <Show when={currentUser()} fallback={<AuthScreen onLogin={(user) => { setCurrentUser(user); navigate('/whiteboard'); }} />}>
                <div>
                  <h3 style="padding-left: 20px;">Collaborative Whiteboard & Draw Tracing Playback</h3>
                  <Whiteboard boardId={currentUser()?.username ? `${currentUser().username}-board` : 'public-board'} currentUser={currentUser()} allowSave={true} />
                </div>
              </Show>
            </Match>
            <Match when={route() === '/auth'}>
              <AuthScreen onLogin={(user) => { setCurrentUser(user); navigate('/'); }} />
            </Match>
            <Match when={route() === '/admin'}>
              <AdminDashboard />
            </Match>
          </Switch>
        }>
          <SubdomainWhiteboard username={subdomain()} />
        </Show>
      </div>
    </div>
  );
}

render(() => <App />, document.getElementById('root'));