"use client"
import DashboardLayout from "@/components/custom/DashboardLayout";
import { ExplanationCard } from "@/components/custom/ExplanationCard";
import { DayTotalsChart } from "@/components/custom/DayTotalsChart";
import { DevicesChart } from "@/components/custom/DevicesChart";
import styles from "../styles/Page.module.css"
import { useState } from "react";
import Test from "./tree/page";
import BottlePage from "./bottle/page";
import MountainPage from "./mountain/page";
import GlacierPage from "./glacier/page";


export default function Home() {
  const [dashboardMain, setDashboardMain] = useState<number>(0)

  return (
    <DashboardLayout>
          <section className={styles.chartsmain}>
            <div className={styles.daytotalschart}>
              <h3 className={styles.subtextheader}>Total Energy Use</h3>
              <div>
                <button className={styles.chartselectbtn} onClick={() => setDashboardMain(0)}>Chart</button>
                <button className={styles.chartselectbtn} onClick={() => setDashboardMain(1)} style={{ backgroundColor: "#dbaf00" }}>Tree</button>
                <button className={styles.chartselectbtn} onClick={() => setDashboardMain(2)} style={{ backgroundColor: "#167ce2ff" }}>Bottle</button>
                <button className={styles.chartselectbtn} onClick={() => setDashboardMain(3)} style={{ backgroundColor: "rgb(22, 219, 226)" }}>Mountain</button>
                <button className={styles.chartselectbtn} onClick={() => setDashboardMain(4)} style={{ backgroundColor: "rgb(158, 22, 226)" }}>Glacier</button>
              </div>
              {dashboardMain === 0 ? <DayTotalsChart/> : null}
              {dashboardMain === 1 ? <Test /> : null}
              {dashboardMain === 2 ? <BottlePage /> : null}
              {dashboardMain === 3 ? <MountainPage /> : null}
              {dashboardMain === 4 ? <GlacierPage /> : null}
              
            </div>
            <div className={styles.explainationcard}>
              <ExplanationCard/>
            </div>
          </section>
            <div className="col-span-full">
              <DevicesChart/>
            </div>
    </DashboardLayout>
  );
}
