import { BiCopy } from 'solid-icons/bi'

/*
    TODO: add popup animaton and text 
    indication to show that text has been copied to the clipboard

    On the backend, add function that uniquely generates a code
*/

function getCode(type) {
    switch (type) {
        case "Party":
            return `squad up: ${"bababoory"}`;
        case "Game":
            return `square up: ${":("}`;
        default:
            return "";
    }
}

export default function CopyToClipboard({type}) {
    return(
        <span 
            class="flex gap-1 hover:bg-gray-300"
            onClick={() => {
                navigator.clipboard.writeText(getCode(type));
            }}
        >
            {type} Invite Code 
            <BiCopy size={24} />
        </span>
    );
}