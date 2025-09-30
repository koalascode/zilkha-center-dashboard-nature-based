import { md5 } from "js-md5";
import { USER, PASS } from "@/app/login"
import { sensors } from "@/app/data/sensors";

// Gets the JSON Web Token (JWT) for authentication purposes,
// following eGauge Web API instructions
export async function getAuthToken(deviceNumber: string) {
    if (deviceNumber.slice(0,2) === "20") {
        return "notoken";
    }
    const URL = `https://egauge${deviceNumber}.d.egauge.net/api`
    // Get the 'unauthorized' response
    console.log('URL: ', URL)

    const unauthorized_data = await fetch(`${URL}/auth/unauthorized`);
    const unauthorized_data_json = await unauthorized_data.json();

    console.log("UNAUTH DATA: ", unauthorized_data_json)

    // Get the realm and server nonce (valid for 1 min)
    const realm = unauthorized_data_json.rlm;
    const nnc = unauthorized_data_json.nnc;

    // Generate the client nonce
    const { randomBytes } = require('crypto');
    const cnnc = randomBytes(64).toString('hex');

    // Hash login info
    const ha1_content = `${USER}:${realm}:${PASS}`;
    const ha1 = md5(ha1_content); // must be MD5 hash as per eGauge docs
    const hash_content = `${ha1}:${nnc}:${cnnc}`;
    const hash = md5(hash_content);

    // Payload for auth request
    const payload = {
        rlm: realm,
        usr: USER,
        nnc: nnc,
        cnnc: cnnc,
        hash: hash
    }

    // Try to log in
    const response = await fetch(`${URL}/auth/login`, {
    method: "POST",
    body: JSON.stringify(payload)
    }).then((response) => response.json());

    // Return response
    return response.jwt;
}

// Builds a dictionary of all JWTs and corresponding url numbers
export async function getFullAuthTokenDict() {
    let tokens = new Map();

   
    
    for (let i = 0; i < sensors.length; i++) {
        const token = await getAuthToken(sensors[i].number.toString());
        if (token !== "notoken") {
            tokens.set(sensors[i].number, token);
        }
    }


    return tokens;
}

// Extracts all registers from a particular URL
// Takes in the device number for the URL and its auth token
export async function extractRegisters(deviceNumber: string, JWT: string) {
    const URL = `https://egauge${deviceNumber}.d.egauge.net/api`

    const bearer = 'Bearer ' + JWT;

    const sensors = await fetch(`${URL}/register`, {
    method: 'GET',
    credentials: 'include',
    headers: {
        'Authorization': bearer,
    },
    }).then((r) => r.json());

    return sensors.registers;
}

export async function getDeviceData(deviceNumber: string, JWT: string) {
    const URL = `https://egauge${deviceNumber}.d.egauge.net/api`
    const bearer = 'Bearer ' + JWT;
    
    // Start time is start of day yesterday, step by 1h, end time is start of current hour
    const time = 'sod(now):1h:soh(now)'
    console.log("HERHERHEHREHRHERHEHR")
    console.log("FETCH URL: " + `${URL}/register?reg=all&time=${time}&delta=true`)

    const response = await fetch(`${URL}/register?reg=all&time=${time}&delta=true`, {
    method: 'GET',
    credentials: 'include',
    headers: {
        'Authorization': bearer,
    },
    }).then((r) => r.json());

    const names = response.registers.map((val: any) => {return val.name})
    const ranges = convertPowerRanges(response.ranges);


    return {names: names, ranges: ranges};
}

// Converts power ranges into data that can be plugged into a chart, without summing
// Takes the ranges array from a sensor response, returns array of time-power objects, where power could be an array
export function convertPowerRanges(ranges: Array<any>) : Array<any> {
  const list = [];
  var timestamp = ranges[0].ts // Get the start timestamp
  const d = new Date(timestamp * 1000);

  for (const item of ranges[0].rows.slice(1)) { // Slicing skips first value, where time isn't a delta and power isn't instantaneous
    timestamp = timestamp - ranges[0].delta; // Account for the delta between timestamps
    const power = item.map((val: number) => {return Math.round(val / ranges[0].delta)}); // Get the instantaneous val from avg
    const date = new Date(timestamp * 1000); // Convert timestamp into date
    list.push({time: date.toLocaleTimeString("en-US"), power: power});
  }
  
  // The API values are from youngest to oldest, so we reverse the list
  return list.reverse();
}

// Gets yesterday's total instantaneous energy rates per hour for each URL
export async function getYesterdaysEnergyTotals(deviceNumber: string, JWT: string) {
    const URL = `https://egauge${deviceNumber}.d.egauge.net/api`
    const bearer = 'Bearer ' + JWT;

    // Start time is start of day yesterday, step by 1h, end time is start of current hour
    const response = await fetch(`${URL}/register?reg=all&time=sod(now-1d):1h:soh(now)&delta=true`, {
    method: 'GET',
    credentials: 'include',
    headers: {
        'Authorization': bearer,
    },
    }).then((r) => r.json());

    const res = convertPowerRangesToTotals(response.ranges);

    return res;
}

// Converts power ranges into data that can be plugged into a chart
// Takes the ranges array from a sensor response, returns array of time-power objects with summing
export function convertPowerRangesToTotals(ranges: Array<any>) : Array<any> {
  const list = [];
  var timestamp = ranges[0].ts // Get the start timestamp
  const d = new Date(timestamp * 1000);

  for (const item of ranges[0].rows.slice(1)) { // Slicing skips first value, where time isn't a delta and power isn't instantaneous
    timestamp = timestamp - ranges[0].delta; // Account for the delta between timestamps
    const power = item.map((val: number) => {return Math.round(val / ranges[0].delta)}).reduce((partialSum: number, val: number) => partialSum + val, 0); // Get the instantaneous val from avg
    const date = new Date(timestamp * 1000); // Convert timestamp into date
    list.push({time: date.toLocaleTimeString("en-US"), power: power});
  }
  
  // The API values are from youngest to oldest, so we reverse the list
  return list.reverse();
}