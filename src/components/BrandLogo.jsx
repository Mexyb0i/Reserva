import { Link } from 'react-router-dom'
import './BrandLogo.css'

function BrandLogo({ to = '/', className = '', label = 'RESERVA home', onClick }) {
  return (
    <Link to={to} className={`brand-logo ${className}`} aria-label={label} onClick={onClick}>
      <span className="brand-logo__word">RESERVA</span>
      <svg className="brand-logo__mark" viewBox="0 0 20 20" aria-hidden="true">
        <rect x="1.5" y="1.5" width="17" height="17" rx="5" />
        <path d="m7 6.5 6 7m0-7-6 7" />
      </svg>
    </Link>
  )
}

export default BrandLogo
