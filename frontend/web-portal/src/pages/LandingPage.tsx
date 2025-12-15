import { motion, useInView, LazyMotion, domAnimation } from 'framer-motion';
import { ArrowRight, Activity, DollarSign, AlertTriangle, Shield, Smartphone, Watch, Box, ChevronDown, Mail } from 'lucide-react';
import { useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { slideIn } from '../animations';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Import i18n hook

// --- COLOR PALETTE REFERENCE ---
// --blue-bell: #4AA4E1
// --fresh-sky: #54B4F0
// --baltic-blue: #285D91
// --baltic-blue-2: #245985
// --blue-bell-2: #4795D1
// --baltic-blue-3: #29619A

// Type definitions
interface StatCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  desc: string;
  color: 'red' | 'green' | 'orange';
  delay: number;
}

interface ProductCardProps {
  icon: LucideIcon;
  name: string;
  tagline: string;
  features: string[];
  gradient: string;
  delay: number;
}

interface TeamMember {
  name: string;
  role: string;
  email: string;
  description: string;
}

// Performance-optimized StatCard component
const StatCard = ({ icon: Icon, value, label, desc, color, delay }: StatCardProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  const colorClasses: Record<'red' | 'green' | 'orange', string> = {
    red: "from-red-500 to-rose-500",
    green: "from-green-500 to-emerald-500",
    orange: "from-orange-500 to-amber-500"
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, delay }
      } : {}}
      whileHover={{
        y: -8,
        boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.1)",
        transition: { duration: 0.3, delay: 0 }
      }}
      className="p-8 bg-white rounded-3xl border border-gray-100 shadow-lg transition-all"
    >
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
        className={`w-16 h-16 bg-gradient-to-br ${colorClasses[color]} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
      >
        <Icon className="h-8 w-8 text-white" />
      </motion.div>

      <motion.div
        initial={{ scale: 0 }}
        animate={isInView ? {
          scale: 1,
          transition: { duration: 0.5, delay: delay + 0.3, type: "spring" }
        } : {}}
        className="text-5xl font-extrabold text-gray-900 mb-2"
      >
        {value}
      </motion.div>

      <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        {label}
      </div>
      <p className="text-gray-600 leading-relaxed">{desc}</p>
    </motion.div>
  );
};

// Performance-optimized ProductCard component
const ProductCard = ({ icon: Icon, name, tagline, features, gradient, delay }: ProductCardProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const navigate = useNavigate();
  const { t } = useTranslation(); // Hook for translations inside child component

  const handleView3D = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/products/${name.toLowerCase()}`);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, delay }
      } : {}}
      whileHover={{
        y: -10,
        transition: { duration: 0.2, delay: 0 }
      }}
      className="group relative p-8 bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl transition-all overflow-hidden"
    >

      <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 transition-transform`}>
        <Icon className="w-8 h-8 text-white" />
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
      <p className="text-gray-600 mb-6">{tagline}</p>

      <ul className="space-y-3">
        {features.map((feature: string, i: number) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? {
              opacity: 1,
              x: 0,
              transition: { duration: 0.4, delay: delay + 0.1 * i }
            } : {}}
            className="flex items-center text-gray-700"
          >
            <Shield className="w-5 h-5 text-[#285D91] mr-3 flex-shrink-0" />
            {feature}
          </motion.li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <motion.button
          whileHover={{
            x: 5,
            transition: { duration: 0.2, delay: 0 }
          }}
          onClick={handleView3D}
          className="inline-flex items-center text-[#285D91] font-semibold cursor-pointer"
        >
          {t('landing.products.view_3d')} <ArrowRight className="ml-2 w-4 h-4" />
        </motion.button>

        <motion.div
          whileHover={{
            x: 5,
            transition: { duration: 0.2, delay: 0 }
          }}
          className="inline-flex items-center text-[#285D91] font-semibold cursor-pointer"
        >
          {t('landing.products.learn_more')} <ArrowRight className="ml-2 w-4 h-4" />
        </motion.div>
      </div>
    </motion.div>
  );
};

// Performance-optimized TeamCard component
const TeamCard = ({ member, delay }: { member: TeamMember; delay: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.2,
          delay: delay
        }
      } : {}}

      whileHover={{
        y: -5,
        boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.15)",
        transition: { duration: 0.2, delay: 0 }
      }}

      className="p-6 bg-white rounded-2xl border border-gray-100 shadow-md transition-all"
    >
      <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
      <div className="text-sm font-semibold text-[#4AA4E1] mb-3">{member.role}</div>
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{member.description}</p>
      <a
        href={`mailto:${member.email}`}
        className="inline-flex items-center text-sm text-gray-500 hover:text-[#285D91] transition-colors"
      >
        <Mail className="w-4 h-4 mr-2" />
        {member.email}
      </a>
    </motion.div>
  );
};

const LandingPage = () => {
  const { t } = useTranslation();

  // --- DYNAMIC DATA INSIDE COMPONENT ---
  const statsData = [
    { 
      icon: Activity, 
      value: "50%", 
      label: t('landing.stats.adherence_rate'), 
      desc: t('landing.stats.adherence_desc'), 
      color: "red" as const, 
      delay: 0 
    },
    { 
      icon: DollarSign, 
      value: "$300B", 
      label: t('landing.stats.annual_cost'), 
      desc: t('landing.stats.annual_cost_desc'), 
      color: "green" as const, 
      delay: 0.2 
    },
    { 
      icon: AlertTriangle, 
      value: "125K", 
      label: t('landing.stats.annual_deaths'), 
      desc: t('landing.stats.annual_deaths_desc'), 
      color: "orange" as const, 
      delay: 0.4 
    }
  ];

  const productsData = [
    {
      icon: Box,
      name: "CareBox",
      tagline: t('landing.products.carebox_tagline'),
      features: t('landing.products.carebox_features', { returnObjects: true }) as string[],
      gradient: "from-[#285D91] to-[#54B4F0]"
    },
    {
      icon: Watch,
      name: "CareBand",
      tagline: t('landing.products.careband_tagline'),
      features: t('landing.products.careband_features', { returnObjects: true }) as string[],
      gradient: "from-[#245985] to-[#4AA4E1]"
    },
    {
      icon: Smartphone,
      name: "CareApp",
      tagline: t('landing.products.careapp_tagline'),
      features: t('landing.products.careapp_features', { returnObjects: true }) as string[],
      gradient: "from-[#29619A] to-[#4795D1]"
    }
  ];

  const teamMembers: TeamMember[] = [
    { name: "Francisco Luis", role: t('landing.team.roles.cto'), email: "franciscoluis@ua.pt", description: t('landing.team.descriptions.francisco') },
    { name: "Bruno Luis", role: t('landing.team.roles.cmm'), email: "brunosilvaluis@ua.pt", description: t('landing.team.descriptions.bruno') },
    { name: "Adriana Pires", role: `${t('landing.team.roles.tc')} (CareBox)`, email: "adrianapires@ua.pt", description: t('landing.team.descriptions.adriana') },
    { name: "José Trincão", role: `${t('landing.team.roles.tc')} (CareApp)`, email: "josetrincao06@ua.pt", description: t('landing.team.descriptions.jose') },
    { name: "João Anjos", role: `${t('landing.team.roles.tc')} (CareBand)`, email: "joaoanjoss@ua.pt", description: t('landing.team.descriptions.joao') },
    { name: "Hugo Navarro", role: `${t('landing.team.roles.eng')} (CareBand)`, email: "hugonavarro@ua.pt", description: t('landing.team.descriptions.hugo') },
    { name: "Miguel Valente", role: `${t('landing.team.roles.eng')} (CareBox)`, email: "mdvalente13@ua.pt", description: t('landing.team.descriptions.miguel_v') },
    { name: "Joana Costa", role: `${t('landing.team.roles.eng')} (CareBox)`, email: "joanavcosta@ua.pt", description: t('landing.team.descriptions.joana') },
    { name: "Mauricio Tomás", role: `${t('landing.team.roles.eng')} (CareBox)`, email: "mauriciotomas@ua.pt", description: t('landing.team.descriptions.mauricio') },
    { name: "Ivo Silva", role: `${t('landing.team.roles.eng')} (CareApp)`, email: "ivo.m.silva@ua.pt", description: t('landing.team.descriptions.ivo') },
    { name: "Denis Sukhachev", role: `${t('landing.team.roles.eng')} (CareApp)`, email: "denis.s@ua.pt", description: t('landing.team.descriptions.denis') },
    { name: "Miguel Macedo", role: `${t('landing.team.roles.eng')} (CareApp)`, email: "macedo.miguel@ua.pt", description: t('landing.team.descriptions.miguel_m') }
  ];

  // Performance-optimized smooth scroll handler with requestAnimationFrame
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.querySelector(targetId);
    if (element) {
      const start = window.pageYOffset;
      const end = element.getBoundingClientRect().top + window.pageYOffset - 80;
      const distance = end - start;
      let startTime: number | null = null;

      const animation = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / 500, 1);
        window.scrollTo(0, start + distance * easeInOutQuad(progress));
        if (progress < 1) requestAnimationFrame(animation);
      };

      requestAnimationFrame(animation);
    }
  };

  // Optimized easing function
  const easeInOutQuad = (t: number) => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  };

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white font-sans text-gray-900 overflow-x-hidden">

        {/* --- PERFORMANCE-OPTIMIZED HEADER --- */}
        <motion.nav
          initial="hidden"
          animate="visible"
          variants={slideIn}
          className="fixed w-full bg-white/80 backdrop-blur-xl shadow-sm z-50 border-b border-gray-100"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-3"
              >
                <img
                  src="/caresync.svg"
                  alt="CareSync Logo"
                  className="w-12 h-12 object-contain rounded-xl"
                  loading="lazy"
                />
                <span className="text-2xl font-bold bg-gradient-to-r from-[#285D91] to-[#54B4F0] bg-clip-text text-transparent">
                  CareSync
                </span>
              </motion.div>

              <div className="hidden md:flex space-x-8 items-center">
                {['Impact', 'Products', 'Team', 'About'].map((item, i) => (
                  <motion.a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    onClick={(e) => handleSmoothScroll(e, `#${item.toLowerCase()}`)}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 + 0.3 }}
                    whileHover={{ y: -2 }}
                    className="text-gray-600 hover:text-[#285D91] font-medium transition-colors relative group"
                  >
                    {/* Translate menu items manually or add keys for them later */}
                    {item}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#285D91] transition-all group-hover:w-full" />
                  </motion.a>
                ))}
                <motion.a
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 30px -10px rgba(84, 180, 240, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  href="/dashboard"
                  className="bg-gradient-to-r from-[#285D91] to-[#54B4F0] text-white px-6 py-2.5 rounded-full font-medium shadow-lg shadow-[#54B4F0]/30 transition-all"
                >
                  {/* Reuse dashboard key or add new key */}
                  Open Dashboard
                </motion.a>
              </div>
            </div>
          </div>
        </motion.nav>

        {/* --- PERFORMANCE-OPTIMIZED HERO SECTION --- */}
        <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-40 text-center px-4 overflow-hidden">
          {/* Simplified background - removed heavy animations */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4AA4E1] rounded-full blur-3xl opacity-10" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#54B4F0] rounded-full blur-3xl opacity-10" />
          </div>

          <div className="relative z-10">
            <div className="inline-block mb-6">
              <div className="bg-[#4AA4E1]/10 text-[#285D91] px-6 py-2 rounded-full text-sm font-semibold border border-[#4AA4E1]/20 shadow-sm">
                🏥 {t('landing.hero.badge')}
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight">
              {t('landing.hero.title_start')}{' '}
              <span className="bg-gradient-to-r from-[#285D91] to-[#54B4F0] bg-clip-text text-transparent">
                {t('landing.hero.title_end')}
              </span>
            </h1>

            <p className="mt-6 text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('landing.hero.subtitle')}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.a
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(40, 93, 145, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                href="#products"
                onClick={(e) => handleSmoothScroll(e, '#products')}
                className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-2xl text-white bg-gradient-to-r from-[#285D91] to-[#54B4F0] shadow-xl shadow-[#54B4F0]/30 transition-all"
              >
                {t('landing.hero.cta_explore')} <ArrowRight className="ml-2 h-5 w-5" />
              </motion.a>

              <motion.a
                whileHover={{ scale: 1.05, borderColor: "#285D91" }}
                whileTap={{ scale: 0.95 }}
                href="#contact"
                onClick={(e) => handleSmoothScroll(e, '#contact')}
                className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-2xl text-[#285D91] bg-white border-2 border-gray-200 hover:border-[#285D91] transition-all shadow-lg"
              >
                {t('landing.hero.cta_demo')}
              </motion.a>
            </div>
          </div>

          {/* Simplified scroll indicator */}
          <div
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 cursor-pointer animate-bounce"
            onClick={(e) => handleSmoothScroll(e as any, '#impact')}
          >
            <ChevronDown className="w-8 h-8 text-gray-400" />
          </div>
        </section>

        {/* --- PERFORMANCE-OPTIMIZED STATS SECTION --- */}
        <section id="impact" className="py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {t('landing.stats.title')}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {t('landing.stats.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {statsData.map((stat, i) => (
                <StatCard key={i} {...stat} />
              ))}
            </div>
          </div>
        </section>

        {/* --- PERFORMANCE-OPTIMIZED PRODUCTS SECTION --- */}
        <section id="products" className="py-24 bg-white scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {t('landing.products.title')}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {t('landing.products.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {productsData.map((product, i) => (
                <ProductCard key={i} {...product} delay={i * 0.2} />
              ))}
            </div>
          </div>
        </section>

        {/* --- PERFORMANCE-OPTIMIZED TEAM SECTION --- */}
        <section id="team" className="py-24 bg-gradient-to-b from-gray-50 to-white scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {t('landing.team.title')}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {t('landing.team.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembers.map((member, i) => (
                <TeamCard key={i} member={member} delay={i * 0.1} />
              ))}
            </div>
          </div>
        </section>

        {/* --- PERFORMANCE-OPTIMIZED ABOUT SECTION --- */}
        <section id="about" className="py-24 bg-white scroll-mt-20">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                {t('landing.about.title')}
              </h2>
              <div className="text-lg text-gray-600 space-y-4 text-left">
                <p>
                  {t('landing.about.p1')} <span className="font-semibold text-gray-900">University of Aveiro</span>.
                </p>
                <p>
                  {t('landing.about.p2')}
                </p>
                <p>
                  {t('landing.about.p3')}
                </p>
                <p className="text-center text-[#285D91] font-semibold pt-4">
                  📅 {t('landing.about.timeline')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- PERFORMANCE-OPTIMIZED CONTACT SECTION --- */}
        <section id="contact" className="py-24 bg-gradient-to-b from-gray-50 to-white scroll-mt-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                {t('landing.contact.title')}
              </h2>
              <p className="text-xl text-gray-600 mb-10">
                {t('landing.contact.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="mailto:franciscoluis@ua.pt"
                  className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-2xl text-white bg-gradient-to-r from-[#285D91] to-[#54B4F0] shadow-xl shadow-[#54B4F0]/30 transition-all"
                >
                  <Mail className="mr-2 h-5 w-5" />
                  {t('landing.contact.cta_demo') || "Schedule Demo"}
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="mailto:brunosilvaluis@ua.pt"
                  className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-2xl text-[#285D91] bg-white border-2 border-gray-200 hover:border-[#285D91] transition-all shadow-lg"
                >
                  <Mail className="mr-2 h-5 w-5" />
                  {t('landing.contact.partnership')}
                </motion.a>
              </div>
            </div>
          </div>
        </section>

        {/* --- PERFORMANCE-OPTIMIZED FOOTER --- */}
        <footer className="bg-gradient-to-b from-gray-50 to-gray-100 border-t border-gray-200 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-3 mb-4 md:mb-0">
                <img
                  src="/caresync.svg"
                  alt="CareSync Logo"
                  className="w-10 h-10 object-contain rounded-lg"
                  loading="lazy"
                />
                <span className="text-xl font-bold text-gray-900">CareSync</span>
              </div>
              <p className="text-gray-600">
                {t('landing.footer.copyright')}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </LazyMotion>
  );
};

export default LandingPage;
