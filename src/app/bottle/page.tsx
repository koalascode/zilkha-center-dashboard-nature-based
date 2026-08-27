"use client"

import Bottle from "./bottle"
import { useEffect, useState, useMemo, useRef } from 'react';
import styles from '../../styles/BottlePage.module.css'

export default function BottlePage() {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   const [todayEnergy, setTodayEnergy] = useState(0); // set to 0 for all of these when using with signal
//   const [yesterdayEnergy, setYesterdayEnergy] = useState(0);
  const [tdAvgEnergy, setTdAvgEnergy] = useState(0);
  const [yestAvgEnergy, setYestAvgEnergy] = useState(0);
  const [temp, setTemp] = useState(65)
  const [solar, setSolar] = useState(110)
  const [humidity, setHumidity] = useState(60)
  const [wind, setWind] = useState(2)
  const [selectedMonth, setSelectedMonth] = useState<string>("Custom")
  const [transitionDuration, setTransitionDuration] = useState(0)
  const tempRef = useRef<HTMLInputElement>(null)
  const solarRef = useRef<HTMLInputElement>(null)
  const humidityRef = useRef<HTMLInputElement>(null)
  const windRef = useRef<HTMLInputElement>(null)

  const sliderTransitionTime = 0


  // uncomment to use with actual data
  // Then set the useStates above to be 0 starting point :)

    useEffect(() => {
        async function getData() {
            const res = await fetch('/api/hourly-totals', new Request(''));
            const data = await res.json();

            let todaySum = 0
            let yesterdaySum = 0

            let todayHours = 0
            let yesterdayHours = 0

            for (let i = 0; i < data.length; i++) {
              if (data[i].Today == null) {
                break
              }

              todaySum += data[i].Today
              yesterdaySum += data[i].Yesterday

              todayHours += 1
              yesterdayHours += 1
            }

            const todayExtrap = todaySum * (24/todayHours)
            const yesterdayExtrap = yesterdaySum * (24/yesterdayHours)

            const avgKwHrsTd = Math.round(todayExtrap/24)
            const avgKwHrsYest = Math.round(yesterdayExtrap/24)

            setTdAvgEnergy(avgKwHrsTd)
            setYestAvgEnergy(avgKwHrsYest)

        }
        getData();

    }, []);

    const currEnergyUsed = useMemo(() => {

    const intercept = 3897.8722
    const heating_change_normalized = 222.7304
    const cooling_change_normalized = 74.5701
    const solar_by_heating_normalized = -0.298
    const solar_by_cooling_normalized = 0.5052
    const humidity_by_heating_normalized = 0.6144
    const humidity_by_cooling_normalized = 0.3968
    const wind_by_heating_normalized = -2.3996
    const wind_by_cooling_normalized = -25.6705
    const solar_normalized = -1.5614
    const humidity_normalized = -14.2045
    const wind_normalized = 352.3839

    const balance = 62.0

    const heating = Math.max(0, balance - temp)
    const cooling = Math.max(0, temp - balance)

    const energyPred = intercept +
    (heating_change_normalized * heating) +
    (cooling_change_normalized * cooling) +
    (solar_by_heating_normalized * heating * solar) +
    (solar_by_cooling_normalized * cooling * solar) +
    (humidity_by_heating_normalized * heating * humidity) +
    (humidity_by_cooling_normalized * cooling * humidity) +
    (wind_by_heating_normalized * heating * wind) +
    (wind_by_cooling_normalized * cooling * wind) +
    (solar_normalized * solar) +
    (humidity_normalized * humidity) +
    (wind_normalized * wind)

    return energyPred

}, [temp, solar, humidity, wind])

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

    const setMonthTemps = (monthNum: number) => {
        setSelectedMonth(monthNames[monthNum - 1])
        setTransitionDuration(1000)
        setTimeout(() => setTransitionDuration(sliderTransitionTime), 1000)
        const setMonthData = (monthData: number[]) => {
            const t = Math.round(monthData[0] * 10) / 10
            const s = Math.round(monthData[1] * 10) / 10
            const h = Math.round(monthData[2] * 10) / 10
            const w = Math.round(monthData[3] * 10) / 10
            setTemp(t); setSolar(s); setHumidity(h); setWind(w)
            if (tempRef.current) tempRef.current.value = String(t)
            if (solarRef.current) solarRef.current.value = String(s)
            if (humidityRef.current) humidityRef.current.value = String(h)
            if (windRef.current) windRef.current.value = String(w)
        }
        if (monthNum == 1)  setMonthData([26.7676, 44.84, 61.0061, 1.4808])
        if (monthNum == 2)  setMonthData([29.2489, 77.3385, 61.7704, 1.8804])
        if (monthNum == 3)  setMonthData([38.3845, 111.4235, 57.8135, 1.9857])
        if (monthNum == 4)  setMonthData([48.4673, 136.0877, 58.3631, 1.9229])
        if (monthNum == 5)  setMonthData([59.5316, 176.0023, 59.8575, 1.4348])
        if (monthNum == 6)  setMonthData([67.7115, 182.5582, 64.1062, 1.4333])
        if (monthNum == 7)  setMonthData([72.4951, 182.2695, 67.4208, 1.2879])
        if (monthNum == 8)  setMonthData([69.8417, 156.3139, 67.0791, 1.1932])
        if (monthNum == 9)  setMonthData([62.9169, 132.997, 67.6029, 1.0074])
        if (monthNum == 10) setMonthData([53.0152, 98.9526, 57.714, 1.2221])
        if (monthNum == 11) setMonthData([40.992, 62.4384, 56.4365, 1.7763])
        if (monthNum == 12) setMonthData([32.7932, 42.7206, 60.0529, 1.801])
    }

    console.log("TODAY AVG ENERGY: ", tdAvgEnergy)
    console.log("YESTERDAY AVG ENERGY: ", yestAvgEnergy)

    if (tdAvgEnergy !== 0 && yestAvgEnergy !== 0) {
        return (
            <div className={styles.main}>
                <div className={styles.toprow}>
                    <div className={styles.sidecontainer}>
                        <Bottle energyUsed={tdAvgEnergy} maxEnergyUsage={16500} updateDuration={1000}/>
                        <p className={styles.energyusep}><b>Today Average Energy Usage: {tdAvgEnergy}W</b></p>
                    </div>
                    <div className={styles.sidecontainer}>
                        <Bottle energyUsed={yestAvgEnergy} maxEnergyUsage={16500} updateDuration={1000}/>
                        <p className={styles.energyusep}><b>Yesterday Average Energy Usage: {yestAvgEnergy}W</b></p>
                    </div>
                </div>
                <div className={styles.predcontainer}>
                    <div className={styles.predbottlewrapper}>
                        <Bottle energyUsed={currEnergyUsed} maxEnergyUsage={20000} updateDuration={transitionDuration}/>
                    </div>
                    <p className={styles.energyusep}><b>Energy Usage Prediction: {Math.round(currEnergyUsed)} Whr</b></p>
                    <div className={styles.monthbtncntr}>
                        <button className={styles.monthbtn} onClick={() => setMonthTemps(1)}>Jan</button>
                        <button className={styles.monthbtn} onClick={() => setMonthTemps(2)}>Feb</button>
                        <button className={styles.monthbtn} onClick={() => setMonthTemps(3)}>Mar</button>
                        <button className={styles.monthbtn} onClick={() => setMonthTemps(4)}>Apr</button>
                        <button className={styles.monthbtn} onClick={() => setMonthTemps(5)}>May</button>
                        <button className={styles.monthbtn} onClick={() => setMonthTemps(6)}>Jun</button>
                        <button className={styles.monthbtn} onClick={() => setMonthTemps(7)}>Jul</button>
                        <button className={styles.monthbtn} onClick={() => setMonthTemps(8)}>Aug</button>
                        <button className={styles.monthbtn} onClick={() => setMonthTemps(9)}>Sep</button>
                        <button className={styles.monthbtn} onClick={() => setMonthTemps(10)}>Oct</button>
                        <button className={styles.monthbtn} onClick={() => setMonthTemps(11)}>Nov</button>
                        <button className={styles.monthbtn} onClick={() => setMonthTemps(12)}>Dec</button>
                    </div>
                    {selectedMonth && <p className={styles.selectedmonth}>Selected: {selectedMonth}</p>}
                    <div className={styles.sliderscntr}>
                        <label>
                            Temp: {temp} ºF
                            <input ref={tempRef} className={styles.slider} type="range" min={0} max={100} step={.1} defaultValue={temp} onInput={(e) => { setTemp(parseFloat((e.target as HTMLInputElement).value)); if (selectedMonth !== 'Custom') setSelectedMonth('Custom')}} />
                        </label>
                        <label>
                            Solar: {solar} W/m^2
                            <input ref={solarRef} className={styles.slider} type="range" min={0} max={300} step={.3} defaultValue={solar} onInput={(e) => { setSolar(parseFloat((e.target as HTMLInputElement).value)); if (selectedMonth !== 'Custom') setSelectedMonth('Custom')}} />
                        </label>
                        <label>
                            Humidity: {humidity} %
                            <input ref={humidityRef} className={styles.slider} type="range" min={0} max={100} step={.1} defaultValue={humidity} onInput={(e) => { setHumidity(parseFloat((e.target as HTMLInputElement).value)); if (selectedMonth !== 'Custom') setSelectedMonth('Custom')}} />
                        </label>
                        <label>
                            Wind: {Math.round(wind * 80) / 10} mph
                            <input ref={windRef} className={styles.slider} type="range" min={0} max={6} step={.06} defaultValue={wind} onInput={(e) => { setWind(parseFloat((e.target as HTMLInputElement).value)); if (selectedMonth !== 'Custom') setSelectedMonth('Custom')}} />
                        </label>
                    </div>
                </div>
            </div>
        )
    } else {
        return (
            <div>
                <h1> Loading Loading 123 </h1>
            </div>
        )
    }
}
