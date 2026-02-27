import React from 'react'
import { motion } from 'framer-motion'
import { Code2, Smartphone, Headphones } from 'lucide-react'

interface DevCardProps {
  icon: React.ReactNode
  title: string
  description: string
  accentColor: string
  children?: React.ReactNode
}

function DevCard({ icon, title, description, accentColor, children }: DevCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      style={{
        background: '#111111',
        border: '1px solid rgba(255,255,255,0.08)',
        borderTop: `3px solid ${accentColor}`,
        borderRadius: 16,
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: `${accentColor}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accentColor,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#FFFFFF',
            marginBottom: 8,
          }}
        >
          {title}
        </h3>
        <p style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.65 }}>
          {description}
        </p>
      </div>
      {children}
    </motion.div>
  )
}

export default function DeveloperSection() {
  return (
    <section
      id="about"
      style={{
        background: '#0A0A0A',
        padding: '96px 24px',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 700,
              color: '#FFFFFF',
              marginBottom: 12,
              letterSpacing: '-0.02em',
            }}
          >
            Built for developers.
          </h2>
          <p style={{ fontSize: 16, color: '#6B7280', maxWidth: 520, margin: '0 auto' }}>
            Open APIs, native apps, and engineering support — MaSoVa integrates with your stack.
          </p>
        </motion.div>

        {/* Cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Card 1 — REST API */}
          <DevCard
            icon={<Code2 size={22} />}
            title="Full REST API"
            description="Every feature is API-first. Orders, menus, drivers, inventory — all accessible via authenticated endpoints."
            accentColor="#3B82F6"
          >
            <a
              href="/api-docs"
              style={{
                display: 'inline-block',
                marginTop: 'auto',
                fontSize: 13,
                fontWeight: 500,
                color: '#3B82F6',
                textDecoration: 'none',
                paddingTop: 4,
              }}
            >
              View API Docs →
            </a>
          </DevCard>

          {/* Card 2 — Android Apps */}
          <DevCard
            icon={<Smartphone size={22} />}
            title="Android Applications"
            description="Native Android app for customers (ordering + live tracking) and a separate driver app for fleet management."
            accentColor="#10B981"
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Customer App', 'Driver App'].map((label) => (
                <span
                  key={label}
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#D1D5DB',
                    background: '#1A1A1A',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 999,
                    padding: '4px 12px',
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
              APKs available on request
            </p>
          </DevCard>

          {/* Card 3 — Developer Support */}
          <DevCard
            icon={<Headphones size={22} />}
            title="Developer Support"
            description="Direct access to the engineering team. Integration help, webhook docs, and sandbox environment available."
            accentColor="#8B5CF6"
          >
            <a
              href="#contact"
              style={{
                display: 'inline-block',
                marginTop: 'auto',
                fontSize: 13,
                fontWeight: 500,
                color: '#8B5CF6',
                textDecoration: 'none',
                paddingTop: 4,
              }}
            >
              Contact Engineering →
            </a>
          </DevCard>
        </div>
      </div>
    </section>
  )
}
