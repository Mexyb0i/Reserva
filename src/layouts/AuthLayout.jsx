import { Outlet } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import './AuthLayout.css'

function AuthLayout() {
  return (
    <main className="auth-page">
      <div aria-hidden="true" className="auth-page__pattern" />
      <div aria-hidden="true" className="auth-page__glow" />
      <div className="auth-card">
        <aside className="auth-art" aria-label="Sports facilities">
          <div className="auth-art__image" aria-hidden="true" />
          <div className="auth-art__overlay" />
          <div className="auth-art__content">
            <BrandLogo className="brand-logo--large" />
            <div className="auth-art__tagline">
              <span className="auth-eyebrow">YOUR GAME. YOUR COURT.</span>
              <p>Book the court.<br />Own the game.</p>
              <span className="auth-art__caption">Find your next match with RESERVA.</span>
            </div>
            <div className="auth-art__pagination" aria-hidden="true">
              <span />
              <i />
              <i />
            </div>
          </div>
        </aside>
        <section className="auth-form-panel" aria-label="Account access">
          <header className="auth-mobile-header">
            <BrandLogo className="brand-logo--large" />
          </header>
          <Outlet />
        </section>
      </div>
    </main>
  )
}

export default AuthLayout
