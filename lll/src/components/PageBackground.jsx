import './PageBackground.css'

export default function PageBackground({ gradientId = 'goldBand' }) {
  return (
    <>
      <div className="page-bg__leaves" aria-hidden="true" />
      <div className="page-bg__wave" aria-hidden="true">
        <svg
          className="page-bg__wave-svg"
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--gold-light)" />
              <stop offset="100%" stopColor="var(--gold)" />
            </linearGradient>
          </defs>
          <path
            className="page-bg__wave-fill"
            d="M0,52 C360,138 1080,138 1440,52 L1440,200 L0,200 Z"
          />
          <path
            className="page-bg__wave-gold"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="12"
            strokeLinecap="round"
            d="M0,52 C360,138 1080,138 1440,52"
          />
        </svg>
      </div>
    </>
  )
}
