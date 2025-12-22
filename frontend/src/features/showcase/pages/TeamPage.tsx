import { motion, Variants } from 'framer-motion';
import { Crown, Code, Target, ArrowRight } from 'lucide-react';

// --- Types ---
interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  targetContributions: string;
  group: 'leadership' | 'carebox' | 'careapp' | 'careband';
  subGroup?: 'TC' | 'ENG';
  image: string;
}

const teamMembers: TeamMember[] = [
  { id: 'francisco', name: "Francisco Luis", role: "CTO", email: "franciscoluis@ua.pt", targetContributions: "placeholder", group: 'leadership', image: "https://i.pravatar.cc/400?u=francisco" },
  { id: 'bruno', name: "Bruno Luis", role: "CMM", email: "brunosilvaluis@ua.pt", targetContributions: "placeholder", group: 'leadership', image: "https://i.pravatar.cc/400?u=bruno" },
  { id: 'adriana', name: "Adriana Pires", role: "TC", email: "adrianapires@ua.pt", targetContributions: "placeholder", group: 'carebox', subGroup: 'TC', image: "https://i.pravatar.cc/400?u=adriana" },
  { id: 'jose', name: "José Trincão", role: "TC", email: "josetrincao06@ua.pt", targetContributions: "placeholder", group: 'careapp', subGroup: 'TC', image: "https://i.pravatar.cc/400?u=jose" },
  { id: 'joao', name: "João Anjos", role: "TC", email: "joaoanjoss@ua.pt", targetContributions: "placeholder", group: 'careband', subGroup: 'TC', image: "https://i.pravatar.cc/400?u=joao" },
  { id: 'hugo', name: "Hugo Navarro", role: "ENG", email: "hugonavarro@ua.pt", targetContributions: "placeholder", group: 'careband', subGroup: 'ENG', image: "https://i.pravatar.cc/400?u=hugo" },
  { id: 'miguel', name: "Miguel Valente", role: "ENG", email: "mdvalente13@ua.pt", targetContributions: "placeholder", group: 'carebox', subGroup: 'ENG', image: "https://i.pravatar.cc/400?u=miguel" },
  { id: 'joana', name: "Joana Costa", role: "ENG", email: "joanavcosta@ua.pt", targetContributions: "placeholder", group: 'carebox', subGroup: 'ENG', image: "https://i.pravatar.cc/400?u=joana" },
  { id: 'mauricio', name: "Mauricio Tomás", role: "ENG", email: "mauriciotomas@ua.pt", targetContributions: "placeholder", group: 'carebox', subGroup: 'ENG', image: "https://i.pravatar.cc/400?u=mauricio" },
  { id: 'ivo', name: "Ivo Silva", role: "ENG", email: "ivo.m.silva@ua.pt", targetContributions: "placeholder", group: 'careapp', subGroup: 'ENG', image: "https://i.pravatar.cc/400?u=ivo" },
  { id: 'denis', name: "Denis Sukhachev", role: "ENG", email: "denis.s@ua.pt", targetContributions: "placeholder", group: 'careapp', subGroup: 'ENG', image: "https://i.pravatar.cc/400?u=denis" },
  { id: 'macedo', name: "Miguel Macedo", role: "ENG", email: "macedo.miguel@ua.pt", targetContributions: "placeholder", group: 'careapp', subGroup: 'ENG', image: "https://i.pravatar.cc/400?u=macedo" }
];

// --- Animation ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
};

// --- Sub-Components ---
const Badge = ({ group }: { group: string }) => {
  const colors = {
    carebox: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
    careapp: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    careband: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    leadership: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
  };
  const colorClass = colors[group as keyof typeof colors] || colors.leadership;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${colorClass}`}>
      {group}
    </span>
  );
};

const MinimalCard = ({ member }: { member: TeamMember }) => {
  const accentColors = {
    carebox: 'group-hover:border-orange-500/50 group-hover:shadow-orange-500/10',
    careapp: 'group-hover:border-blue-500/50 group-hover:shadow-blue-500/10',
    careband: 'group-hover:border-purple-500/50 group-hover:shadow-purple-500/10',
    leadership: 'group-hover:border-yellow-500/50 group-hover:shadow-yellow-500/10',
  };
  const accent = accentColors[member.group as keyof typeof accentColors];

  return (
    <motion.div variants={itemVariants} className="group relative">
      <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-bg-hover transition-all duration-200">
        
        <div className={`relative w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-border-subtle transition-all duration-300 ${accent}`}>
          <img 
            src={member.image} 
            alt={member.name} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-text-main truncate pr-2">{member.name}</h3>
            <span className="text-[10px] font-mono text-text-muted opacity-60 uppercase">{member.role}</span>
          </div>
          
          <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
            {member.targetContributions}
          </p>
          
          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
             <Badge group={member.group} />
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-20 right-4 h-px bg-border-subtle/50 group-last:hidden" />
    </motion.div>
  );
};

const LeadershipCard = ({ member }: { member: TeamMember }) => (
  <motion.div variants={itemVariants} className="group relative overflow-hidden rounded-2xl bg-bg-card border-2 border-border-subtle hover:border-brand-primary/50 hover:shadow-xl hover:shadow-brand-primary/5 transition-all duration-300">
    <div className="flex flex-col sm:flex-row h-full">
      <div className="w-full sm:w-2/5 aspect-square sm:aspect-auto relative overflow-hidden">
        <img 
          src={member.image} 
          alt={member.name} 
          className="w-full h-full object-cover transition-all duration-500 scale-100 group-hover:scale-105 brightness-95 group-hover:brightness-100" 
        />
        <div className="absolute inset-0 bg-linear-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <div className="w-full sm:w-3/5 p-6 flex flex-col justify-center">
        <div className="mb-4">
          <span className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-1 block">
            {member.role}
          </span>
          <h2 className="text-2xl font-bold text-text-main">{member.name}</h2>
        </div>
        
        <div className="space-y-3">
           <div className="flex items-start gap-2">
             <Target size={16} className="text-brand-primary mt-0.5 shrink-0" />
             <p className="text-sm text-text-muted leading-relaxed">
               {member.targetContributions}
             </p>
           </div>
           
           <a href={`mailto:${member.email}`} className="inline-flex items-center gap-2 text-xs font-semibold text-text-main hover:text-brand-primary transition-colors mt-2">
             Contact <ArrowRight size={12} />
           </a>
        </div>
      </div>
    </div>
  </motion.div>
);

export const TeamPage = () => {
  const leadership = teamMembers.filter(m => m.group === 'leadership');
  const engineers = teamMembers.filter(m => m.group !== 'leadership');

  return (
    <motion.div
      className="max-w-6xl mx-auto py-20 px-6 min-h-screen bg-bg-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with Animated Shimmer */}
      <div className="mb-20 max-w-2xl">
        <h4 className="text-brand-primary font-mono text-sm mb-4 font-bold tracking-wider">CARESYNC PROJECT</h4>
        <h1 className="text-5xl font-bold text-text-main tracking-tight mb-6">
          Innovating <br className="hidden md:block" />
          <motion.span
            className="bg-clip-text text-transparent inline-block bg-linear-to-r from-brand-dark via-brand-light to-brand-dark"
            style={{
              backgroundSize: '200% auto',
            }}
            animate={{
              backgroundPosition: ['0% center', '200% center'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            healthcare monitoring.
          </motion.span>
        </h1>
        <p className="text-lg text-text-muted leading-relaxed">
          A team of engineers who dared.
        </p>
      </div>

      {/* Leadership Section */}
      <div className="mb-24">
        <div className="flex items-center gap-4 mb-8 border-b-2 border-border-subtle pb-4">
           <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-600">
              <Crown size={20} />
           </div>
           <h2 className="text-xl font-bold text-text-main">Leadership</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {leadership.map(m => <LeadershipCard key={m.id} member={m} />)}
        </div>
      </div>

      {/* Engineering Grid */}
      <div>
        <div className="flex items-center gap-4 mb-8 border-b-2 border-border-subtle pb-4">
           <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Code size={20} />
           </div>
           <h2 className="text-xl font-bold text-text-main">Coordinators & Engineers</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
           <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 pl-4">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <h3 className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">CareBox</h3>
              </div>
              {engineers.filter(e => e.group === 'carebox').map(m => <MinimalCard key={m.id} member={m} />)}
           </div>

           <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 pl-4">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">CareApp</h3>
              </div>
              {engineers.filter(e => e.group === 'careapp').map(m => <MinimalCard key={m.id} member={m} />)}
           </div>

           <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 pl-4">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <h3 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">CareBand</h3>
              </div>
              {engineers.filter(e => e.group === 'careband').map(m => <MinimalCard key={m.id} member={m} />)}
           </div>
        </div>
      </div>

    </motion.div>
  );
};
