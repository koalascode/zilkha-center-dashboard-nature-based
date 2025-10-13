"use client"
import { AreaChart } from '@/components/AreaChart';

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

export function DeviceChart() {
  return (
    <>
    <h3 className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Devices&apos; Energy Use</h3>
      <p className="text-tremor-metric text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold"></p>
    <AreaChart
        className="mt-4 h-72"
        data={data}
        index="hour"
        yAxisWidth={65}
        categories={['Fridge', 'Oven', 'Dishwasher']}
        colors={['emerald', 'amber', 'pink']}
        valueFormatter={valueFormatter}
      />
    </>
      
    
  );
}