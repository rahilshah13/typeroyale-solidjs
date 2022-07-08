import logo from "./logo.svg";
import Racer from "./components/Racer/Racer";
import Home from "./components/Home";
import { createSignal, onCleanup, Show } from "solid-js";

function App() {
  const [loggedIn, setLoggedIn] = createSignal(true); // change later to false
  const [passage, setPassage] = createSignal("quandale dingle here");

  return (
    <div class=''>
      <header class="text-center text-5xl m-7 border border-width-1">
        <h1>TypeRoyale</h1>
      </header>
      <Show when={loggedIn()}>
        <Home />
      </Show>
      <Show when={!loggedIn()}>
        <Racer passage={passage} />
      </Show>
    </div>
  );
}

export default App;
