import React from 'react'
import { motion } from 'framer-motion'
import { Rocket, Building2, Headphones } from 'lucide-react'

interface SupportCardProps {
  icon: React.ReactNode
  title: string
  description: string
  accentColor: string
  children?: React.ReactNode
}

function SupportCard({ icon, title, description, accentColor, children }: SupportCardProps) {
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
      id="getting-started"
      style={{
        background: '#0A0A0A',
        padding: '96px 24px',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
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
            We set you up. We stay with you.
          </h2>
          <p style={{ fontSize: 16, color: '#6B7280', maxWidth: 520, margin: '0 auto' }}>
            Most restaurants are live within 48 hours. Whether you run one site or a growing chain,
            you get hands-on onboarding and a team that answers the phone.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SupportCard
            icon={<Rocket size={22} />}
            title="Fast onboarding"
            description="We import your menu, configure your locations, and train your managers. No IT project required."
            accentColor="#3B82F6"
          >
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 'auto' }}>
              Typical go-live: 48 hours
            </p>
          </SupportCard>

          <SupportCard
            icon={<Building2 size={22} />}
            title="Built for multiple locations"
            description="One dashboard for every site — compare sales, spot slow kitchens, and roll out menu changes everywhere at once."
            accentColor="#10B981"
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Franchise groups', 'Regional managers', 'Single owner scaling up'].map((label) => (
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
          </SupportCard>

          <SupportCard
            icon={<Headphones size={22} />}
            title="Real people when you need them"
            description="Chat support on Growth plans. Phone and a dedicated account manager on Enterprise. We speak restaurant, not jargon."
            accentColor="#8B5CF6"
          >
            <a
              href="mailto:hello@masova.com"
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
              Talk to our team →
            </a>
          </SupportCard>
        </div>
      </div>
    </section>
  )
}