import { getYesterdaysEnergyTotals, getFullAuthTokenDict } from "@/app/actions";
import { sensors } from "@/app/data/sensors"
import { db } from "@/lib/db";

export const runtime = "nodejs"; // IMPORTANT: SQLite won't run on Edge

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(req: Request) {
    
    const res:{ time: string, Today: number | null, Yesterday: number }[]  =  Array.from({ length: 24 }, () => ({time: "", Today: null, Yesterday: 0,}));

    const currDate = new Date()

    const tdDate = currDate.toISOString().substring(0, 10) 

    currDate.setDate(currDate.getDate() - 1)

    console.log("CURR DATE: ", currDate)
    
    const yestDay = currDate.toISOString().substring(0, 10)

    const rows = db.prepare(`SELECT * FROM data WHERE time > '${yestDay}'`).all()

    const numToTimeConverter = (num: number) => {
        let num12hr = num
        let AmPm = "AM"

        if (num12hr === 0) {
            num12hr = 12
        }

        if (num12hr > 12) {
            num12hr = num12hr - 12
            AmPm = "PM"
        }

        return "" + num12hr + AmPm
    }


    for (let i = 0; i < rows.length; i++) {
        
        // Gets them in order
        if (i < 24) {
            res[i].Yesterday = rows[i].energyUsed

            res[i].time = numToTimeConverter(i)
        } else {
            let curr = i - 24
           
            res[curr].Today = rows[i].energyUsed
            res[curr].time = numToTimeConverter(curr)
        }
    }


    console.log("RES: ", res)
    

    return new Response(JSON.stringify(res), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }, // or application/json || text/html
    });
}