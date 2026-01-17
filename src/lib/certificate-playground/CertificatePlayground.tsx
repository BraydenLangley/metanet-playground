import { useCallback, useState } from 'react'
import { WalletClient } from '@bsv/sdk'
import type { CertificateResult, ListCertificatesArgs } from '@bsv/sdk'
import {
  analyzeFullCertificate,
  formatBytes,
  serializeCertificateMinimal,
  serializeCertificateCompact
} from './analysis'
import type { CertificateWithAnalysis } from './types'
import { TRANSPORT_CONSTRAINTS } from './types'

export interface CertificatePlaygroundProps {
  className?: string
}

const KNOWN_CERTIFIERS = [
  {
    name: 'SocialCert (Mainnet)',
    pubKey: '02cf6cdf466951d8dfc9e7c9367511d0007ed6fba35ed42d425cc412fd6cfd4a17',
    types: ['vdDWvftf1H+5+ZprUw123kjHlywH+v20aPQTuXgMpNc=']
  },
  {
    name: 'Any Certifier',
    pubKey: '',
    types: []
  }
]

export function CertificatePlayground({ className = '' }: CertificatePlaygroundProps) {
  const [walletClient] = useState(() => new WalletClient('auto'))
  const [certificates, setCertificates] = useState<CertificateWithAnalysis[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCert, setSelectedCert] = useState<CertificateWithAnalysis | null>(null)
  const [customCertifier, setCustomCertifier] = useState('')
  const [customType, setCustomType] = useState('')
  const [selectedPreset, setSelectedPreset] = useState(0)

  const fetchCertificates = useCallback(async () => {
    setLoading(true)
    setError(null)
    setCertificates([])

    try {
      const preset = KNOWN_CERTIFIERS[selectedPreset]
      const certifiers: string[] = []
      const types: string[] = []

      if (preset.pubKey !== '') {
        certifiers.push(preset.pubKey)
        types.push(...preset.types)
      }

      if (customCertifier.trim() !== '') {
        certifiers.push(customCertifier.trim())
      }

      if (customType.trim() !== '') {
        types.push(customType.trim())
      }

      if (certifiers.length === 0) {
        setError('Please select a certifier preset or enter a custom certifier public key')
        setLoading(false)
        return
      }

      const args: ListCertificatesArgs = {
        certifiers,
        types: types.length > 0 ? types : [],
        limit: 100
      }

      const result = await walletClient.listCertificates(args)

      if (result.certificates.length === 0) {
        setError('No certificates found matching the criteria. You may not have any certificates from this certifier.')
      } else {
        const analyzed = result.certificates.map(cert => analyzeFullCertificate(cert))
        setCertificates(analyzed)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch certificates'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [walletClient, selectedPreset, customCertifier, customType])

  const totalSize = certificates.reduce((sum, c) => sum + c.analysis.totalBytes, 0)

  return (
    <div className={`glass-panel px-8 py-8 ${className}`}>
      <div className="flex flex-col gap-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-300/80">Certificate Analysis</span>
          <h2 className="mt-2 text-2xl font-semibold text-white">Certificate Playground</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Explore your identity certificates, analyze their size, and understand how they can be optimized for different transport mechanisms like NFC, QR codes, and Bluetooth.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Query Certificates</h3>

            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
                Certifier Preset
              </label>
              <div className="flex flex-wrap gap-2">
                {KNOWN_CERTIFIERS.map((preset, index) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setSelectedPreset(index)}
                    className={`rounded-lg border px-3 py-2 text-sm transition ${selectedPreset === index
                      ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-200'
                      : 'border-slate-800/80 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                      }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
                Custom Certifier (Public Key Hex)
              </label>
              <input
                type="text"
                value={customCertifier}
                onChange={e => setCustomCertifier(e.target.value)}
                placeholder="03abc123... (66 hex characters)"
                className="command-input"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
                Custom Type (Base64)
              </label>
              <input
                type="text"
                value={customType}
                onChange={e => setCustomType(e.target.value)}
                placeholder="c3ViamVjdEF0dGVzdGF0aW9u"
                className="command-input"
              />
            </div>

            <button
              type="button"
              onClick={fetchCertificates}
              disabled={loading}
              className="rounded-xl border border-emerald-400/60 bg-emerald-500/20 px-6 py-3 font-semibold text-emerald-200 transition hover:bg-emerald-500/30 disabled:opacity-50"
            >
              {loading ? 'Fetching…' : 'List Certificates'}
            </button>

            {error != null && (
              <div className="rounded-xl border border-rose-500/50 bg-rose-500/10 p-4 text-sm text-rose-200">
                {error}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Transport Constraints Reference</h3>
            <div className="grid gap-2">
              {TRANSPORT_CONSTRAINTS.map(transport => (
                <div
                  key={transport.name}
                  className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/60 px-4 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{transport.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{transport.name}</p>
                      <p className="text-xs text-slate-400">{transport.description}</p>
                    </div>
                  </div>
                  <span className="text-sm font-mono text-emerald-300">{formatBytes(transport.maxBytes)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {certificates.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-400">Certificates Found</p>
                <p className="mt-2 text-3xl font-semibold text-white">{certificates.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-400">Total Size</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-300">{formatBytes(totalSize)}</p>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-400">Avg Size</p>
                <p className="mt-2 text-3xl font-semibold text-sky-300">
                  {formatBytes(Math.round(totalSize / certificates.length))}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Certificate List</h3>
              <div className="space-y-3">
                {certificates.map((certAnalysis, index) => (
                  <button
                    key={`${certAnalysis.certificate.serialNumber}-${index}`}
                    type="button"
                    onClick={() => setSelectedCert(certAnalysis)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${selectedCert?.certificate.serialNumber === certAnalysis.certificate.serialNumber
                      ? 'border-emerald-400/60 bg-slate-900/80'
                      : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                      }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-white">
                          Type: <span className="font-mono text-emerald-200">{certAnalysis.certificate.type}</span>
                        </p>
                        <p className="text-xs text-slate-400">
                          Serial: {certAnalysis.certificate.serialNumber.slice(0, 20)}…
                        </p>
                        <p className="text-xs text-slate-400">
                          Fields: {Object.keys(certAnalysis.certificate.fields ?? {}).length}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold text-white">
                          {formatBytes(certAnalysis.analysis.totalBytes)}
                        </p>
                        <div className="mt-1 flex flex-wrap justify-end gap-1">
                          {certAnalysis.transportFit.slice(0, 3).map(fit => (
                            <span
                              key={fit.transport.name}
                              className={`rounded px-2 py-0.5 text-xs ${fit.fits
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                                }`}
                            >
                              {fit.transport.icon} {fit.fits ? '✓' : '✗'}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {selectedCert != null && (
          <CertificateDetail
            certAnalysis={selectedCert}
            onClose={() => setSelectedCert(null)}
          />
        )}
      </div>
    </div>
  )
}

interface CertificateDetailProps {
  certAnalysis: CertificateWithAnalysis
  onClose: () => void
}

function CertificateDetail({ certAnalysis, onClose }: CertificateDetailProps) {
  const { certificate, analysis, transportFit, optimizations } = certAnalysis
  const [showRaw, setShowRaw] = useState(false)

  const minimalBytes = serializeCertificateMinimal(certificate)
  const compactBytes = serializeCertificateCompact(certificate)

  return (
    <div className="space-y-6 rounded-2xl border border-emerald-400/30 bg-slate-900/80 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Certificate Analysis</h3>
          <p className="mt-1 text-sm text-slate-400">
            Serial: <span className="font-mono">{certificate.serialNumber}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-800"
        >
          Close
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Size Breakdown</h4>
          <div className="space-y-2">
            {analysis.breakdown.map(item => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">{item.label}</span>
                  <span className="font-mono text-white">{formatBytes(item.bytes)} ({item.percentage.toFixed(1)}%)</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-400">Total Size</p>
            <p className="mt-1 text-3xl font-semibold text-emerald-300">{formatBytes(analysis.totalBytes)}</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Serialization Comparison</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-xs text-slate-400">Minimal Keys JSON</p>
                <p className="mt-1 font-mono text-lg text-white">{formatBytes(minimalBytes.length)}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-xs text-slate-400">Compact JSON</p>
                <p className="mt-1 font-mono text-lg text-white">{formatBytes(compactBytes.length)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Transport Compatibility</h4>
          <div className="space-y-2">
            {transportFit.map(fit => (
              <div
                key={fit.transport.name}
                className={`flex items-center justify-between rounded-lg border p-3 ${fit.fits
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-rose-500/30 bg-rose-500/10'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span>{fit.transport.icon}</span>
                  <span className={fit.fits ? 'text-emerald-200' : 'text-rose-200'}>
                    {fit.transport.name}
                  </span>
                </div>
                <div className="text-right">
                  {fit.fits ? (
                    <span className="text-sm text-emerald-300">✓ Fits</span>
                  ) : (
                    <span className="text-sm text-rose-300">+{formatBytes(fit.overageBytes)} over</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {optimizations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Optimization Suggestions</h4>
          {optimizations.map((opt, index) => (
            <div
              key={index}
              className={`rounded-xl border p-4 ${opt.type === 'warning'
                ? 'border-amber-500/30 bg-amber-500/10'
                : opt.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-sky-500/30 bg-sky-500/10'
                }`}
            >
              <p className={`font-semibold ${opt.type === 'warning'
                ? 'text-amber-200'
                : opt.type === 'success'
                  ? 'text-emerald-200'
                  : 'text-sky-200'
                }`}>
                {opt.type === 'warning' ? '⚠️' : opt.type === 'success' ? '✅' : 'ℹ️'} {opt.title}
              </p>
              <p className="mt-1 text-sm text-slate-300">{opt.description}</p>
              {opt.potentialSavings != null && (
                <p className="mt-2 text-xs text-slate-400">
                  Potential savings: <span className="font-mono text-emerald-300">{formatBytes(opt.potentialSavings)}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Certificate Fields</h4>
          <button
            type="button"
            onClick={() => setShowRaw(!showRaw)}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            {showRaw ? 'Hide Raw' : 'Show Raw'}
          </button>
        </div>
        <div className="space-y-2">
          {Object.entries(certificate.fields ?? {}).map(([key, value]) => (
            <div key={key} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{key}</p>
                  <p className="mt-1 break-all text-sm text-white">
                    {value.length > 100 && !showRaw ? `${value.slice(0, 100)}…` : value}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs text-emerald-300">
                  {formatBytes(analysis.fieldSizes[key] ?? 0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showRaw && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Raw Certificate JSON</h4>
          <pre className="max-h-64 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-300">
            {JSON.stringify(certificate, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default CertificatePlayground
