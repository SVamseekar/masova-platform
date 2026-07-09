import { motion } from 'framer-motion'
import SectionLabel from './SectionLabel'
import CustomerAppMockup from './CustomerAppMockup'
import CrewAppMockup from './CrewAppMockup'
import { colors } from '../tokens'

export default function MobileEcosystemSection() {
  return (
    <section id="mobile" className="py-32 px-6" style={{ background: colors.bgAlt }}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <SectionLabel>Mobile apps</SectionLabel>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Your brand in every pocket
          </h2>
          <p className="text-gray-400 text-lg">
            Customers order on your branded app. Kitchen, drivers, cashiers, and managers each get
            the right screen — no confusion, no extra logins.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center"
          >
            <CustomerAppMockup size="default" />
            <p className="text-center text-gray-500 text-sm mt-6 max-w-xs">
              Card payments · live delivery tracking · in-app chat support
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center"
          >
            <CrewAppMockup size="default" />
            <p className="text-center text-gray-500 text-sm mt-6 max-w-xs">
              Works when Wi‑Fi drops · driver GPS · instant kitchen alerts
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
