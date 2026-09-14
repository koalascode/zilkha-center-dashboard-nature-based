import DashboardLayout from "@/components/custom/DashboardLayout";
import { DayTotalsChart } from "@/components/custom/DayTotalsChart";
import styles from "@/styles/Page.module.css";
import EnergyComparison from "./EnergyComparison";

export default function ChartsPage() {
  return (
    <DashboardLayout>
      <section className={styles.chartsmain}>
        <div className={styles.daytotalschart}>
          <h3 className={styles.subtextheader}>Total Energy Use</h3>
          <DayTotalsChart />
        </div>
      </section>
      <EnergyComparison />
    </DashboardLayout>
  );
}
