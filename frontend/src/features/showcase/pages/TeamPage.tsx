// frontend/src/features/showcase/pages/TeamPage.tsx
import { motion, Variants } from 'framer-motion'
import { Crown, Mail, Linkedin } from 'lucide-react'

// --- Types ---
interface TeamMember {
  id: string
  name: string
  role: string
  email: string
  targetContributions: string
  group: 'leadership' | 'carebox' | 'careapp' | 'careband'
  subGroup?: 'TC' | 'ENG'
  image: string
}

const teamMembers: TeamMember[] = [
  { id: 'francisco', name: "Francisco Luis", role: "CTO", email: "franciscoluis@ua.pt", targetContributions: "PLACEHOLDER", group: 'leadership', image: "https://i.pravatar.cc/400?u=francisco" },
  { id: 'bruno', name: "Bruno Luis", role: "CMM", email: "brunosilvaluis@ua.pt", targetContributions: "PLACEHOLDER", group: 'leadership', image: "https://i.pravatar.cc/400?u=bruno" },
  { id: 'adriana', name: "Adriana Pires", role: "TC", email: "adrianapires@ua.pt", targetContributions: "PLACEHOLDER", group: 'carebox', subGroup: 'TC', image: "https://i.pravatar.cc/400?u=adriana" },
  { id: 'jose', name: "José Trincão", role: "TC", email: "josetrincao06@ua.pt", targetContributions: "PLACEHOLDER", group: 'careapp', subGroup: 'TC', image: "https://i.pravatar.cc/400?u=jose" },
  { id: 'joao', name: "João Anjos", role: "TC", email: "joaoanjoss@ua.pt", targetContributions: "PLACEHOLDER", group: 'careband', subGroup: 'TC', image: "https://i.pravatar.cc/400?u=joao" },
  { id: 'hugo', name: "Hugo Navarro", role: "ENG", email: "hugonavarro@ua.pt", targetContributions: "PLACEHOLDER", group: 'careband', subGroup: 'ENG', image: "https://i.pravatar.cc/400?u=hugo" },
  { id: 'miguel', name: "Miguel Valente", role: "ENG", email: "mdvalente13@ua.pt", targetContributions: "PLACEHOLDER", group: 'carebox', subGroup: 'ENG', image: "https://i.pravatar.cc/400?u=miguel" },
  { id: 'joana', name: "Joana Costa", role: "ENG", email: "joanavcosta@ua.pt", targetContributions: "PLACEHOLDER", group: 'carebox', subGroup: 'ENG', image: "https://i.pravatar.cc/400?u=joana" },
  { id: 'mauricio', name: "Mauricio Tomás", role: "ENG", email: "mauriciotomas@ua.pt", targetContributions: "PLACEHOLDER", group: 'carebox', subGroup: 'ENG', image: "https://i.pravatar.cc/400?u=mauricio" },
  { id: 'ivo', name: "Ivo Silva", role: "ENG", email: "ivo.m.silva@ua.pt", targetContributions: "PLACEHOLDER", group: 'careapp', subGroup: 'ENG', image: "https://i.pravatar.cc/400?u=ivo" },
  { id: 'denis', name: "Denis Sukhachev", role: "ENG", email: "denis.s@ua.pt", targetContributions: "PLACEHOLDER", group: 'careapp', subGroup: 'ENG', image: "https://i.pravatar.cc/400?u=denis" },
  { id: 'macedo', name: "Miguel Macedo", role: "ENG", email: "macedo.miguel@ua.pt", targetContributions: "PLACEHOLDER", group: 'careapp', subGroup: 'ENG', image: "https://i.pravatar.cc/400?u=macedo" }
]

// --- Animation ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
}

// --- Sub-Components ---
const UnitHeader = ({ title, color }: { title: string, color: string }) => {
  const dotColors: Record<string, string> = {
    orange: 'bg-orange-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
  }
  return (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-subtle/50">
      <div className={`w-1.5 h-1.5 rounded-full ${dotColors[color]}`} />
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">{title}</h3>
    </div>
  )
}

const MinimalCard = ({ member }: { member: TeamMember }) => {
  return (
    <motion.div variants={itemVariants} className="group">
      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-bg-card/50 border border-border-subtle/50 hover:bg-bg-card hover:border-border-focus transition-all duration-300">
        
        <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border-subtle/50 group-hover:border-brand-primary/30 transition-colors">
          <img 
            src={member.image} 
            alt={member.name} 
            className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-300"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-text-main truncate group-hover:text-brand-primary transition-colors">{member.name}</h3>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
             <span className="text-[10px] font-mono font-medium text-text-muted uppercase tracking-wide">{member.role}</span>
             <span className="text-[10px] text-border-focus">•</span>
             <span className="text-[10px] text-text-muted/70 truncate">{member.targetContributions}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const LeadershipCard = ({ member }: { member: TeamMember }) => (
  <motion.div variants={itemVariants} className="p-4 rounded-xl bg-linear-to-br from-bg-card to-bg-card/50 border border-border-subtle hover:border-yellow-500/30 transition-all duration-300">
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-yellow-500/10 group-hover:border-yellow-500/30">
        <img 
          src={member.image} 
          alt={member.name} 
          className="w-full h-full object-cover" 
        />
      </div>
      
      <div className="flex-1 min-w-0">
         <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-widest">
              {member.role}
            </span>
         </div>
         <h2 className="text-sm font-bold text-text-main truncate">{member.name}</h2>
         <p className="text-[10px] text-text-muted mt-1">{member.targetContributions}</p>
         
         <div className="flex gap-3 mt-3 opacity-60 hover:opacity-100 transition-opacity">
            <a href={`mailto:${member.email}`} className="text-text-muted hover:text-text-main"><Mail size={12} /></a>
            <Linkedin size={12} className="text-text-muted hover:text-text-main cursor-pointer" />
         </div>
      </div>
    </div>
  </motion.div>
)

export const TeamPage = () => {
  const leadership = teamMembers.filter(m => m.group === 'leadership')
  const carebox = teamMembers.filter(m => m.group === 'carebox')
  const careapp = teamMembers.filter(m => m.group === 'careapp')
  const careband = teamMembers.filter(m => m.group === 'careband')

  return (
    <div className="h-full flex flex-col bg-bg-page px-6 py-6 overflow-hidden relative">
       <div className="max-w-7xl mx-auto w-full h-full flex flex-col min-h-0">
          
          {/* Header */}
          <div className="shrink-0 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-subtle pb-4">
            <div>
                <h1 className="text-3xl font-bold text-text-main tracking-tight mb-2">
                    CareSync Team
                </h1>
                <p className="text-sm text-text-muted max-w-lg leading-relaxed">
                    Engineering excellence driven by a passion for healthcare innovation.
                </p>
            </div>
          </div>

          {/* Main Content - Simplified Grid */}
          <motion.div 
            className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
             <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 pb-8">
                
                {/* Leadership Column */}
                <div className="xl:col-span-1 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Crown size={16} className="text-yellow-500" />
                        <h3 className="text-xs font-bold text-text-main uppercase tracking-wider">Project Leads</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
                        {leadership.map(m => <LeadershipCard key={m.id} member={m} />)}
                    </div>
                </div>

                {/* Engineering Columns */}
                <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Unit 1 */}
                    <div className="space-y-3">
                        <UnitHeader title="CareBox Unit" color="orange" />
                        <div className="flex flex-col gap-2">
                            {carebox.map(m => <MinimalCard key={m.id} member={m} />)}
                        </div>
                    </div>

                    {/* Unit 2 */}
                    <div className="space-y-3">
                        <UnitHeader title="CareApp Unit" color="blue" />
                        <div className="flex flex-col gap-2">
                            {careapp.map(m => <MinimalCard key={m.id} member={m} />)}
                        </div>
                    </div>

                    {/* Unit 3 */}
                    <div className="space-y-3">
                        <UnitHeader title="CareBand Unit" color="purple" />
                        <div className="flex flex-col gap-2">
                            {careband.map(m => <MinimalCard key={m.id} member={m} />)}
                        </div>
                    </div>

                </div>
             </div>
          </motion.div>

       </div>
    </div>
  )
}
