// frontend/src/features/showcase/pages/ReviewsPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';  // ← NEW
import { client } from '../../../shared/api/client';
import { 
  Star, 
  Quote, 
  Stethoscope, 
  User, 
  Heart, 
  Send,
  CheckCircle2,
  Activity,
  Loader2,
  AlertCircle,
  QrCode,   // ← NEW
  X         // ← NEW
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';


/* ════════════════════════════════════════════════════════════════
   DATA & TYPES
════════════════════════════════════════════════════════════════ */
type ReviewType = 'clinical' | 'patient' | 'caregiver';


interface Review {
  id: string;
  name: string;
  role: string;
  type: ReviewType;
  rating: number;
  createdAt: string; 
  content: string;
}


/* ════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
════════════════════════════════════════════════════════════════ */
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};


const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};


/* ════════════════════════════════════════════════════════════════
   QR CODE MODAL  ← NEW COMPONENT
════════════════════════════════════════════════════════════════ */
const QRModal = ({ url, onClose }: { url: string; onClose: () => void }) => (
  <AnimatePresence>
    <motion.div
      key="qr-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        key="qr-card"
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 22 } }}
        exit={{ opacity: 0, scale: 0.85, y: 20 }}
        className="relative flex flex-col items-center gap-6 bg-bg-card border border-border-subtle rounded-2xl p-10 shadow-2xl max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-bg-hover transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center">
          <h3 className="text-lg font-bold text-text-main">Scan to Leave a Review</h3>
          <p className="text-xs text-text-muted mt-1">Point your camera at the QR code</p>
        </div>

        {/* QR Code */}
        <div className="p-4 bg-white rounded-xl shadow-lg">
          <QRCodeSVG
            value={url}
            size={220}
            bgColor="#ffffff"
            fgColor="#0d0d0d"
            level="M"
            includeMargin={false}
          />
        </div>

        {/* URL hint */}
        <p className="text-[10px] font-mono text-text-muted/60 text-center break-all max-w-[240px]">
          {url}
        </p>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);


/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
════════════════════════════════════════════════════════════════ */
const getTypeConfig = (type: ReviewType) => {
  switch (type) {
    case 'clinical': return { icon: Stethoscope, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    case 'patient': return { icon: User, color: 'text-brand-primary', bg: 'bg-brand-primary/10', border: 'border-brand-primary/20' };
    case 'caregiver': return { icon: Heart, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
    default: return { icon: User, color: 'text-brand-primary', bg: 'bg-brand-primary/10', border: 'border-brand-primary/20' };
  }
};


const ReviewCard = ({ review }: { review: Review }) => {
  const config = getTypeConfig(review.type);
  const Icon = config.icon;


  const displayDate = new Date(review.createdAt).toLocaleDateString('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric' 
  });


  return (
    <motion.div variants={fadeUp} className="flex flex-col h-full p-6 rounded-xl border border-border-subtle bg-bg-card/40 hover:border-border-focus hover:bg-bg-card transition-all duration-300 relative group overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 ${config.bg} blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none rounded-full transform translate-x-1/2 -translate-y-1/2`} />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${config.bg} ${config.border} ${config.color}`}>
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-text-main truncate max-w-[120px] sm:max-w-[150px]">{review.name}</h4>
            <p className="text-[11px] text-text-muted mt-0.5 truncate max-w-[120px] sm:max-w-[150px]">{review.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={12} className={i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-border-subtle"} />
          ))}
        </div>
      </div>
      
      <div className="flex-1 relative z-10">
        <Quote size={16} className="text-border-subtle mb-2 transform -scale-x-100" />
        <p className="text-sm text-text-muted leading-relaxed italic">"{review.content}"</p>
      </div>


      <div className="mt-4 pt-4 border-t border-border-subtle/50 flex justify-between items-center relative z-10">
        <span className={`text-[10px] uppercase tracking-widest font-bold ${config.color}`}>
          {review.type} Feedback
        </span>
        <span className="text-[10px] font-mono text-text-muted/60">{displayDate}</span>
      </div>
    </motion.div>
  );
};


const StatCard = ({ icon: Icon, value, label, sub }: any) => (
  <motion.div variants={fadeUp} className="p-5 rounded-xl border border-border-subtle bg-bg-card/40 flex items-center gap-4">
    <div className="p-3 rounded-xl bg-brand-primary/10 text-brand-primary">
      <Icon size={24} />
    </div>
    <div>
      <div className="text-2xl font-bold text-text-main font-mono">{value}</div>
      <div className="text-xs font-bold text-text-muted uppercase tracking-wider">{label}</div>
      {sub && <div className="text-[10px] text-text-muted/70 mt-0.5">{sub}</div>}
    </div>
  </motion.div>
);


/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════ */
export const ReviewsPage = () => {
  const { theme: _theme } = useTheme();
  
  // State
  const [filter, setFilter] = useState<ReviewType | 'all'>('all');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);  // ← NEW

  // Derive the canonical reviews URL for the QR code  ← NEW
  const reviewsUrl = `${window.location.origin}/reviews`;

  // Form State
  const [formData, setFormData] = useState({ name: '', role: '', type: 'patient' as ReviewType, content: '', rating: 5 });
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);


  // Fetch real database reviews on mount
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await client.get('/reviews');
        if (res.data?.data?.reviews && Array.isArray(res.data.data.reviews)) {
          setReviews(res.data.data.reviews);
        }
      } catch (err) {
        console.error("Failed to load DB reviews", err);
      } finally {
        setDbLoading(false);
      }
    };
    fetchReviews();
  }, []);


  // Filtered list
  const filteredReviews = filter === 'all' ? reviews : reviews.filter(r => r.type === filter);


  // Dynamically calculate stats based strictly on real DB records
  const stats = useMemo(() => {
    const total = reviews.length;
    const avgRating = total > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1) : '0.0';
    const clinicalCount = reviews.filter(r => r.type === 'clinical').length;


    return { total, avgRating, clinicalCount };
  }, [reviews]);


  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);


    try {
      const res = await client.post('/reviews', formData);
      if (res.data?.data?.review) {
        setReviews([res.data.data.review, ...reviews]);
        setSubmitSuccess(true);
        setFormData({ name: '', role: '', type: 'patient', content: '', rating: 5 });
        
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 5000);
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="relative h-full w-full overflow-y-auto tsc bg-bg-page px-4 py-12 sm:px-8 lg:px-16 overflow-x-hidden">

      {/* QR Modal  ← NEW */}
      {showQR && <QRModal url={reviewsUrl} onClose={() => setShowQR(false)} />}

      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-primary/[0.03] rounded-full blur-[120px]" />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-4xl mx-auto mb-16 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-text-main tracking-tight mb-5 leading-tight">
          Project Reviews
        </h1>
        <p className="text-sm sm:text-base text-text-muted max-w-2xl mx-auto leading-relaxed">
          What do you think about our project? Leave us a message!
        </p>

        {/* QR Code button  ← NEW */}
        <button
          onClick={() => setShowQR(true)}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border-subtle bg-bg-card/50 text-text-muted hover:text-text-main hover:border-border-focus hover:bg-bg-card text-xs font-bold uppercase tracking-wider transition-all"
        >
          <QrCode size={14} />
          Share via QR
        </button>
      </motion.div>


      <div className="relative z-10 max-w-6xl mx-auto space-y-16">


        {/* Real Dynamic Stats Row */}
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={Activity} value={stats.total.toString()} label="Total Feedback" sub="Verified submissions" />
          <StatCard icon={Star} value={`${stats.avgRating}/5`} label="Global Rating" sub="Average user satisfaction" />
          <StatCard icon={Stethoscope} value={stats.clinicalCount.toString()} label="Clinical Endorsements" sub="From healthcare professionals" />
        </motion.div>


        {/* Reviews Section */}
        <section>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-border-subtle pb-4">
            <div>
              <h2 className="text-2xl font-bold text-text-main">Community Feedback</h2>
              <p className="text-xs text-text-muted mt-1">Filter by perspective</p>
            </div>
            
            <div className="flex items-center gap-2 bg-bg-card/50 p-1 rounded-lg border border-border-subtle flex-wrap sm:flex-nowrap">
              {(['all', 'clinical', 'patient', 'caregiver'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
                    filter === f 
                      ? 'bg-brand-primary text-white shadow-md' 
                      : 'text-text-muted hover:text-text-main hover:bg-bg-hover'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>


          {dbLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-brand-primary w-8 h-8" />
            </div>
          ) : (
            <motion.div 
              variants={staggerContainer} 
              initial="hidden" 
              animate="show" 
              key={filter} 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredReviews.length === 0 ? (
                <div className="col-span-full py-12 text-center text-text-muted border border-dashed border-border-subtle rounded-xl">
                  No verified reviews found for this category yet.
                </div>
              ) : (
                filteredReviews.map(review => (
                  <ReviewCard key={review.id} review={review} />
                ))
              )}
            </motion.div>
          )}
        </section>


        {/* Submit Review Form */}
        <section className="pt-8 border-t border-border-subtle">
          <div className="max-w-3xl mx-auto bg-bg-card/30 border border-border-subtle p-6 sm:p-10 rounded-2xl relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-primary/5 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="text-center mb-8 relative z-10">
              <h2 className="text-2xl font-bold text-text-main mb-2">Review</h2>
              <p className="text-sm text-text-muted">Help us improve our project!</p>
            </div>


            <AnimatePresence mode="wait">
              {submitSuccess ? (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-10 text-center relative z-10"
                >
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-text-main mb-2">Feedback Received</h3>
                  <p className="text-sm text-text-muted">Thank you for helping us build a better healthcare tool.</p>
                </motion.div>
              ) : (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleFormSubmit} 
                  className="space-y-5 relative z-10"
                >
                  {submitError && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg">
                      <AlertCircle size={16} />
                      {submitError}
                    </div>
                  )}


                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider pl-1">Full Name</label>
                      <input 
                        required type="text" 
                        value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. Maria Oliveira" 
                        className="w-full bg-bg-page border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider pl-1">Your Title / Demographic</label>
                      <input 
                        required type="text" 
                        value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}
                        placeholder="e.g. Patient (72yo), Neurologist..." 
                        className="w-full bg-bg-page border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all" 
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider pl-1">Perspective Category</label>
                      <select 
                        required 
                        value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as ReviewType})}
                        className="w-full bg-bg-page border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all appearance-none cursor-pointer"
                      >
                        <option value="patient">Patient Experience</option>
                        <option value="caregiver">Family / Caregiver</option>
                        <option value="clinical">Clinical / Healthcare Professional</option>
                      </select>
                    </div>


                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider pl-1">Overall Rating</label>
                      <div className="flex items-center justify-between bg-bg-page border border-border-subtle rounded-lg px-4 py-2 h-[42px]">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setFormData({ ...formData, rating: star })}
                              onMouseEnter={() => setHoveredStar(star)}
                              onMouseLeave={() => setHoveredStar(null)}
                              className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                            >
                              <Star 
                                size={18} 
                                className={
                                  star <= (hoveredStar ?? formData.rating) 
                                    ? "text-yellow-500 fill-yellow-500 transition-colors" 
                                    : "text-border-subtle transition-colors"
                                } 
                              />
                            </button>
                          ))}
                        </div>
                        <span className="text-xs font-mono font-bold text-brand-primary">
                          {hoveredStar ?? formData.rating}.0
                        </span>
                      </div>
                    </div>
                  </div>


                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider pl-1">Experience Overview</label>
                    <textarea 
                      required rows={4} 
                      value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})}
                      placeholder="What do you think about our project?" 
                      className="w-full bg-bg-page border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-main focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all custom-scrollbar resize-none" 
                    />
                  </div>


                  <div className="pt-2 flex justify-end">
                    <button disabled={isSubmitting} type="submit" className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-light hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all">
                      {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Submit Feedback'}
                      {!isSubmitting && <Send size={14} />}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>


          </div>
        </section>


      </div>
    </div>
  );
};