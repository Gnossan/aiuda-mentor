// src/api.js — ersätter chrome.runtime.sendMessage för AI och data

import { hämtaToken } from './auth.js'

const BACKEND = import.meta.env.VITE_MENTOR_BACKEND || 'https://aiuda-mentor-backend.vercel.app'

async function anropa(path, options = {}) {
    const token = await hämtaToken()
    if (!token) return { error: 'Ej inloggad' }
    const resp = await fetch(`${BACKEND}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {})
        }
    })
    return resp.json()
}

// ── AI-chatt ───────────────────────────────────────────────────────────────

export async function chat(systemprompt, historik, model = 'claude-sonnet-4-6', temperature = 1.0) {
    const data = await anropa('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ systemprompt, historik, model, temperature })
    })
    return { result: data.result, error: data.error, plan: data.plan }
}

// ── Webbsökning ────────────────────────────────────────────────────────────

export async function sök(query) {
    const data = await anropa('/api/search', {
        method: 'POST',
        body: JSON.stringify({ query })
    })
    return { results: data.results || [] }
}

// ── Projekt/historik ───────────────────────────────────────────────────────

export async function listaProjekt() {
    return anropa('/api/projekt-historik', { method: 'GET' })
}

export async function laddaHistorik(projektId) {
    const data = await anropa(`/api/projekt-historik?projektId=${encodeURIComponent(projektId)}`, { method: 'GET' })
    return data
}

export async function sparaHistorikRemote(data) {
    return anropa('/api/projekt-historik', {
        method: 'POST',
        body: JSON.stringify(data)
    })
}

export async function raderaProjektRemote(projektId) {
    return anropa(`/api/projekt-historik?projektId=${encodeURIComponent(projektId)}`, { method: 'DELETE' })
}

// ── Anteckningar ───────────────────────────────────────────────────────────

export async function sparaAnteckningarRemote(data) {
    return sparaHistorikRemote(data) // Samma endpoint
}

export async function laddaAnteckningarRemote(projektId) {
    return laddaHistorik(projektId) // Samma endpoint, returnerar krypteradAnteckningar m.m.
}

// ── Krypteringsnyckel ──────────────────────────────────────────────────────

export async function sparaKrypteringsnyckel(nyckelData) {
    return anropa('/api/encryption-key', {
        method: 'POST',
        body: JSON.stringify(nyckelData)
    })
}

export async function hämtaKrypteringsnyckel() {
    return anropa('/api/encryption-key', { method: 'GET' })
}

// ── Session-logg ───────────────────────────────────────────────────────────

export async function sparaMentorLogg(entry) {
    return anropa('/api/mentor-log', {
        method: 'POST',
        body: JSON.stringify(entry)
    })
}

export async function laddaLoggRemote(projektId, sessionId) {
    let path = '/api/mentor-log'
    if (projektId) path += `?projektId=${encodeURIComponent(projektId)}`
    else if (sessionId) path += `?sessionId=${encodeURIComponent(sessionId)}`
    return anropa(path, { method: 'GET' })
}

// ── Reader-annotation (via Firestore direkt via backend) ───────────────────

export async function hämtaReaderAnnotation(url) {
    return anropa(`/api/page-annotation?url=${encodeURIComponent(url)}`, { method: 'GET' })
}

// ── Stripe checkout — köp tokens ───────────────────────────────────────────

const READER_BACKEND = 'https://annotated-reader-backend.vercel.app'

export async function startaCheckout(produkt = 'mentor_tokens_1m') {
    const token = await hämtaToken()
    if (!token) return { error: 'Ej inloggad' }
    const resp = await fetch(`${READER_BACKEND}/api/checkout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ produkt })
    })
    return resp.json()
}
