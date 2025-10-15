"use client"
import React, { Suspense } from "react"
import DeviceList from "@/components/custom/DeviceList";
import { ExplanationCard } from "@/components/custom/ExplanationCard";
import { DayTotalsChart } from "@/components/custom/DayTotalsChart";
import { DevicesChart } from "@/components/custom/DevicesChart";
import styles from "../styles/Page.module.css"

export default function Home() {

  return (
    <div className="bg-blue-50 bg-cover min-h-svh">
      <aside className="lg:w-64 lg:fixed lg:inset-y-0 lg:flex lg:flex-col flex grow flex-col gap-y-4 overflow-y-auto whitespace-nowrap px-3 py-4">
          <span className="p-3 text-sx font-black text-gray-900">Sensors Available:</span>
        <div className="">
          <Suspense fallback={<div>Loading registers...</div>} >
              <DeviceList/>
            </Suspense>
      </div>
      </aside>
      <main className="lg:pl-64 lg:py-3 lg:pr-3">
        <div className="bg-white p-4 sm:p-6 lg:rounded-lg lg:border lg:border-gray-200 dark:bg-gray-925 lg:dark:border-gray-900">   
          <section className="font-bold top-16 z-50 -my-6 flex flex-col gap-6 bg-white py-6 md:flex-row md:flex-wrap md:items-center md:justify-between lg:top-0 dark:bg-gray-925 border-b border-gray-200 transition-all dark:border-gray-900">
            <p className={styles.textheader}>Energy Dashboard</p>
          </section>
          <section className={styles.chartsmain}>
            <div className={styles.daytotalschart}>
              <DayTotalsChart/>
            </div>
            <div className={styles.explainationcard}>
              <ExplanationCard/>
            </div>
          </section>
            <div className="col-span-full">
              <DevicesChart/>
            </div>
        </div>
      </main>
    </div>
  );
}
