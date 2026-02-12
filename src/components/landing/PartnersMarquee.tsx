import { motion } from 'framer-motion';
import Image from 'next/image';
import { Marquee } from '~/components/ui/marquee';
import { useTranslation } from '~/hooks/use-translation';
import { api } from '~/utils/api';

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

export default function PartnersMarquee() {
  const t = useTranslation();
  const { data: partners, isLoading: isLoadingPartners } = api.partner.getAll.useQuery(undefined, {
    staleTime: 15 * 60 * 1000, // 15 minutes - partners don't change often
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      transition={{ duration: 1, delay: 0.3 }}
      className="relative w-full py-8 sm:py-12 md:py-16"
    >
      <div className="absolute inset-0" />
      <div className="relative z-10">
        <h2 className="font-['Segoe UI'] text-xl sm:text-3xl md:text-4xl lg:text-[66px] leading-[130%] md:leading-[120%] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent text-center mb-3 sm:mb-6 md:mb-12 px-6 sm:px-8">
          {t('trustedByPartners')}
        </h2>
        <motion.p
          variants={fadeIn}
          className="mb-6 sm:mb-8 md:mb-16 text-center text-xs sm:text-sm md:text-base lg:text-lg text-white/60 max-w-xs sm:max-w-sm md:max-w-2xl mx-auto px-8 sm:px-6"
        >
          {t('partnersDescription')}
        </motion.p>

        <motion.div variants={fadeIn} className="w-full max-w-7xl mx-auto">
          <div className="relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 md:w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 md:w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

            <Marquee className="py-4 sm:py-6 md:py-8" pauseOnHover={true} repeat={6}>
              {isLoadingPartners
                ? Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-center w-24 h-12 sm:w-32 sm:h-16 md:w-40 md:h-20 rounded-lg sm:rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 animate-pulse"
                  >
                    <div className="w-14 sm:w-20 md:w-24 h-2.5 sm:h-4 bg-white/20 rounded"></div>
                  </div>
                ))
                : partners && partners.length >= 3
                  ? partners.map(partner => {
                    const getMarqueeUrl = () => {
                      if (partner.marqueeLinkUrl) {
                        const url = partner.marqueeLinkUrl.startsWith('http://') || partner.marqueeLinkUrl.startsWith('https://')
                          ? partner.marqueeLinkUrl
                          : `https://${partner.marqueeLinkUrl}`;
                        return url;
                      }

                      let url: string | null | undefined;
                      switch (partner.marqueeLinkType) {
                        case 'WEBSITE':
                          url = partner.website;
                          break;
                        case 'FACEBOOK':
                          url = partner.facebook;
                          break;
                        case 'INSTAGRAM':
                          url = partner.instagram;
                          break;
                        case 'LINKEDIN':
                          url = partner.linkedinUrl;
                          break;
                        case 'TWITTER':
                          url = partner.twitter;
                          break;
                        default:
                          url = partner.website;
                      }

                      if (!url) return null;

                      return url.startsWith('http://') || url.startsWith('https://')
                        ? url
                        : `https://${url}`;
                    };

                    const handleClick = () => {
                      const url = getMarqueeUrl();
                      if (url) {
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }
                    };

                    const marqueeUrl = getMarqueeUrl();

                    return (
                      <div
                        key={partner.id}
                        onClick={handleClick}
                        className={`flex items-center justify-center w-24 h-12 sm:w-32 sm:h-16 md:w-40 md:h-20 rounded-lg sm:rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-300 group ${marqueeUrl
                          ? 'hover:bg-white/10 cursor-pointer'
                          : 'hover:bg-white/10'
                          }`}
                      >
                        {partner.companyLogoUrl ? (
                          <div className="relative w-16 h-6 sm:w-24 sm:h-10 md:w-32 md:h-12">
                            <Image
                              src={partner.companyLogoUrl}
                              alt={
                                partner.companyName ??
                                `${partner.firstName} ${partner.lastName}`
                              }
                              fill
                              className="object-contain"
                              sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, 128px"
                            />
                          </div>
                        ) : (
                          <div className="text-white/70 group-hover:text-white transition-colors duration-300 font-bold text-[10px] sm:text-xs md:text-sm tracking-wider text-center px-1.5 sm:px-2">
                            {partner.companyName ??
                              `${partner.firstName} ${partner.lastName}`}
                          </div>
                        )}
                      </div>
                    );
                  })
                  : [
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
                      className="flex items-center justify-center w-24 h-12 sm:w-32 sm:h-16 md:w-40 md:h-20 mx-2 sm:mx-4 md:mx-6 rounded-lg sm:rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 group"
                    >
                      <div className="text-white/70 group-hover:text-white transition-colors duration-300 font-bold text-[10px] sm:text-xs md:text-sm tracking-wider">
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
