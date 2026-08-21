function range(count) {
  return Array.from({ length: count }, (_, index) => index)
}

export function ShotSkeleton() {
  return <div className="shot skeleton" aria-hidden="true" />
}

export function HeroSkeleton() {
  return <div className="hero skeleton" aria-hidden="true" />
}

export function FilmGridSkeleton({ count = 4 }) {
  return (
    <div className="feature-grid">
      {range(count).map((index) => (
        <ShotSkeleton key={index} />
      ))}
    </div>
  )
}

export function FilmRowSkeleton({ count = 4 }) {
  return (
    <section className="block" aria-hidden="true">
      <div className="block-head">
        <span className="skeleton skeleton-text skeleton-row-title" />
        <span className="skeleton skeleton-text skeleton-row-hint" />
      </div>
      <FilmGridSkeleton count={count} />
    </section>
  )
}

export function HomeSkeleton() {
  return (
    <>
      <HeroSkeleton />
      <FilmRowSkeleton />
    </>
  )
}

export function ProjectListSkeleton({ count = 3 }) {
  return (
    <div className="project-list" aria-hidden="true">
      {range(count).map((index) => (
        <div key={index} className="project-row">
          <div className="project-still skeleton" />
          <div className="project-body">
            <span className="skeleton skeleton-text skeleton-project-title" />
            <span className="skeleton skeleton-text skeleton-project-logline" />
            <span className="skeleton skeleton-text skeleton-project-btn" />
          </div>
          <div className="project-stats">
            <span className="skeleton skeleton-text skeleton-stat-value" />
            <span className="skeleton skeleton-text skeleton-stat-label" />
          </div>
        </div>
      ))}
    </div>
  )
}
