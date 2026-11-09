"use client"

import Tree from "./tree";
import styles from '../../styles/TestPage.module.css'
import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';

export default function Test() {

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [todayEnergy, setTodayEnergy] = useState(0); // set to 0 for all of these when using with signal
  const [yesterdayEnergy, setYesterdayEnergy] = useState(0);
  const [tdAvgEnergy, setTdAvgEnergy] = useState(0);
  const [yestAvgEnergy, setYestAvgEnergy] = useState(0);
  // Bumping this changes both trees' keys, so React rebuilds them from scratch:
  // every leaf is back on the branch and the falling animation runs again.
  const [replay, setReplay] = useState(0);


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

            console.log("todaySum: ", todaySum)
            console.log("yesterdaySum: ", yesterdaySum)
            console.log("todayHours: ", todayHours)
            console.log("yesterdayHours: ", yesterdayHours)

            const todayExtrap = todaySum * (24/todayHours)
            const yesterdayExtrap = yesterdaySum * (24/yesterdayHours)

            const avgKwHrsTd = Math.round(todayExtrap/24)
            const avgKwHrsYest = Math.round(yesterdayExtrap/24)

            setTodayEnergy(todayExtrap)
            setYesterdayEnergy(yesterdayExtrap)

            setTdAvgEnergy(avgKwHrsTd)
            setYestAvgEnergy(avgKwHrsYest)

        }
        getData();

        
    }, []);

    const energyPercentDifferentialProd = ((todayEnergy - yesterdayEnergy)/yesterdayEnergy) * 200000
    console.log("ENERGYPERCENTDIFF: " + energyPercentDifferentialProd)
 if (todayEnergy != 0) {
  return (
    <div className={styles.page}>
    <div className={styles.main}>
      <div>
        <Tree key={`today-${replay}`} energyUsed={energyPercentDifferentialProd > 0 ? 180000 - 40000 - energyPercentDifferentialProd : 180000 - 40000 + (energyPercentDifferentialProd * .15)} maxEnergyUsage={180000}/>
        <p className={styles.energyusep}><b>Today Average Energy Usage: {tdAvgEnergy}W</b></p>
      </div>
      <div>
        <Tree key={`yest-${replay}`} energyUsed={energyPercentDifferentialProd < 0 ? 180000 - 40000 + energyPercentDifferentialProd : 180000 - 40000 + (energyPercentDifferentialProd * .15)} maxEnergyUsage={180000}/>
        <p className={styles.energyusep}><b>Yesterday Average Energy Usage: {yestAvgEnergy}W</b></p>
      </div>
      
    </div>
    <button
      type="button"
      className={styles.replaybtn}
      onClick={() => setReplay(r => r + 1)}
      aria-label="Replay animation"
      title="Replay animation"
    >
      <RotateCcw size={22} aria-hidden="true" />
    </button>
    </div>
  );

 }

 return (
  <div className={styles.main}>
    <h1>LOADING LOADING</h1>
  </div>
 )
  
}

