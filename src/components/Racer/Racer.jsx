import { createSignal, createEffect, Show, onCleanup } from "solid-js";
import Attempt from "./Attempt";
import { sendChar } from "../utilities/WebsocketClient";

const validChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,/'\"!?@#$%^&*()_+-=<>\\|`~[]{};: ";
const validCharSet = new Set(validChars.split(""));

function Racer({passage}) {

    const [typed, setTyped] = createSignal("");
    const [ready, setReady] = createSignal(false);
    const [attempt, setAttempt] = createSignal({complete: false, result: 0, words: ""});

    //const passage = createResource(passage);

    document.onkeydown = (e) => {
        if(typed().length >= passage().length)
            return;

        if (e.key === "Backspace")
            setTyped(t => (t.length === 1 ? "" : t.slice(0, -1)));

        else if (validCharSet.has(e.key))
            setTyped(t => t + e.key);

        sendChar(e.key);
    }

    return (
        <div class="col-span-3 text-center border border-black text-xl">
            <Show when={ready()} fallback={<p onclick={() => setReady(true)}>click to start</p>}>
                <Attempt passage={passage} typed={typed} setAttempt={setAttempt}/>
            </Show>

            <Show when={attempt().complete} >
                <p>{`wpm: ${attempt().words / attempt().result}`}</p>
            </Show>
        </div>
    );
}


export default Racer;