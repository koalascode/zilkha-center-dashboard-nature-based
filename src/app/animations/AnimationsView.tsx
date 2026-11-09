"use client"

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import styles from '../../styles/AnimationsPage.module.css'
import { defaultWeather } from '../charts/energyModel';
import AnimationCard, { ANIMATIONS, MODES, type AnimationKey, type Averages, type CardConfig, type Mode } from './AnimationCard';

/*
 * The animations board: people add cards (an animation for a given day, or a
 * custom slider prediction), compare them side by side, and remove them.
 *
 * The board is saved in this browser's localStorage, so it survives a reload
 * but is per viewer/device — nothing is shared or stored on the server.
 */

const STORAGE_KEY = 'zilkha-animation-board-v1'
const MAX_CARDS = 8 // each card is a large SVG; more than this gets sluggish

const DEFAULT_BOARD: CardConfig[] = [
    { id: 'default-today', animation: 'tree', mode: 'today', date: '', weather: defaultWeather, month: 'Custom' },
    { id: 'default-yesterday', animation: 'tree', mode: 'yesterday', date: '', weather: defaultWeather, month: 'Custom' },
]

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

// Same extrapolation every animation page does on /api/hourly-totals: sum the
// hours so far and divide by the hour count for an average W.
function averagesFromHourly(data: { Today: number | null; Yesterday: number }[]): Averages | null {
    let todaySum = 0, yesterdaySum = 0, hours = 0
    for (const row of data) {
        if (row.Today == null) break
        todaySum += row.Today
        yesterdaySum += row.Yesterday
        hours += 1
    }
    if (hours === 0) return null
    return { today: Math.round(todaySum / hours), yesterday: Math.round(yesterdaySum / hours) }
}

function loadBoard(): CardConfig[] | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return null
        // Drop anything malformed (e.g. saved by an older version of this page).
        return parsed.filter((c): c is CardConfig =>
            c && typeof c.id === 'string' && c.animation in ANIMATIONS &&
            MODES.some(m => m.key === c.mode) && c.weather && typeof c.weather.temp === 'number'
        ).slice(0, MAX_CARDS)
    } catch {
        return null
    }
}

export default function AnimationsView() {
    const [cards, setCards] = useState<CardConfig[]>(DEFAULT_BOARD)
    const [loaded, setLoaded] = useState(false)

    const [averages, setAverages] = useState<Averages | null>(null)
    const [averagesError, setAveragesError] = useState(false)

    // The card being set up in the add bar. It drives the preview, and
    // "Add to board" copies it (including any custom slider settings).
    const [draft, setDraft] = useState<CardConfig>({
        id: 'preview', animation: 'bottle', mode: 'today', date: '', weather: defaultWeather, month: 'Custom',
    })
    const [showPreview, setShowPreview] = useState(true)
    const updateDraft = (patch: Partial<CardConfig>) => setDraft(d => ({ ...d, ...patch }))

    // Read the saved board after mount (localStorage doesn't exist during SSR,
    // and reading it in render would cause a hydration mismatch).
    useEffect(() => {
        const saved = loadBoard()
        if (saved) setCards(saved)
        setLoaded(true)
    }, [])

    useEffect(() => {
        if (!loaded) return
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cards)) } catch { /* private mode etc. */ }
    }, [cards, loaded])

    // Today/yesterday are fetched once and shared by every card.
    useEffect(() => {
        fetch('/api/hourly-totals')
            .then(res => res.ok ? res.json() : Promise.reject(res.status))
            .then(data => {
                const avg = averagesFromHourly(data)
                if (avg) setAverages(avg)
                else setAveragesError(true)
            })
            .catch(err => { console.error('hourly-totals failed:', err); setAveragesError(true) })
    }, [])

    const full = cards.length >= MAX_CARDS
    const needsDate = draft.mode === 'date' && !draft.date
    const canAdd = !full && !needsDate

    const addCard = () => {
        if (!canAdd) return
        setCards(cs => [...cs, { ...draft, id: newId(), date: draft.mode === 'date' ? draft.date : '' }])
    }

    const updateCard = (id: string, patch: Partial<CardConfig>) =>
        setCards(cs => cs.map(c => c.id === id ? { ...c, ...patch } : c))

    const removeCard = (id: string) =>
        setCards(cs => cs.filter(c => c.id !== id))

    return (
        <div className={styles.main}>
            <section className={styles.addpanel} aria-label="Add an animation">
                <form className={styles.addbar} onSubmit={e => { e.preventDefault(); addCard() }}>
                    <label className={styles.selectlabel}>
                        Animation
                        <select className={styles.select} value={draft.animation} onChange={e => updateDraft({ animation: e.target.value as AnimationKey })}>
                            {(Object.keys(ANIMATIONS) as AnimationKey[]).map(key => (
                                <option key={key} value={key}>{ANIMATIONS[key].label}</option>
                            ))}
                        </select>
                    </label>

                    <div className={styles.selectlabel}>
                        Data
                        <div className={styles.modes} role="radiogroup" aria-label="Data source">
                            {MODES.map(m => (
                                <button
                                    key={m.key}
                                    type="button"
                                    role="radio"
                                    aria-checked={draft.mode === m.key}
                                    className={`${styles.btn} ${draft.mode === m.key ? styles.btnactive : ''}`}
                                    onClick={() => updateDraft({ mode: m.key as Mode })}
                                >
                                    {m.label}
                                </button>
                            ))}
                            {draft.mode === 'date' && (
                                <input
                                    type="date"
                                    className={styles.dateinput}
                                    min="2021-01-01"
                                    max="2025-12-30"
                                    value={draft.date}
                                    onChange={e => updateDraft({ date: e.target.value })}
                                    aria-label="Day to show"
                                />
                            )}
                        </div>
                    </div>

                    <div className={styles.addactions}>
                        <button type="button" className={styles.linkbtn} onClick={() => setShowPreview(v => !v)} aria-expanded={showPreview}>
                            {showPreview ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
                            {showPreview ? 'Hide preview' : 'Show preview'}
                        </button>
                        <button type="submit" className={styles.addbtn} disabled={!canAdd}>
                            <Plus size={16} aria-hidden="true" /> Add to board
                        </button>
                    </div>
                    {full && <p className={styles.hint}>The board holds up to {MAX_CARDS} animations. Remove one to add another.</p>}
                    {!full && needsDate && <p className={styles.hint}>Pick a day to add.</p>}
                </form>

                {showPreview && (
                    <div className={styles.previewslot}>
                        {/* Keyed by animation so switching type starts that animation fresh. */}
                        <AnimationCard
                            key={draft.animation}
                            preview
                            card={draft}
                            averages={averages}
                            averagesError={averagesError}
                            onChange={updateDraft}
                        />
                    </div>
                )}
            </section>

            {cards.length === 0 ? (
                <div className={styles.empty}>
                    <p>The board is empty. Choose an animation and a day above, then press <b>Add to board</b>.</p>
                    <button type="button" className={styles.linkbtn} onClick={() => setCards(DEFAULT_BOARD)}>Restore default board</button>
                </div>
            ) : (
                <div className={styles.board}>
                    {cards.map(card => (
                        <AnimationCard
                            key={card.id}
                            card={card}
                            averages={averages}
                            averagesError={averagesError}
                            onChange={patch => updateCard(card.id, patch)}
                            onRemove={() => removeCard(card.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
