export { PeerCommandPalette } from './peer-command/PeerCommandPalette'
export type { PeerCommandPaletteProps } from './peer-command/PeerCommandPalette'
export { parseCommand, formatCommandHint } from './peer-command/parser'
export type {
  PeerProfile,
  PeerCommand,
  PeerActionClient,
  CommandExecutionResult,
  CommandHistoryEntry
} from './peer-command/types'

export { CertificatePlayground } from './certificate-playground'
export type { CertificatePlaygroundProps } from './certificate-playground'
export {
  analyzeCertificateSize,
  analyzeFullCertificate,
  checkTransportFit,
  generateOptimizations,
  formatBytes,
  TRANSPORT_CONSTRAINTS
} from './certificate-playground'
export type {
  CertificateSizeAnalysis,
  CertificateWithAnalysis,
  OptimizationSuggestion,
  TransportConstraints
} from './certificate-playground'
