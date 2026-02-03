import type { CertificateResult } from '@bsv/sdk'
import type {
  CertificateSizeAnalysis,
  CertificateWithAnalysis,
  OptimizationSuggestion,
  TransportConstraints
} from './types'
import { TRANSPORT_CONSTRAINTS } from './types'

function getByteLength(str: string): number {
  return new TextEncoder().encode(str).length
}

function base64ByteLength(base64: string): number {
  const padding = (base64.match(/=/g) ?? []).length
  return Math.floor((base64.length * 3) / 4) - padding
}

export function analyzeCertificateSize(cert: CertificateResult): CertificateSizeAnalysis {
  const fieldSizes: Record<string, number> = {}
  let totalFieldBytes = 0

  for (const [key, value] of Object.entries(cert.fields ?? {})) {
    const size = getByteLength(value)
    fieldSizes[key] = size
    totalFieldBytes += size
  }

  const signatureBytes = cert.signature ? Math.ceil(cert.signature.length / 2) : 0
  const typeBytes = cert.type ? base64ByteLength(cert.type) : 0
  const subjectBytes = cert.subject ? Math.ceil(cert.subject.length / 2) : 0
  const certifierBytes = cert.certifier ? Math.ceil(cert.certifier.length / 2) : 0
  const serialNumberBytes = cert.serialNumber ? base64ByteLength(cert.serialNumber) : 0
  const revocationOutpointBytes = cert.revocationOutpoint ? getByteLength(cert.revocationOutpoint) : 0

  let keyringBytes = 0
  if (cert.keyring != null) {
    for (const value of Object.values(cert.keyring)) {
      keyringBytes += base64ByteLength(value)
    }
  }

  const metadataBytes = typeBytes + subjectBytes + certifierBytes + serialNumberBytes + revocationOutpointBytes

  const totalBytes = totalFieldBytes + signatureBytes + metadataBytes + keyringBytes

  const breakdown = [
    { label: 'Fields', bytes: totalFieldBytes, percentage: (totalFieldBytes / totalBytes) * 100 },
    { label: 'Signature', bytes: signatureBytes, percentage: (signatureBytes / totalBytes) * 100 },
    { label: 'Metadata', bytes: metadataBytes, percentage: (metadataBytes / totalBytes) * 100 },
    { label: 'Keyring', bytes: keyringBytes, percentage: (keyringBytes / totalBytes) * 100 }
  ].filter(item => item.bytes > 0)

  return {
    totalBytes,
    fieldSizes,
    signatureBytes,
    metadataBytes,
    keyringBytes,
    breakdown
  }
}

export function generateOptimizations(
  cert: CertificateResult,
  analysis: CertificateSizeAnalysis
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = []

  if (analysis.keyringBytes > 100) {
    suggestions.push({
      type: 'info',
      title: 'Keyring adds significant size',
      description: `The keyring adds ${analysis.keyringBytes} bytes. For transport, consider transmitting only the certificate without the keyring and deriving keys on the receiver side.`,
      potentialSavings: analysis.keyringBytes
    })
  }

  const largeFields = Object.entries(analysis.fieldSizes)
    .filter(([, size]) => size > 100)
    .sort((a, b) => b[1] - a[1])

  if (largeFields.length > 0) {
    const [fieldName, fieldSize] = largeFields[0]
    suggestions.push({
      type: 'warning',
      title: `Large field: "${fieldName}"`,
      description: `This field is ${fieldSize} bytes. Consider using shorter values, abbreviations, or storing large data externally with a hash reference.`,
      potentialSavings: Math.floor(fieldSize * 0.5)
    })
  }

  if (analysis.totalBytes <= 137) {
    suggestions.push({
      type: 'success',
      title: 'NFC Type 1 compatible',
      description: 'This certificate fits in the smallest NFC tag format, making it highly portable.'
    })
  } else if (analysis.totalBytes <= 504) {
    suggestions.push({
      type: 'success',
      title: 'NFC Type 2 compatible',
      description: 'This certificate fits in standard NTAG213/215 tags commonly used in business cards and access badges.'
    })
  } else if (analysis.totalBytes > 4096) {
    suggestions.push({
      type: 'warning',
      title: 'Too large for most NFC tags',
      description: 'Consider selective field revelation or compression for NFC transmission.'
    })
  }

  const fieldCount = Object.keys(cert.fields ?? {}).length
  if (fieldCount > 10) {
    suggestions.push({
      type: 'info',
      title: 'Many certificate fields',
      description: `This certificate has ${fieldCount} fields. For transport, consider proving only essential fields using proveCertificate.`
    })
  }

  if (analysis.totalBytes > 2000) {
    suggestions.push({
      type: 'info',
      title: 'Consider chunked transmission',
      description: 'For constrained transports, implement chunked transmission with reassembly on the receiver side.'
    })
  }

  return suggestions
}

export function checkTransportFit(
  analysis: CertificateSizeAnalysis,
  transports: TransportConstraints[] = TRANSPORT_CONSTRAINTS
): { transport: TransportConstraints; fits: boolean; overageBytes: number }[] {
  return transports.map(transport => ({
    transport,
    fits: analysis.totalBytes <= transport.maxBytes,
    overageBytes: Math.max(0, analysis.totalBytes - transport.maxBytes)
  }))
}

export function analyzeFullCertificate(cert: CertificateResult): CertificateWithAnalysis {
  const analysis = analyzeCertificateSize(cert)
  const transportFit = checkTransportFit(analysis)
  const optimizations = generateOptimizations(cert, analysis)

  return {
    certificate: cert,
    analysis,
    transportFit,
    optimizations
  }
}

export function serializeCertificateMinimal(cert: CertificateResult): Uint8Array {
  const minimalCert = {
    t: cert.type,
    s: cert.subject,
    sn: cert.serialNumber,
    c: cert.certifier,
    r: cert.revocationOutpoint,
    sg: cert.signature,
    f: cert.fields
  }
  return new TextEncoder().encode(JSON.stringify(minimalCert))
}

export function serializeCertificateCompact(cert: CertificateResult): Uint8Array {
  const compactCert = {
    type: cert.type,
    subject: cert.subject,
    serialNumber: cert.serialNumber,
    certifier: cert.certifier,
    revocationOutpoint: cert.revocationOutpoint,
    signature: cert.signature,
    fields: cert.fields
  }
  return new TextEncoder().encode(JSON.stringify(compactCert))
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
