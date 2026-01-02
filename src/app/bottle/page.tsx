import Bottle from "./bottle"

export default function BottlePage() {
    return (
        <div>
            <h1>HI I AM A BOTTLE</h1>
            <Bottle energyUsed={50} maxEnergyUsage={100}/>
        </div>
    )
}