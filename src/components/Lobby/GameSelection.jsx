import { Show, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { BiRightArrow } from "solid-icons/bi";

const [game, setGame] = createStore({ vis: "public", mode: "" });
const changeVis = (b) => setGame({ vis: b });
const changeMode = (b) => {
  if (game.mode === b) setGame({ mode: "" });
  else setGame({ mode: b });
};

function GameButton({ label, btype }) {
  return (
    <button
      onClick={() => {
        if (btype === "vis") changeVis(label);
        else if (btype === "mode") changeMode(label);
      }}
      class={game[btype] === label ? "bg-violet-300" : ""}
    >
      {label}
    </button>
  );
}

export default function GameSelection() {
  return (
    <div>
      <span class='flex gap-1'>
        <GameButton label={"practice"} btype={"vis"} />
        <GameButton label={"public"} btype={"vis"} />
        <GameButton label={"private"} btype={"vis"} />
      </span>

      <Show when={game.vis !== "practice"} fallback={<button>start</button>}>
        <span class='flex gap-1'>
          <GameButton label={"solo"} btype={"mode"} />
          <GameButton label={"duo"} btype={"mode"} />
          <GameButton label={"quads"} btype={"mode"} />
          <Show when={game.vis !== "private"}>
            <GameButton label={"any"} btype={"mode"} />
          </Show>
        </span>

        <Show when={game.vis === "public"}>
          <p>find game</p>
        </Show>

        <Show when={game.vis === "private"}>
          <Show when={!game.mode} fallback={<button>make game</button>}>
            <span class='flex'>
              <input type='text' placeholder='join code'></input>
              <BiRightArrow size={24} />
            </span>
          </Show>
        </Show>
      </Show>
    </div>
  );
}
