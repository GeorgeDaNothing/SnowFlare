import React from 'react';
import { motion } from 'motion/react';
import { 
  CloudUpload, 
  FileCode, 
  Video, 
  Circle, 
  ArrowRight,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AnalysisStudio() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-on-surface mb-2">Analysis Studio</h1>
        <p className="text-on-surface-variant max-w-2xl leading-relaxed">Refine your technique with AI-driven insights. Upload your session footage or record a live movement for real-time biomechanical feedback.</p>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        {/* Upload Area (Large) */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="lg:col-span-7 bg-surface-container-low rounded-xl p-10 flex flex-col items-center justify-center text-center group border-2 border-dashed border-outline-variant/30 hover:bg-surface-container transition-all duration-300 cursor-pointer"
        >
          <div className="w-20 h-20 bg-primary-fixed rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <CloudUpload className="w-10 h-10 text-primary fill-current" />
          </div>
          <h3 className="text-2xl font-semibold mb-2">Drop files here</h3>
          <p className="text-on-surface-variant mb-8 font-label text-sm tracking-wide">SUPPORTED FORMATS: MP4, MOV, HEVC (UP TO 2GB)</p>
          <button className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-3 rounded-lg font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:opacity-90 transition-opacity active:scale-95">
            <FileCode className="w-5 h-5" />
            Browse Files
          </button>
        </motion.div>

        {/* Live Record Section */}
        <div className="lg:col-span-5 bg-surface-container-high rounded-xl overflow-hidden flex flex-col border border-outline-variant/10">
          <div className="relative aspect-video bg-stone-900 flex items-center justify-center">
            <img 
              alt="Live preview frame" 
              className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale-[0.3]" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCF-MBoFQ0W2YNImYeihQ0zpBeOKyDEGxQoFliHMju-UL-2mT9mOt8Y9Pe49iEIzX9fNznZyETkMqs_zLOFU0o2ynhV9BGOVHGNbAg32bv8XEaWnQ_N2acc9Av1sCI57AvAl5iYjYQ0CMcLZkX0LwxhBdZ3W6BWYPSQ0KHhHXF2exjfPbJWvEi0IcoOQOkSE37dqqemzX_Rj80IHRXBSepoW0l2JH-b30MN64TfK1oUnp4gg4gGSL5Htrojiu1rf3JV1PqhbLqYAMk"
              referrerPolicy="no-referrer"
            />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-3 h-3 bg-error rounded-full mb-3 animate-pulse shadow-[0_0_12px_rgba(186,26,26,0.8)]"></div>
              <span className="text-white font-label text-xs tracking-widest uppercase">Live Preview Ready</span>
            </div>
            {/* Viewfinder corners */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/50"></div>
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white/50"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white/50"></div>
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/50"></div>
          </div>
          <div className="p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-lg">Record Live</h4>
                <p className="text-on-surface-variant text-sm">Direct analysis from built-in camera</p>
              </div>
              <Video className="w-6 h-6 text-on-surface-variant" />
            </div>
            <button className="bg-primary-container text-on-primary-container px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-primary hover:text-on-primary transition-colors active:scale-95">
              <Circle className="w-4 h-4 fill-current" />
              Start Simulation
            </button>
          </div>
        </div>
      </div>

      {/* Recent Uploads Section */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold">Recent Uploads</h2>
            <p className="text-on-surface-variant text-sm">Last 7 days of performance history</p>
          </div>
          <button className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
            View Library
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              title: 'Backside 360 Rotation', 
              meta: 'Yesterday • High Speed Analysis', 
              tag: '88% PRECISION', 
              time: '0:42',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMe4_qaO5fVPGnjpTMHGuPWPSC1CZ7vRQ3_IwT4kTb7721cR9I_PlDDm6EH-_4koSs115sofWRYpx6SZ3I3Z1NZO31FdZfM4Zj-X3PKb8tzyHukVUi02BdeKiq7EBARcypO0C5DmfSjNdEB9M3cjTS_O1mBg3NeaGlzwmVr9kmoMiDUEGnhk8gN0F3JjAHWH7CHncXnkQDdkJ_gPPZRkJoPxE1lKakq41mBQy6brLSKxyTjI4FakLwruKLpymp3TremAmieto45G0'
            },
            { 
              title: 'Deadlift Form Check', 
              meta: 'Oct 24 • Biomechanics Session', 
              tag: 'POSTURE ALERT', 
              time: '1:15',
              tagColor: 'bg-primary',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCiK1o0_kASDB1LcoZQulYQCuEWTh0I5zo82kd8lw9Reir3PVJzHs36IytvwkNHorV3TVXlMscrs4ViVMqXfiU1JdAaInn178vpr-G-WxJ2CH26p3JOMD_DoPq6jBu2UsFUhQrJMJoyqE7wbkv6F40M7Y85mypfsvAm9s7PN6QkRmO4nHqsu2Xs5HaZr7fn7AeW072Tf_vhR4L2DgyTvRyq8Et5mb1BbYUw4Ju_X3EXQcqq9YK6jhV5ZeJWsxI_m870P90w1iK7jBc'
            },
            { 
              title: 'Carving Efficiency Test', 
              meta: 'Oct 22 • Gear Lab Session', 
              tag: 'ELITE EDGE', 
              time: '2:08',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAO7JRYWchvJ4mUS6C4HNxYgMI7JVDLUMzXj7VQWBjUaAPo9Rj4p5Lga5EqfiO60COkmeOOrvBLZtyBwqSOTUM7yzqK5OQ_2kW22sssCQO9WNDeZwc4m1vp7n-5Fp2r8fCZw4aDZASAeijTZwcm_pkqc_JuOxosGoA3Az5SvcVSqx8tkyMFQUzeBJ2SOtdmbOuub1xPMDV7sEmxqoD-JQUYo9rWhVVeeAdN8zTXR2btMW5oTjGMOLuux1c-s3s02MEp5KbujfejuX0'
            },
            { 
              title: 'Core Tension Mapping', 
              meta: 'Oct 20 • Recovery Analysis', 
              tag: '94% CORE STABILITY', 
              time: '0:55',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfTaO0IdBmxmcppbPmCm0GvpwXMziNLeg28nx2wiVAAPB1UyVqQr1DNrjA86Ti9dUnOa5P_p6E9dbCO7vwPpD-PrxNGkH3rEArFIRKkEdkSd0NXC7K8sdd4xdQL2QAbhnN5V92T-Y-N94gcxG0NrnVHsgu8TZZPhnwocwrToZo2EO-w-8X_NZ3leiwuH79Nhb_e1_5MSgqOZyhHaoWaOZf5qO0k8sKRhFYkLiebOZfvQ7xOsphN-UxkU1zIGy7UOKZzRQSc75LiDk'
            },
          ].map((card, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -5 }}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-3 border border-outline-variant/10 shadow-sm">
                <img 
                  alt={card.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  src={card.img}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <span className={cn("text-on-tertiary text-[10px] px-2 py-0.5 rounded font-bold", card.tagColor || "bg-tertiary")}>
                    {card.tag}
                  </span>
                </div>
                <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded text-white text-[10px] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {card.time}
                </div>
              </div>
              <h5 className="font-bold text-on-surface group-hover:text-primary transition-colors">{card.title}</h5>
              <p className="text-on-surface-variant text-xs">{card.meta}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
