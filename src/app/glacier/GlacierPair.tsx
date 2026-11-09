"use client"

import { useId } from 'react';
import Glacier from "./glacier";

/**
 * Two glacier extents drawn on top of each other.
 *
 * Melt is monotonic in energy (see `targetMelt` in glacier.tsx), so less energy
 * means a bigger glacier and the two extents are always *nested* — the overlap
 * region is exactly the smaller glacier. That lets us colour only their
 * difference with no mask arithmetic: paint the bigger extent tinted, then
 * cover it with the smaller one, opaque and untinted. What still shows through
 * from underneath is precisely the difference.
 */
export default function GlacierPair({ energyUsed, energyGenerated, maxEnergyUsage, meltEffectTiming }: {
    energyUsed: number;
    energyGenerated: number;
    maxEnergyUsage: number;
    meltEffectTiming: number;
}) {
    // lower energy -> less melt -> bigger glacier
    const usedIsBigger = energyUsed < energyGenerated;
    const biggerExtentEnergy  = usedIsBigger ? energyUsed : energyGenerated;
    const smallerExtentEnergy = usedIsBigger ? energyGenerated : energyUsed;

    return (
        <div style={{ position: 'relative' }} id={useId()}>
            {/* Bigger extent, tinted by which quantity it represents:
                generation ahead of use reads green, a deficit reads red. */}
            <div>
            <Glacier
                tint={usedIsBigger ? 'green' : 'red'}
                energyGenerated={energyGenerated}
                energyUsed={biggerExtentEnergy}
                maxEnergyUsage={maxEnergyUsage}
                meltEffectTiming={meltEffectTiming}
            /> 

            </div>
            {/* Smaller extent: opaque and untinted, so it resets the overlap to
                the plain photo. No backdrop — it would hide the layer below. */}
            {/* This is the glacier that is on top */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', pointerEvents: 'none' }}>
                <Glacier
                    tint="none"
                    showBackground={false}
                    energyGenerated={energyGenerated}
                    energyUsed={smallerExtentEnergy}
                    maxEnergyUsage={maxEnergyUsage}
                    meltEffectTiming={meltEffectTiming}
                />
            </div>
        </div>
    );
}
