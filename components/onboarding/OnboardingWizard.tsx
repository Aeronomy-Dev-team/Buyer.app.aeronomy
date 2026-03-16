'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check, X, ChevronDown } from 'lucide-react'

// Major world aviation hub airports by region
const AIRPORTS_BY_REGION: Record<string, { code: string; name: string }[]> = {
    'US': [
        { code: 'ATL', name: 'Atlanta Hartsfield-Jackson' },
        { code: 'DFW', name: 'Dallas/Fort Worth' },
        { code: 'DEN', name: 'Denver International' },
        { code: 'ORD', name: 'Chicago O\'Hare' },
        { code: 'LAX', name: 'Los Angeles International' },
        { code: 'JFK', name: 'New York JFK' },
        { code: 'SFO', name: 'San Francisco International' },
        { code: 'SEA', name: 'Seattle-Tacoma' },
        { code: 'MIA', name: 'Miami International' },
        { code: 'EWR', name: 'Newark Liberty' },
        { code: 'IAH', name: 'Houston George Bush' },
        { code: 'PHX', name: 'Phoenix Sky Harbor' },
    ],
    'EU': [
        { code: 'LHR', name: 'London Heathrow' },
        { code: 'CDG', name: 'Paris Charles de Gaulle' },
        { code: 'FRA', name: 'Frankfurt' },
        { code: 'AMS', name: 'Amsterdam Schiphol' },
        { code: 'MAD', name: 'Madrid Barajas' },
        { code: 'BCN', name: 'Barcelona El Prat' },
        { code: 'FCO', name: 'Rome Fiumicino' },
        { code: 'MUC', name: 'Munich' },
        { code: 'ZRH', name: 'Zurich' },
        { code: 'VIE', name: 'Vienna' },
        { code: 'BRU', name: 'Brussels' },
        { code: 'CPH', name: 'Copenhagen' },
        { code: 'OSL', name: 'Oslo Gardermoen' },
        { code: 'ARN', name: 'Stockholm Arlanda' },
        { code: 'HEL', name: 'Helsinki Vantaa' },
    ],
    'UK': [
        { code: 'LHR', name: 'London Heathrow' },
        { code: 'LGW', name: 'London Gatwick' },
        { code: 'STN', name: 'London Stansted' },
        { code: 'MAN', name: 'Manchester' },
        { code: 'EDI', name: 'Edinburgh' },
        { code: 'BHX', name: 'Birmingham' },
    ],
    'APAC': [
        { code: 'HKG', name: 'Hong Kong International' },
        { code: 'SIN', name: 'Singapore Changi' },
        { code: 'NRT', name: 'Tokyo Narita' },
        { code: 'HND', name: 'Tokyo Haneda' },
        { code: 'ICN', name: 'Seoul Incheon' },
        { code: 'PVG', name: 'Shanghai Pudong' },
        { code: 'PEK', name: 'Beijing Capital' },
        { code: 'BKK', name: 'Bangkok Suvarnabhumi' },
        { code: 'KUL', name: 'Kuala Lumpur' },
        { code: 'SYD', name: 'Sydney Kingsford Smith' },
        { code: 'MEL', name: 'Melbourne Tullamarine' },
        { code: 'DEL', name: 'Delhi Indira Gandhi' },
        { code: 'BOM', name: 'Mumbai Chhatrapati Shivaji' },
        { code: 'CGK', name: 'Jakarta Soekarno-Hatta' },
    ],
    'MENA': [
        { code: 'DXB', name: 'Dubai International' },
        { code: 'AUH', name: 'Abu Dhabi' },
        { code: 'DOH', name: 'Doha Hamad' },
        { code: 'JED', name: 'Jeddah King Abdulaziz' },
        { code: 'RUH', name: 'Riyadh King Khalid' },
        { code: 'CAI', name: 'Cairo International' },
        { code: 'TLV', name: 'Tel Aviv Ben Gurion' },
        { code: 'IST', name: 'Istanbul' },
        { code: 'AMM', name: 'Amman Queen Alia' },
        { code: 'BAH', name: 'Bahrain' },
        { code: 'MCT', name: 'Muscat' },
        { code: 'KWI', name: 'Kuwait City' },
    ],
    'LATAM': [
        { code: 'GRU', name: 'São Paulo Guarulhos' },
        { code: 'MEX', name: 'Mexico City' },
        { code: 'BOG', name: 'Bogotá El Dorado' },
        { code: 'SCL', name: 'Santiago' },
        { code: 'EZE', name: 'Buenos Aires Ezeiza' },
        { code: 'LIM', name: 'Lima Jorge Chávez' },
        { code: 'PTY', name: 'Panama City Tocumen' },
        { code: 'CUN', name: 'Cancún' },
        { code: 'GIG', name: 'Rio de Janeiro Galeão' },
    ],
    'Other': [
        { code: 'JNB', name: 'Johannesburg O.R. Tambo' },
        { code: 'CPT', name: 'Cape Town' },
        { code: 'NBO', name: 'Nairobi Jomo Kenyatta' },
        { code: 'ADD', name: 'Addis Ababa Bole' },
        { code: 'LOS', name: 'Lagos Murtala Muhammed' },
    ],
}

export default function OnboardingWizard() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [airportDropdownOpen, setAirportDropdownOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        companyEmail: '',
        teamSize: '',
        headquarters: '',
        entityType: '',
        organizationType: '',
        otherOrganizationType: '',
        intent: '',
        requirements: '',
        targetAirports: [] as string[],
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/organization/profile')
            if (res.ok) {
                const data = await res.json()
                if (!data.isNew && data.name) {
                    // Pre-fill if organization exists
                    setFormData({
                        name: data.userName || '',
                        companyName: data.name || '',
                        companyEmail: data.companyEmail || '',
                        teamSize: data.teamSize || '',
                        headquarters: data.headquarters || '',
                        entityType: data.entityType || '',
                        organizationType: data.organizationType || '',
                        otherOrganizationType: '',
                        intent: data.intent || '',
                        requirements: data.requirements || '',
                        targetAirports: data.targetAirports || [],
                    })
                }
            }
        } catch (error) {
            console.error('Failed to load profile', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            // Save organization data
            const res = await fetch('/api/organization/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userName: formData.name,
                    name: formData.companyName,
                    companyEmail: formData.companyEmail,
                    teamSize: formData.teamSize,
                    headquarters: formData.headquarters,
                    entityType: formData.entityType,
                    organizationType: formData.organizationType === 'other' ? formData.otherOrganizationType : formData.organizationType,
                    intent: formData.intent,
                    requirements: formData.requirements,
                    targetAirports: formData.targetAirports,
                }),
            })

            if (!res.ok) {
                throw new Error('Failed to save organization data')
            }

            // Complete onboarding and redirect
            const completeRes = await fetch('/api/organization/onboarding/complete', {
                method: 'POST',
            })

            if (completeRes.ok) {
                // Redirect immediately after onboarding completion so optional follow-up
                // requests like welcome email cannot block navigation.
                void fetch('/api/auth/welcome-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.companyEmail,
                        userName: formData.name,
                        companyName: formData.companyName,
                    }),
                }).catch((emailError) => {
                    console.error('Failed to send welcome email:', emailError)
                })

                window.location.replace('/dashboard')
                return
            } else {
                throw new Error('Failed to complete onboarding')
            }
        } catch (error) {
            console.error('Error submitting form:', error)
            alert('Failed to save. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 bg-[url('/images/onboardingbg.png')] bg-cover bg-center bg-no-repeat font-sans text-slate-900">
            {/* Backdrop Overlay */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

            {/* Floating Island Card */}
            <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5">
                {/* Header */}
                <div className="border-b border-slate-200 bg-slate-50/80 px-8 py-6">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                            A
                        </div>
                        <span>Aeronomy</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">Complete your organization setup</p>
                </div>

                {/* Main Content */}
                <main className="px-8 py-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                            Organization Setup
                        </h1>
                        <p className="mt-2 text-sm text-slate-600">
                            Please provide the following information to get started.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-900">
                                Your Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your full name"
                            />
                        </div>

                        {/* Company Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-900">
                                Company Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your company name"
                            />
                        </div>

                        {/* Headquarters & Entity Type */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-900">
                                    Headquarters Location <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.headquarters}
                                    onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select location</option>
                                    <option value="US">United States</option>
                                    <option value="EU">European Union</option>
                                    <option value="UK">United Kingdom</option>
                                    <option value="APAC">Asia Pacific</option>
                                    <option value="MENA">Middle East & North Africa</option>
                                    <option value="LATAM">Latin America</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-900">
                                    Entity Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.entityType}
                                    onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select entity type</option>
                                    <option value="Corporation">Corporation</option>
                                    <option value="LLC">LLC</option>
                                    <option value="Partnership">Partnership</option>
                                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                                    <option value="Non-Profit">Non-Profit / NGO</option>
                                    <option value="Government">Government Entity</option>
                                </select>
                            </div>
                        </div>

                        {/* Company Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-900">
                                Company Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.companyEmail}
                                onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="contact@company.com"
                            />
                        </div>

                        {/* Team Size */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-900">
                                Team Size <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.teamSize}
                                onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select team size</option>
                                <option value="1-10">1-10 employees</option>
                                <option value="11-50">11-50 employees</option>
                                <option value="51-200">51-200 employees</option>
                                <option value="201-500">201-500 employees</option>
                                <option value="501+">501+ employees</option>
                            </select>
                        </div>

                        {/* Organization Type - Radio Buttons */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-900">
                                Organization Type <span className="text-red-500">*</span>
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 rounded-lg border border-slate-300 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input
                                        type="radio"
                                        name="organizationType"
                                        value="airline"
                                        checked={formData.organizationType === 'airline'}
                                        onChange={(e) => setFormData({ ...formData, organizationType: e.target.value })}
                                        className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    <span className="text-sm text-slate-900">Airline / Buyer</span>
                                </label>

                                <label className="flex items-center gap-3 rounded-lg border border-slate-300 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input
                                        type="radio"
                                        name="organizationType"
                                        value="producer"
                                        checked={formData.organizationType === 'producer'}
                                        onChange={(e) => setFormData({ ...formData, organizationType: e.target.value })}
                                        className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-slate-900">SAF Producer</span>
                                </label>

                                <label className="flex items-center gap-3 rounded-lg border border-slate-300 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input
                                        type="radio"
                                        name="organizationType"
                                        value="trader"
                                        checked={formData.organizationType === 'trader'}
                                        onChange={(e) => setFormData({ ...formData, organizationType: e.target.value })}
                                        className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-slate-900">Fuel Trader / Distributor</span>
                                </label>

                                <label className="flex items-start gap-3 rounded-lg border border-slate-300 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input
                                        type="radio"
                                        name="organizationType"
                                        value="other"
                                        checked={formData.organizationType === 'other'}
                                        onChange={(e) => setFormData({ ...formData, organizationType: e.target.value })}
                                        className="h-4 w-4 mt-0.5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div className="flex-1">
                                        <span className="text-sm text-slate-900">Other</span>
                                        {formData.organizationType === 'other' && (
                                            <input
                                                type="text"
                                                value={formData.otherOrganizationType}
                                                onChange={(e) => setFormData({ ...formData, otherOrganizationType: e.target.value })}
                                                className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Please specify..."
                                                required
                                            />
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Target Airports - Multi-select (only for airline and trader) */}
                        {(formData.organizationType === 'airline' || formData.organizationType === 'trader') && formData.headquarters && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-900">
                                    Major Airports for SAF Requirements
                                </label>
                                <p className="text-xs text-slate-500 mb-2">
                                    Select the airports where you&apos;ll need SAF supply
                                </p>

                                {/* Selected airports display */}
                                {formData.targetAirports.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.targetAirports.map((code) => {
                                            const airport = AIRPORTS_BY_REGION[formData.headquarters]?.find(a => a.code === code)
                                            return (
                                                <span
                                                    key={code}
                                                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                                                >
                                                    <span className="font-medium">{code}</span>
                                                    {airport && <span className="text-blue-500">· {airport.name}</span>}
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({
                                                            ...formData,
                                                            targetAirports: formData.targetAirports.filter(a => a !== code)
                                                        })}
                                                        className="ml-1 text-blue-400 hover:text-blue-700"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            )
                                        })}
                                    </div>
                                )}

                                {/* Dropdown */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setAirportDropdownOpen(!airportDropdownOpen)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
                                    >
                                        <span className={formData.targetAirports.length === 0 ? 'text-slate-400' : ''}>
                                            {formData.targetAirports.length === 0
                                                ? 'Select airports...'
                                                : `${formData.targetAirports.length} airport(s) selected`}
                                        </span>
                                        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${airportDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {airportDropdownOpen && (
                                        <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-60 overflow-auto">
                                            {AIRPORTS_BY_REGION[formData.headquarters]?.map((airport) => {
                                                const isSelected = formData.targetAirports.includes(airport.code)
                                                return (
                                                    <button
                                                        key={airport.code}
                                                        type="button"
                                                        onClick={() => {
                                                            const newAirports = isSelected
                                                                ? formData.targetAirports.filter(a => a !== airport.code)
                                                                : [...formData.targetAirports, airport.code]
                                                            setFormData({ ...formData, targetAirports: newAirports })
                                                        }}
                                                        className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between ${isSelected ? 'bg-blue-50' : ''}`}
                                                    >
                                                        <span>
                                                            <span className="font-medium">{airport.code}</span>
                                                            <span className="text-slate-500 ml-2">· {airport.name}</span>
                                                        </span>
                                                        {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Intent - Dropdown */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-900">
                                What brings you here? <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.intent}
                                onChange={(e) => setFormData({ ...formData, intent: e.target.value })}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select your intent</option>
                                <option value="explore">Explore SAF availability</option>
                                <option value="sell">Sell or list SAF</option>
                                <option value="compliance">Understand compliance / regulations</option>
                                <option value="browsing">Just browsing</option>
                            </select>
                        </div>

                        {/* Requirements */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-900">
                                SAF Requirements / Goals
                            </label>
                            <textarea
                                value={formData.requirements}
                                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                placeholder="Describe your volume needs, target pathways (e.g. HEFA), or sustainability goals..."
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={saving || !formData.name || !formData.companyName || !formData.headquarters || !formData.entityType || !formData.companyEmail || !formData.teamSize || !formData.organizationType || !formData.intent || (formData.organizationType === 'other' && !formData.otherOrganizationType)}
                                className="flex items-center rounded-lg bg-blue-600 px-8 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Setting up...
                                    </>
                                ) : (
                                    <>
                                        Enter Dashboard
                                        <Check className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    )
}