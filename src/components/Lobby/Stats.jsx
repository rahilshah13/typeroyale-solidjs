const stats = [
    { name: "Solo W/L", value: "69-69"}, 
    { name: "Duo W/L", value: "69-69"},
    { name: "Quad W/L", value: "69-69"},
    { name: "Total tests taken", value: "69"},
    { name: "Time Typed", value: "69"},
    { name: "WPM Max/Avg (all time)/Avg (last 10)", value: "100/69/69"},
    { name: "Accuracy Max / Avg (all time)/ Avg (last 10)", value: "1.00/.69/.69"},
];

export default function MyStats() {

    return(
        <div class="border border-purple-500">
            <h1>My Stats</h1>
            {
                stats.map(stat => {
                    return(
                        <span>
                            <p>{`${stat.name}: ${stat.value}`}</p>
                        </span>
                    )
                })
            }
        </div>
    );
}    