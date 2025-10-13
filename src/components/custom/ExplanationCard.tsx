import { Card } from "../Card";

export const ExplanationCard = () => (
  <Card>
    <h3 className="font-semibold text-gray-900 dark:text-gray-50">
      Energy Consumption in the Zilkha Center
    </h3>
    <p className="mt-2 text-sm leading-6 text-gray-900 dark:text-gray-50">
      The goal is for the building to be net = 0 for energy consumption.
      The top graph displays yesterday&apos;s total energy use compared to today, and the 
      lower graph shows all the appliances under each sensor separately. 
      Use the selector menu to choose which device&apos;s data to display. All of the available 
      devices, and the appliances they cover, are avaiable in the list on the right.
      Click on the name of each device to expand the list of appliances.
    </p>
  </Card> 
);