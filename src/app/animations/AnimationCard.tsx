"use client"

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import styles from '../../styles/AnimationsPage.module.css'
import { monthlyWeather, predictEnergy, predictGeneration, type Weather } from '../charts/energyModel';

/*
 * One card on the animations board. The animations are the original
 * components, imported unchanged from their own folders:
 *
 *   ../tree/tree.tsx, ../bottle/bottle.tsx, ../mountain/mountain.tsx,
 *   ../glacier/glacier.tsx (+ ../glacier/GlacierPair.tsx)
 *
 * Each is loaded with next/dynamic, so a type's SVG (several MB for the
 * mountain) is only downloaded once a card of that type is on the board.
 */

const loading = () => <p className={styles.status}>Loading animation…</p>
const Tree        = dynamic(() => import('../tree/tree'),           { ssr: false, loading })
const Bottle      = dynamic(() => import('../bottle/bottle'),       { ssr: false, loading })
const Mountain    = dynamic(() => import('../mountain/mountain'),   { ssr: false, loading })
const Glacier     = dynamic(() => import('../glacier/glacier'),     { ssr: false, loading })
const GlacierPair = dynamic(() => import('../glacier/GlacierPair'), { ssr: false, loading })

export type AnimationKey = 'tree' | 'bottle' | 'mountain' | 'glacier'
export type Mode = 'today' | 'yesterday' | 'date' | 'custom'

export type CardConfig = {
    id: string
    animation: AnimationKey
    mode: Mode
    date: string        // 'YYYY-MM-DD', only used when mode === 'date'
    weather: Weather    // only used when mode === 'custom'
    month: string       // month button last picked, or 'Custom'
}

export type Averages = { today: number; yesterday: number }

/*
 * Per-animation scale. `max` is the energy (average W, or Wh per hour for the
 * custom prediction — the same magnitude) that maps to the "full" state, and
 * is shared by every card of that type so cards can be compared side by side.
 * `slow` is the transition when the value jumps (month button); `fast` is used
 * while a slider is being dragged.
 */
export const ANIMATIONS: Record<AnimationKey, { label: string; max: number; slow: number; fast: number }> = {
    tree:     { label: 'Tree',     max: 18000, slow: 0,    fast: 0  }, // tree replays its own leaf drop
    bottle:   { label: 'Bottle',   max: 20000, slow: 1000, fast: 0  },
    mountain: { label: 'Mountain', max: 20000, slow: 5000, fast: 55 },
    glacier:  { label: 'Glacier',  max: 22000, slow: 3000, fast: 0  },
}

export const MODES: { key: Mode; label: string }[] = [
    { key: 'today',     label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'date',      label: 'Past day' },
    { key: 'custom',    label: 'Custom' },
]

// new Date('2021-01-01') parses as UTC midnight, which shows as Dec 31 in US
// timezones, so build the label from the string's parts.
export function formatDate(iso: string) {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function cardTitle(card: CardConfig) {
    const when =
        card.mode === 'today'     ? 'Today' :
        card.mode === 'yesterday' ? 'Yesterday' :
        card.mode === 'date'      ? formatDate(card.date) :
                                    'Custom prediction'
    return `${ANIMATIONS[card.animation].label} · ${when}`
}

type PastDay = { date: string; avgEnergy: number; temp: number | null; solarRad: number | null; humidity: number | null; windSpeed: number | null }

export default function AnimationCard({ card, averages, averagesError, onChange, onRemove, preview = false }: {
    card: CardConfig
    averages: Averages | null
    averagesError: boolean
    onChange: (patch: Partial<CardConfig>) => void
    /** Omitted for the preview card, which has nothing to remove. */
    onRemove?: () => void
    /** Marks the card as the add bar's preview rather than a board card. */
    preview?: boolean
}) {
    const [replay, setReplay] = useState(0)
    const [dragging, setDragging] = useState(false)
    const [pastDay, setPastDay] = useState<PastDay | null>(null)
    const [pastDayError, setPastDayError] = useState<string | null>(null)

    // Past day: same route the glacier page uses.
    useEffect(() => {
        if (card.mode !== 'date') return
        if (!card.date) { setPastDay(null); setPastDayError(null); return }
        let ignore = false // drop stale responses
        setPastDayError(null)
        fetch(`/api/daily-average?date=${card.date}`)
            .then(async res => {
                const body = await res.json()
                if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
                return body as PastDay
            })
            .then(data => { if (!ignore) setPastDay(data) })
            .catch(err => { if (!ignore) { setPastDay(null); setPastDayError(String(err.message ?? err)) } })
        return () => { ignore = true }
    }, [card.mode, card.date])

    const predictedUse = useMemo(() => predictEnergy(card.weather), [card.weather])
    const predictedGen = useMemo(() => predictGeneration(card.weather), [card.weather])

    // The value this card's animation shows, or null while it isn't known yet.
    const energy: number | null =
        card.mode === 'custom'    ? predictedUse :
        card.mode === 'date'      ? (pastDay?.avgEnergy ?? null) :
        card.mode === 'today'     ? (averages?.today ?? null) :
                                    (averages?.yesterday ?? null)

    // The tree only runs its leaf drop on mount, so it is remounted whenever the
    // value changes. While a slider is moving that would restart it on every
    // tick, so the tree waits until the value has settled.
    const [treeEnergy, setTreeEnergy] = useState<number | null>(energy)
    useEffect(() => {
        const t = setTimeout(() => setTreeEnergy(energy), 400)
        return () => clearTimeout(t)
    }, [energy])

    const cfg = ANIMATIONS[card.animation]
    const duration = dragging ? cfg.fast : cfg.slow

    const setWeatherField = (field: keyof Weather, value: number) => {
        setDragging(true)
        onChange({ month: 'Custom', weather: { ...card.weather, [field]: value } })
    }

    const renderAnimation = () => {
        if (energy === null) {
            const msg =
                card.mode === 'date' ? (pastDayError ? `No data for this day (${pastDayError}).` : card.date ? 'Loading…' : 'Pick a day to see it here.') :
                averagesError ? "Couldn't load today's data." : 'Loading…'
            return <p className={styles.status}>{msg}</p>
        }

        switch (card.animation) {
            case 'tree': {
                if (treeEnergy === null) return <p className={styles.status}>Loading…</p>
                // The tree keeps leaves in proportion to energyUsed/max, so feed it
                // the inverse: more energy -> more leaves fall. Floor at 2% so its
                // drop loop always has leaves to stop on.
                const kept = Math.max(0.02, 1 - treeEnergy / cfg.max)
                return (
                    <div className={styles.treewrapper}>
                        <Tree key={`tree-${replay}-${treeEnergy}`} energyUsed={kept * cfg.max} maxEnergyUsage={cfg.max} />
                    </div>
                )
            }
            case 'bottle':
                return (
                    <div className={styles.bottlewrapper}>
                        <Bottle key={replay} energyUsed={energy} maxEnergyUsage={cfg.max} updateDuration={duration} />
                    </div>
                )
            case 'mountain':
                return <Mountain key={replay} energyUsed={energy} maxEnergyUsage={cfg.max} updateDuration={duration} />
            case 'glacier':
                return card.mode === 'custom'
                    ? <GlacierPair key={replay} energyUsed={predictedUse} energyGenerated={predictedGen} maxEnergyUsage={cfg.max} meltEffectTiming={duration} />
                    : <Glacier key={replay} tint="none" showBackground energyGenerated={-1} energyUsed={energy} maxEnergyUsage={cfg.max} meltEffectTiming={duration} />
        }
    }

    return (
        <article className={`${styles.card} ${preview ? styles.previewcard : ''}`}>
            <header className={styles.cardheader}>
                <h3 className={styles.cardtitle}>
                    {preview && <span className={styles.previewbadge}>Preview</span>}
                    {card.mode === 'date' && !card.date ? `${ANIMATIONS[card.animation].label} · Past day` : cardTitle(card)}
                </h3>
                <div className={styles.cardactions}>
                    <button type="button" className={styles.iconbtn} onClick={() => setReplay(r => r + 1)} aria-label="Replay animation" title="Replay animation">
                        <RotateCcw size={16} aria-hidden="true" />
                    </button>
                    {onRemove && (
                        <button type="button" className={`${styles.iconbtn} ${styles.removebtn}`} onClick={onRemove} aria-label={`Remove ${cardTitle(card)}`} title="Remove">
                            <X size={16} aria-hidden="true" />
                        </button>
                    )}
                </div>
            </header>

            <div className={styles.stage}>
                {renderAnimation()}
            </div>

            <div className={styles.readout}>
                {card.mode === 'today' && averages && <p><b>Average energy usage: {averages.today} W</b></p>}
                {card.mode === 'yesterday' && averages && <p><b>Average energy usage: {averages.yesterday} W</b></p>}
                {card.mode === 'date' && pastDay && (
                    <>
                        <p><b>Average energy usage: {pastDay.avgEnergy} W</b></p>
                        <p className={styles.muted}>
                            {[
                                pastDay.temp != null && `${pastDay.temp.toFixed(1)} ºF`,
                                pastDay.solarRad != null && `${pastDay.solarRad.toFixed(0)} W/m²`,
                                pastDay.humidity != null && `${pastDay.humidity.toFixed(0)}% humidity`,
                                pastDay.windSpeed != null && `${pastDay.windSpeed.toFixed(1)} mph wind`,
                            ].filter(Boolean).join(' · ')}
                        </p>
                    </>
                )}
                {card.mode === 'custom' && (
                    <>
                        <p><b>Usage prediction: {Math.round(predictedUse)} Wh</b></p>
                        <p className={card.animation === 'glacier' ? (predictedUse < predictedGen ? styles.textgreen : styles.textred) : undefined}>
                            <b>Generation prediction: {Math.round(predictedGen)} Wh</b>
                        </p>
                    </>
                )}
            </div>

            {card.mode === 'custom' && (
                <div className={styles.custom}>
                    <div className={styles.monthbtncntr}>
                        {monthlyWeather.map(({ month, weather: w }) => (
                            <button
                                key={month}
                                type="button"
                                className={`${styles.monthbtn} ${card.month === month ? styles.btnactive : ''}`}
                                onClick={() => { setDragging(false); onChange({ month, weather: w }) }}
                            >
                                {month}
                            </button>
                        ))}
                    </div>
                    <div className={styles.sliderscntr} onPointerUp={() => setDragging(false)}>
                        <label>
                            Temp: {card.weather.temp} ºF
                            <input className={styles.slider} type="range" min={0} max={100} step={.1} value={card.weather.temp} onChange={e => setWeatherField('temp', parseFloat(e.target.value))} />
                        </label>
                        <label>
                            Solar: {card.weather.solar} W/m^2
                            <input className={styles.slider} type="range" min={0} max={300} step={.3} value={card.weather.solar} onChange={e => setWeatherField('solar', parseFloat(e.target.value))} />
                        </label>
                        <label>
                            Humidity: {card.weather.humidity} %
                            <input className={styles.slider} type="range" min={0} max={100} step={.1} value={card.weather.humidity} onChange={e => setWeatherField('humidity', parseFloat(e.target.value))} />
                        </label>
                        <label>
                            Wind: {Math.round(card.weather.wind * 80) / 10} mph
                            <input className={styles.slider} type="range" min={0} max={6} step={.06} value={card.weather.wind} onChange={e => setWeatherField('wind', parseFloat(e.target.value))} />
                        </label>
                    </div>
                </div>
            )}
        </article>
    )
}
