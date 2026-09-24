import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <main className="page page-home">
      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="eyebrow">REAL ESTATE · UZBEKISTAN</span>
          <h1>
            Find a place that
            <span> feels like home.</span>
          </h1>
          <p className="hero-lead">
            HAUZ brings your property journey into one calm, modern space.
            Sign in to manage your personal account and keep your details ready
            for what comes next.
          </p>

          <div className="hero-actions">
            <Link
              className="button button-primary button-large"
              to="/sign-in"
              search={{ redirect: undefined }}
            >
              Get started
              <span aria-hidden="true">→</span>
            </Link>
            <span className="hero-note">Simple. Private. Built for Uzbekistan.</span>
          </div>
        </div>

        <div className="home-visual" aria-hidden="true">
          <div className="visual-glow visual-glow-one" />
          <div className="visual-glow visual-glow-two" />
          <div className="property-card property-card-main">
            <div className="property-image">
              <span className="property-image-label">HAUZ / 01</span>
              <span className="property-image-mark">H</span>
            </div>
            <div className="property-card-body">
              <div>
                <span className="property-kicker">PERSONAL ACCOUNT</span>
                <strong>Your profile, ready.</strong>
              </div>
              <span className="property-arrow">↗</span>
            </div>
          </div>
          <div className="floating-stat">
            <span className="stat-dot" />
            <div>
              <strong>One account</strong>
              <span>for your HAUZ journey</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-features">
        <div className="section-heading">
          <span className="eyebrow">A BETTER START</span>
          <h2>Everything begins with your profile.</h2>
        </div>

        <div className="feature-grid">
          <article className="feature-card">
            <span className="feature-number">01</span>
            <h3>Fast sign in</h3>
            <p>Use a one-time email code. No password to remember.</p>
          </article>
          <article className="feature-card feature-card-accent">
            <span className="feature-number">02</span>
            <h3>Personal by design</h3>
            <p>Keep your name, role and contact details in one secure place.</p>
          </article>
          <article className="feature-card">
            <span className="feature-number">03</span>
            <h3>Ready when you are</h3>
            <p>Return anytime and pick up exactly where you left off.</p>
          </article>
        </div>
      </section>
    </main>
  )
}
