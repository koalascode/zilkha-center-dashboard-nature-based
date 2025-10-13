import { extractRegisters, getFullAuthTokenDict } from "@/app/actions";
import { sensors } from "@/app/data/sensors"


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(req: Request) {
    // In devices works
    const tokens = await getFullAuthTokenDict();

    const registers = []

    for (let i = 0; i < sensors.length; i++) {
        // Not using sensors that are currently broken
        if (sensors[i].number.toString().slice(0,2) === "20") { 
            continue;
        }
        const temp = await extractRegisters(sensors[i].number.toString(), tokens.get(sensors[i].number));
        registers.push({
            sensor: sensors[i],
            registers: temp.map((el: any) => {
                return {name: el.name, id: el.idx, num: sensors[i].number}
            })
        });
    }

    return new Response(JSON.stringify(registers), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }, // application/json || text/html
    });
}