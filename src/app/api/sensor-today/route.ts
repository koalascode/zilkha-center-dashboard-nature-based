import { getAuthToken, getDeviceData } from "@/app/actions";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    // If the ID is empty, return an error
    // Otherwise we assume the ID is correct
    const id = searchParams.get('id');
    if (id === null) {
        return new Response('Provide URL ID', { status: 400 });
    }

    const JWT = await getAuthToken(id);
    const data = await getDeviceData(id, JWT);

    console.log("data returned: ", data)

    // We need to map device names to their values to make the chart visualization easier
    const dictionary = data.ranges.map(function(row) {
        // We map names to values, then add a time to each object
        const r = row.power.reduce(function(result: { [x: string]: any; }, field: any, index: string | number) {
                result[data.names[index]] = field;
                return result;
            }, {});
            r['time'] = row.time;
            return r;
    });

    const result = { names: data.names, data: dictionary };

    return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }, // application/json || text/html
    });
}