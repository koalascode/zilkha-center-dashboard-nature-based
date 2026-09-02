import { getDb } from "@/lib/db";
import { USE_FAKE_DATA, fakeHourlyRows } from "@/lib/fakeData";

export const runtime = "nodejs"; // IMPORTANT: SQLite won't run on Edge

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(req: Request) {
    
    const res:{ time: string, Today: number | null, Yesterday: number }[]  =  Array.from({ length: 24 }, () => ({time: "", Today: null, Yesterday: 0,}));

    const currDate = new Date();

    currDate.setHours(currDate.getHours() - 5);

    //const tdDate = currDate.toISOString().substring(0, 10) 


    currDate.setDate(currDate.getDate() - 1)
    
    const yestDay = currDate.toISOString().substring(0, 10)

    // Fake rows are shaped exactly like the SQLite ones, so everything below
    // this line runs unchanged either way. Set USE_FAKE_DATA=false to go live.
    const rows: any = USE_FAKE_DATA
        ? fakeHourlyRows(new Date())
        : getDb().prepare(`SELECT * FROM data WHERE time > '${yestDay}'`).all()

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
            res[i].Yesterday = Math.trunc(rows[i].energyUsed)

            res[i].time = numToTimeConverter(i)
        } else {
            const curr = i - 24
           
            res[curr].Today = Math.trunc(rows[i].energyUsed)
            res[curr].time = numToTimeConverter(curr)
        }
    }
    

    return new Response(JSON.stringify(res), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }, // or application/json || text/html
    });
}
