"use client"

import { useEffect, useState } from 'react';
import styles from '../../styles/GlacierPage.module.css'
import Glacier from "./glacier";

export default function GlacierPage() {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   const [todayEnergy, setTodayEnergy] = useState(0); // set to 0 for all of these when using with signal
//   const [yesterdayEnergy, setYesterdayEnergy] = useState(0);
  const [tdAvgEnergy, setTdAvgEnergy] = useState(0);
  const [yestAvgEnergy, setYestAvgEnergy] = useState(0);
  const [isTodaySelected, setIsTodaySelected] = useState(true)


  // uncomment to use with actual data
  // Then set the useStates above to be 0 starting point :)
     
    useEffect(() => {
        async function getData() {
            const res = await fetch('/api/hourly-totals', new Request(''));
            const data = await res.json();

            console.log("DATA: ", data)

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

            // console.log("todaySum: ", todaySum)
            // console.log("yesterdaySum: ", yesterdaySum)
            // console.log("todayHours: ", todayHours)
            // console.log("yesterdayHours: ", yesterdayHours)

            const todayExtrap = todaySum * (24/todayHours)
            const yesterdayExtrap = yesterdaySum * (24/yesterdayHours)

            const avgKwHrsTd = Math.round(todayExtrap/24)
            const avgKwHrsYest = Math.round(yesterdayExtrap/24)

            // setTodayEnergy(todayExtrap)
            // setYesterdayEnergy(yesterdayExtrap)

            setTdAvgEnergy(avgKwHrsTd)
            setYestAvgEnergy(avgKwHrsYest)

            

        }
        getData();
    }, []);

        return (
            <div className={styles.main}>
                <div className={styles.sidecontainer}>
                    { tdAvgEnergy === 0 && yestAvgEnergy === 0 ? 
                    <div>
                        <h1>Loading Loading</h1>
                    </div>
                         : 
                        <div>
                            <Glacier energyUsed={isTodaySelected ? tdAvgEnergy > yestAvgEnergy ? tdAvgEnergy : tdAvgEnergy - (.15 * tdAvgEnergy) : yestAvgEnergy > tdAvgEnergy ? yestAvgEnergy : yestAvgEnergy - (.15 * yestAvgEnergy)} maxEnergyUsage={15000}/>
                            <div className={styles.btncontainer}>
                                <button className={styles.btn} onClick={() => setIsTodaySelected(true)}>Today</button>
                                <button className={styles.btn} onClick={() => setIsTodaySelected(false)}>Yesterday</button>
                            </div>
                            <p className={styles.energyusep}><b>Today Average Energy Usage: {tdAvgEnergy}W</b></p>
                            <p className={styles.energyusep}><b>Yesterday Average Energy Usage: {yestAvgEnergy}W</b></p>
                    </div>
                    }
                    
                </div>
               


            </div>
        )
}