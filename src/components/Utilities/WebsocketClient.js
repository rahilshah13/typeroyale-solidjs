import { createContext } from "solid-js";
export const ws = new WebSocket("ws://localhost:8080/ws");

export const PartyContext = createContext("ligma");

ws.onopen = () => {
    var msg = {
        type: "message",
        text: "yeeee hawwwwwwww",
        id:   "n/a",
        date: Date.now()
    };
    ws.send(JSON.stringify(msg));
    console.log("ws open!")
};

ws.onmessage = (event) => {
    console.log(event.data);

    var msg = JSON.parse(event.data);
    var time = new Date(msg.date);
    var timeStr = time.toLocaleTimeString();
    
    switch(msg.type) {
        case "message":
            console.log("message");
            break;
        case "turn":
            console.log("new turn");
            break;
        case "party":
            console.log("join party");

    }   
};

// GAME
export function sendChar(c) {
    var msg = {
        type: "char",
        char: c,
        uid: "n/a",
        pid: "n/a",
        gid: "n/a",    
    };

    ws.send(JSON.stringify(msg));
}

/* todo: 
figure out if there is an easy way to do https locally
and automate its usability in production
    - generate join code for party
    - generate join code for game vs randoms
*/

/* GAME LOGIC

    onJoinGame(code, partyId)):
        g = Games.get(code)
        if not g:
            return false

        if !g.isFull() and !g.isStarted():
            g.addParty(partyId)
            return true to party/game subscribers

        if game is full and not started:
            g.start()
    
    // type race logic
*/



/* API
    User:
        - getUserInfo(userId)
        - updateGamerTag(userId, newGamerTag)

    Party:
        - joinParty(partyId, userId) 
            --> returns new user's info to other members, updates elo
        
        - removeFromParty(partyId, removerId, toBeRemovedId)
        - ready(partyId, gameInfo)
        - unready(partyId)

    Game:
        - JoinGame(gameId, PartyId)
        - LeaveGame(gameId, PartyId)

    OAuth:
        - getAccessToken(userId)
        - getUserInfo(jwt)
        - verifyToken(jwt)
*/

/* DATA

    google email --> gamertag (username by default), total words typed, total typing duration 

    STATES
        User {
            - gamertag
            - party_id --> gamertag
            Stats {
                - total words typed
                - total typing duration
                - victory_royales
            }

        }

        Party {
            - party_id / leader
            - members[]
            - state: NOT_READY || READY_WAITING || IN_GAME
            - game_seeking:             
                - PUBLIC || PRIVATE
                - SINGLE || DUO || SQUAD
            
            - wpm_elo
            - game_id
        }

        
        Matchmaking_Queue {
            - {party_id, game_seeking, wpm_elo}
        }

        Game {
            - Visibility: PUBLIC || PRIVATE
            - Type: SINGLE || DUO || SQUAD
            - Join_Code: ### || Null

            - Parties[2..4] {
                - id
                - members[1..4]
                - turn
                    ~  it could be attempt based rather than time or correctness based
                - passage_state
                - finish_time
            }
            
            - Rounds {
                - start_time
                - num: 1 || 2 || 3
                - state: WAITING || IN_PROGRESS || FINISHED
                - passage
            }

            - Game_State: NOT_STARTED || GAME_STARTED
        }
            
*/