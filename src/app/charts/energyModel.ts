export const defaultWeather = { temp: 65, solar: 110, humidity: 60, wind: 2 };
export type Weather = typeof defaultWeather;

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
