import DashboardLayout from "@/components/custom/DashboardLayout";
import { DayTotalsChart } from "@/components/custom/DayTotalsChart";
import styles from "@/styles/Page.module.css";
import BottleCounterparts from "./BottleCounterparts";
import EnergyComparison from "./EnergyComparison";
import HourlyDifference from "./HourlyDifference";

export default function ChartsPage() {
  return (
    <DashboardLayout>
      <section className={styles.chartsmain}>
        <div className={styles.daytotalschart}>
          <h3 className={styles.subtextheader}>Total Energy Use</h3>
          <DayTotalsChart />
        </div>
      </section>
      <HourlyDifference />
      <EnergyComparison />
      <BottleCounterparts />
    </DashboardLayout>
  );
}
