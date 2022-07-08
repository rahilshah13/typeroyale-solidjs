import { createSignal, createEffect, Show, Switch, onCleanup } from "solid-js";
import { Cursor } from "./Cursor";
export default function Attempt({passage, typed, setAttempt}) {

    const [countdown, setCountdown] = createSignal(5);
    const [time, setTime] = createSignal(0);

    const mins = () => Math.floor(time() / 60);
    const secs = () => time() % 60;
    var timer =  null;

    createEffect(() => {
        if (countdown() > 0)
            setTimeout(() => setCountdown(countdown() -1), 1000);
        else
            timer = setInterval(() => setTime(t => t + 1), 1000);
    });

    createEffect(() => { 
        if(typed() === passage()) {
            clearInterval(timer);
            setAttempt({complete: true, result: time()/60, words: passage().split(" ").length});
        }
    });

    return (
        <div class="text-xl">
            <Show when={countdown() !== 0}>
                <p>countdown: {countdown()}</p>
            </Show>

            <Show when={countdown() === 0}>
                <p>{`${mins()}m ${secs()}s`}</p>
                <div>
                {   
                    passage().split("").map((c, i) => {
                        if (typed()[i] === c) {
                            return (
                                <span>
                                    <span class="text-green-600">{c}</span>
                                    <Show when={i === typed().length-1}><Cursor color={"purple"}/></Show>
                                </span>
                            );
                        }

                        else if (typed()[i]) {
                            return (
                                <span>
                                    <span class="text-red-600">{c}</span>
                                    <Show when={i === typed().length-1}><Cursor color={"purple"}/></Show>
                                </span>
                            );
                        }
    
                        else {
                            return (
                                <span>
                                    <Show when={typed().length === 0 && i==0}><Cursor color={"purple"}/></Show>
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
};