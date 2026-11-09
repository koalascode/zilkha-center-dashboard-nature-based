export const defaultWeather = { temp: 65, solar: 110, humidity: 60, wind: 2 };
export type Weather = typeof defaultWeather;

// Average weather for each month, Jan–Dec, from the bottle and glacier pages' month buttons.
export const monthlyWeather: { month: string; weather: Weather }[] = [
    ["Jan", 26.7676, 44.84, 61.0061, 1.4808],
    ["Feb", 29.2489, 77.3385, 61.7704, 1.8804],
    ["Mar", 38.3845, 111.4235, 57.8135, 1.9857],
    ["Apr", 48.4673, 136.0877, 58.3631, 1.9229],
    ["May", 59.5316, 176.0023, 59.8575, 1.4348],
    ["Jun", 67.7115, 182.5582, 64.1062, 1.4333],
    ["Jul", 72.4951, 182.2695, 67.4208, 1.2879],
    ["Aug", 69.8417, 156.3139, 67.0791, 1.1932],
    ["Sep", 62.9169, 132.997, 67.6029, 1.0074],
    ["Oct", 53.0152, 98.9526, 57.714, 1.2221],
    ["Nov", 40.992, 62.4384, 56.4365, 1.7763],
    ["Dec", 32.7932, 42.7206, 60.0529, 1.801],
].map(([month, ...values]) => {
    // Rounded to one decimal, as the pages do before setting their sliders.
    const [temp, solar, humidity, wind] = (values as number[]).map((value) => Math.round(value * 10) / 10);
    return { month: month as string, weather: { temp, solar, humidity, wind } };
});

// Same coefficients and heating/cooling formula as the bottle page.
export function predictEnergy({ temp, solar, humidity, wind }: Weather) {
    const intercept = 3897.8722
    const heating_change_normalized = 222.7304
    const cooling_change_normalized = 74.5701
    const solar_by_heating_normalized = -0.298
    const solar_by_cooling_normalized = 0.5052
    const humidity_by_heating_normalized = 0.6144
    const humidity_by_cooling_normalized = 0.3968
    const wind_by_heating_normalized = -2.3996
    const wind_by_cooling_normalized = -25.6705
    const solar_normalized = -1.5614
    const humidity_normalized = -14.2045
    const wind_normalized = 352.3839

    const balance = 62.0

    const heating = Math.max(0, balance - temp)
    const cooling = Math.max(0, temp - balance)

    const energyPred = intercept +
    (heating_change_normalized * heating) +
    (cooling_change_normalized * cooling) +
    (solar_by_heating_normalized * heating * solar) +
    (solar_by_cooling_normalized * cooling * solar) +
    (humidity_by_heating_normalized * heating * humidity) +
    (humidity_by_cooling_normalized * cooling * humidity) +
    (wind_by_heating_normalized * heating * wind) +
    (wind_by_cooling_normalized * cooling * wind) +
    (solar_normalized * solar) +
    (humidity_normalized * humidity) +
    (wind_normalized * wind)

    return energyPred

}
