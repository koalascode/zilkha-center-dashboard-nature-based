"use client"
import { AreaChart } from '@/components/AreaChart';
import { useEffect, useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"
import { sensors } from '@/app/data/sensors';

const data = [
  {
    hour: '01:00',
    Fridge: 40,
    Oven: 0,
    Dishwasher: 0,
  },
  {
    hour: '03:00',
    Fridge: 40,
    Oven: 0,
    Dishwasher: 0,
  },
  {
    hour: '05:00',
    Fridge: 40,
    Oven: 0,
    Dishwasher: 0,
  },
  {
    hour: '07:00',
    Fridge: 40,
    Oven: 0,
    Dishwasher: 0,
  },
  {
    hour: '09:00',
    Fridge: 80,
    Oven: 0,
    Dishwasher: 0,
  },
  {
    hour: '11:00',
    Fridge: 40,
    Oven: 0,
    Dishwasher: 0,
  },
  {
    hour: '13:00',
    Fridge: 120,
    Oven: 0,
    Dishwasher: 0,
  },
  {
    hour: '15:00',
    Fridge: 40,
    Oven: 0,
    Dishwasher: 0,
  },
  {
    hour: '17:00',
    Fridge: 40,
    Oven: 0,
    Dishwasher: 0,
  },
  {
    hour: '19:00',
    Fridge: 80,
    Oven: 300,
    Dishwasher: 0,
  },
  {
    hour: '21:00',
    Fridge: 40,
    Oven: 0,
    Dishwasher: 200,
  },
  {
    hour: '23:00',
    Fridge: 40,
    Oven: 0,
    Dishwasher: 0,
  },

]

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
    <div className="grid grid-cols-4">
          <h3 className="col-span-3 text-tremor-default text-tremor-content dark:text-dark-tremor-content">Devices' Energy Use</h3>
          <div className="flex flex-col gap-2 sm:flex-row">
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