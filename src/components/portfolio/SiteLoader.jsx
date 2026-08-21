export default function SiteLoader({ label = 'Loading…' }) {
  return (
    <div className="psite-loader" role="status" aria-live="polite" aria-busy="true">
      <span className="psite-loader-spin" />
      <p>{label}</p>
    </div>
  )
}
