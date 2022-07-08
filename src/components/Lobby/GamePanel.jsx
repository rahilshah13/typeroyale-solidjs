import { For } from "solid-js";
import CopyToClipboard from "./CopyToClipboard";
import GameSelection from "./GameSelection";

const members=["you", "member_2", "member_3", "member_4"];
const is_party_leader = false;
// state: joined_game, joined_party, is party_leader, is game_leader

export default function GamePanel() {

    return(
        <div class="grid grid-rows-5 mb-5">
            <div class="row-span-2 border border-yellow-500">
                <h1>Party</h1>
                <For each={members}> 
                {   
                    (m, i) => <p>{`${i()+1}: ${m}`}</p>
                }
                </For>
            </div>

            <div class="row-span-2 border border-orange-500">
                <GameSelection/>
            </div>

            <div class="row-span-1 border border-green-500">
                <CopyToClipboard type={"Party"}/>
                <CopyToClipboard type={"Game"}/>
            </div>
        </div>
    );
}