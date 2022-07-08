import { createSignal } from "solid-js";
import GamerTag from "./Lobby/GamerTag";
import Stats from "./Lobby/Stats";
import GamePanel from "./Lobby/GamePanel";
import Racer from './Racer/Racer';

const [passage, setPassage] = createSignal("The quick brown fox jumps over the lazy dog");

export default function Home() {
  // run effect to get user data: username, stats, ...
  return (
    <div class="grid grid-cols-5 gap-4 m-5">
      
      <div class="col-span-1 grid grid-rows-2 border border-blue-500">
        <GamerTag />
        <Stats />
      </div>

      <Racer passage={passage}/>

      <div class="col-span-1 border border-blue-500">
        <GamePanel />
      </div>
    </div>
  );
}