import { createSignal } from "solid-js";
import { BiEdit } from 'solid-icons/bi'

export default function GamerTag() {
  const [editing, setEditing] = createSignal(false);
  const [validating, setValidating] = createSignal(false); 
  const [gamerTag, setGamerTag] = createSignal("User_1"); // useStore (?)

  return (
    <div class="flex gap-1">
        {gamerTag}
        <BiEdit class="" size={24} onClick={() => setEditing(true)} />
    </div>
  );
}