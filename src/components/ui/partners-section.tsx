import Image from 'next/image';
import { motion } from 'framer-motion';
import { Marquee } from '~/components/ui/marquee';
import { api } from '~/utils/api';
import { useTranslation } from '~/hooks/use-translation';

const fadeIn = {
  initial: {
    opacity: 0,
    filter: 'blur(8px)',
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    transition: {
      duration: 1,
      ease: [0.25, 0.1, 0.25, 1],
      opacity: { duration: 0.6 },
      filter: { duration: 0.8 },
      scale: { duration: 0.8 },
    },
  },
};

interface PartnersSectionProps {
  variant?: 'landing' | 'internal';
}

export function PartnersSection({ variant = 'landing' }: PartnersSectionProps) {
  const t = useTranslation();

  // Fetch partners data for the marquee
  const { data: partners, isLoading: isLoadingPartners } = api.partner.getAll.useQuery();

  // Style variants for different backgrounds
  const isInternal = variant === 'internal';
  const containerClasses = isInternal
    ? "relative w-full py-8"
    : "relative w-full py-8";

  const titleClasses = isInternal
    ? "text-2xl font-bold text-white text-center mb-6"
    : "text-2xl font-bold bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent text-center mb-6";

  const descriptionClasses = isInternal
    ? "mb-8 text-center text-sm text-white/80 max-w-2xl mx-auto px-4"
    : "mb-8 text-center text-sm text-white/60 max-w-2xl mx-auto px-4";

  const fadeMaskClasses = isInternal
    ? "absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"
    : "absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none";

  const fadeMaskRightClasses = isInternal
    ? "absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"
    : "absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none";

  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      transition={{ duration: 1, delay: 0.3 }}
      className={containerClasses}
    >
      <div className="relative z-10">
        <h2 className={titleClasses}>
          {t('trustedByPartners')}
        </h2>
        <motion.p
          variants={fadeIn}
          className={descriptionClasses}
        >
          {t('partnersDescription')}
        </motion.p>

        <motion.div variants={fadeIn} className="w-full max-w-7xl mx-auto px-4">
          {/* Marquee container with fade masks */}
          <div className="relative overflow-hidden">
            {/* Left fade mask */}
            <div className={fadeMaskClasses} />

            {/* Right fade mask */}
            <div className={fadeMaskRightClasses} />

            <Marquee className="py-4" pauseOnHover={true} repeat={6}>
              {isLoadingPartners
                ? // Loading skeleton
                Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-center w-32 h-16 mx-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 animate-pulse"
                  >
                    <div className="w-20 h-3 bg-white/20 rounded"></div>
                  </div>
                ))
                : partners && partners.length > 0
                  ? // Real partner data
                  partners.map(partner => (
                    <div
                      key={partner.id}
                      className="flex items-center justify-center w-32 h-16 mx-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 group"
                    >
                      {partner.companyLogoUrl ? (
                        // Show company logo if available
                        <div className="relative w-24 h-8">
                          <Image
                            src={partner.companyLogoUrl}
                            alt={
                              partner.companyName ??
                              `${partner.firstName} ${partner.lastName}`
                            }
                            fill
                            className="object-contain"
                            sizes="96px"
                          />
                        </div>
                      ) : (
                        // Fallback to company name
                        <div className="text-white/70 group-hover:text-white transition-colors duration-300 font-bold text-xs tracking-wider text-center">
                          {partner.companyName ??
                            `${partner.firstName} ${partner.lastName}`}
                        </div>
                      )}
                    </div>
                  ))
                  : // Fallback to default partners if no data
                  [
                    { name: 'SEQUOIA' },
                    { name: 'ANDREESSEN' },
                    { name: 'Y COMBINATOR' },
                    { name: 'ACCEL' },
                    { name: 'KLEINER PERKINS' },
                    { name: 'GREYLOCK' },
                    { name: 'INDEX VENTURES' },
                    { name: 'FIRST ROUND' },
                  ].map((partner, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-center w-32 h-16 mx-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 group"
                    >
                      <div className="text-white/70 group-hover:text-white transition-colors duration-300 font-bold text-xs tracking-wider">
                        {partner.name}
                      </div>
                    </div>
                  ))}
            </Marquee>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

