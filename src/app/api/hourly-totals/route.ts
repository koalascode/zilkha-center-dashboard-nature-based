import { getYesterdaysEnergyTotals, getFullAuthTokenDict } from "@/app/actions";
import { sensors } from "@/app/data/sensors"


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(req: Request) {
    
    const tokens = await getFullAuthTokenDict();
    let totals: {time: string, power: number}[] = []
    console.log("SENSORS: ")
    // Go through all sensor URLs
    for (let i = 0; i < sensors.length; i++) {
        if (sensors[i].number.toString().slice(0,2) === "20") { 
            continue;
        }
        const temp = await getYesterdaysEnergyTotals(sensors[i].number.toString(), tokens.get(sensors[i].number));
        
        // If totals has not been initialized, initialize it
        if (totals.length === 0) {
            totals = temp.map((val) => { return {time: val.time, power: val.power}})

        } else { // Otherwise add to its current power values
            totals = totals.map((val, i) => { return {time: val.time, power: val.power + temp[i].power}})
        }
    }

    // Split the totals array into yesterday and today
    const yesterday = totals.slice(0, 24);
    const today = totals.slice(24);
    const res: {time: string, Today: number | null, Yesterday: number}[] = []

    // Combine their values
    for (let i = 0; i < yesterday.length; i++) {
        if (i < today.length) {
            res.push({time: yesterday[i].time, Today: today[i].power, Yesterday: yesterday[i].power})
        } else {
            res.push({time: yesterday[i].time, Today: null, Yesterday: yesterday[i].power})
        }
    }

    return new Response(JSON.stringify(res), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }, // or application/json || text/html
    });
}