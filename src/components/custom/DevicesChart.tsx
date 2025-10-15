"use client"
import { AreaChart } from '@/components/AreaChart';
import { useEffect, useState } from 'react';
import styles from "../../styles/DevicesChart.module.css"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"
import { sensors } from '@/app/data/sensors';

const valueFormatter = function (number: number | bigint) {
  return new Intl.NumberFormat('us').format(number).toString() + ' W';
};

export function DevicesChart() {
    const [d, setData] = useState({data: [{time: '1:00', device: 29 }], names: ['device']});
    console.log("DATA:", d)
    
    const [value, setValue] = useState(sensors[0].number.toString())
        useEffect(() => {
            async function getData() {
                const res = await fetch(`/api/sensor-today?id=${value}`).then((r) => r.json());
                setData(res);
            }
            getData();
    
            
        }, [value]);
  return (
    <>
    <div className={styles.textandselecterdiv}>
      <h3 className={styles.subtextheader}>Devices&apos; Energy Use</h3>
      <div className={styles.sensorselector}>
        <Select defaultValue='{sensors[0].name}' value={value} onValueChange={setValue}>
          <SelectTrigger className="mx-auto h-10">
            <SelectValue placeholder="Select" aria-label={value} />
          </SelectTrigger>
          <SelectContent>
            {sensors.map((item) => (
              <SelectItem key={item.name} value={item.number.toString()}>
                <span className="flex items-center gap-x-2">{item.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
    <AreaChart
        className="mt-4 h-75"
        data={d.data}
        index="time"
        yAxisWidth={65}
        categories={d.names}
        colors={['emerald', 'amber', 'pink', 'fuchsia', 'blue', 'lime', 'cyan', 'violet']}
        valueFormatter={valueFormatter}
      />
    </>
      
    
  );
}