export default function RaceTrack({passage, positions}) {
    positions.sort((a,b) => a.pos - b.pos);

    return(
        {
            positions.map(p => {
                
                return (<p></p>);
            })
        }
    );
};