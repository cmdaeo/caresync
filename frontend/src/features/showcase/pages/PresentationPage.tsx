import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../shared/api/supabase';

const ROUTE_GROUPS = [
  {
    category: "Visão Geral",
    routes: [
      { path: '/', label: 'Landing Page' },
      { path: '/showcase/hardware', label: 'Hardware' },
      { path: '/showcase/software', label: 'Software' },
      { path: '/showcase/security', label: 'Security' },
      { path: '/showcase/timeline', label: 'Timeline' },
      { path: '/showcase/team', label: 'Equipa' },
    ]
  },
  {
    category: "Autenticação",
    routes: [
      { path: '/login', label: 'Login' },
      { path: '/register', label: 'Registo' },
    ]
  },
  {
    category: "App (Paciente)",
    routes: [
      { path: '/app/patient', label: 'Dashboard Paciente' },
      { path: '/app/medications', label: 'Meus Medicamentos' },
      { path: '/app/devices', label: 'Dispositivos (Box)' },
      { path: '/app/reports', label: 'Relatórios Médicos' },
    ]
  },
  {
    category: "App (Cuidador)",
    routes: [
      { path: '/app/caregiver', label: 'Dashboard Cuidador' },
    ]
  }
];

const ALL_ROUTES = ROUTE_GROUPS.flatMap(g => g.routes.map(r => r.path));
const DEMO_USERS = [{ role: 'Paciente', email: 'patient@gmail.com', pass: '123123123123' }];

function throttle(func: Function, wait: number) {
  let timeout: any = null;
  let previous = 0;
  return function(...args: any[]) {
    let now = Date.now();
    let remaining = wait - (now - previous);
    if (remaining <= 0 || remaining > wait) {
      if (timeout) { clearTimeout(timeout); timeout = null; }
      previous = now;
      func(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func(...args);
      }, remaining);
    }
  };
}

// Injeta valor no input forçando o React a reconhecer a mudança (Monkey-Patch React 18)
const setNativeReactValue = (element: HTMLInputElement, value: string) => {
  const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  
  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    element.value = value;
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));
};

export const PresentationPage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState<string>('/');
  const [isBlackout, setIsBlackout] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);
  const [laserActive, setLaserActive] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [laserPos, setLaserPos] = useState<{ x: number, y: number } | null>(null);
  const [viewers, setViewers] = useState<number>(0);
  
  // ECRÃ DE DESBLOQUEIO (Para contornar o bloqueio de vídeo autoplay dos browsers)
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  
  const csrfTokenRef = useRef<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastPathRef = useRef<string>('/');
  const lastStorageRef = useRef<string>(''); 
  const laserActiveRef = useRef<boolean>(false); 
  const pendingSyncRef = useRef<any>(null);
  
  const syncQueueRef = useRef<Map<string, any>>(new Map());
  const presentationChannelRef = useRef<any>(null);
  
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || '') + '/csrf-token', { credentials: 'include' })
      .then(res => res.json())
      .then(data => csrfTokenRef.current = data.data?.csrfToken || '')
      .catch(()=>{});
  }, []);

  useEffect(() => {
    laserActiveRef.current = laserActive;
    if (!laserActive && isAdmin) queueSyncEvent('LASER', null);
  }, [laserActive, isAdmin]);

  const queueSyncEvent = (action: string, payload: any) => {
    let key = action;
    if (action === 'MODEL_3D') key = `MODEL_3D_${payload.path.join('-')}`;
    syncQueueRef.current.set(key, { action, payload });
  };

  const fireInstantSync = (action: string, payload: any) => {
    if (presentationChannelRef.current && isAdmin) {
      presentationChannelRef.current.send({
        type: 'broadcast',
        event: 'sync',
        payload: { type: 'sync', action, payload }
      });
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    const interval = setInterval(() => {
      if (syncQueueRef.current.size > 0 && presentationChannelRef.current) {
        const batch = Array.from(syncQueueRef.current.values());
        syncQueueRef.current.clear();
        presentationChannelRef.current.send({
          type: 'broadcast',
          event: 'sync',
          payload: { type: 'batch_sync', batch }
        });
      }
    }, 150); // Acelerado de 250ms para 150ms pois WebSockets aguentam perfeitamente
    return () => clearInterval(interval);
  }, [isAdmin]);

  // --- LIGAÇÃO SUPABASE REALTIME ---
  useEffect(() => {
    const adminCheck = document.cookie.includes(`presenter_token="${import.meta.env.VITE_PRESENTER_TOKEN}"`);
    setIsAdmin(adminCheck);
    if (adminCheck) setHasInteracted(true); 

    const processEvent = (data: any) => {
      if (data.type === 'ping') return; 
      
      if (data.type === 'viewer_count') setViewers(data.count);
      
      if (data.type === 'full_sync' && data.state) {
        setIsBlackout(data.state.blackout);
        if (data.state.slide !== currentSlide) {
          setCurrentSlide(data.state.slide);
          lastPathRef.current = data.state.slide;
          pendingSyncRef.current = data.state.ephemeral;
        } else {
          pendingSyncRef.current = data.state.ephemeral;
          if (!adminCheck) applyPendingSync();
        }
      }
      
      if (data.type === 'state_sync' && data.state) {
        if (data.state.slide !== currentSlide) {
          setCurrentSlide(data.state.slide);
          lastPathRef.current = data.state.slide;
        }
        setIsBlackout(data.state.blackout);
      }
      
      if (data.type === 'batch_sync' && !adminCheck) {
        data.batch.forEach((item: any) => handleViewerSync(item.action, item.payload));
      }

      if (data.type === 'sync' && !adminCheck) {
        handleViewerSync(data.action, data.payload);
      }
    };

    // Obter o estado inicial por GET (fallback ou principal)
    fetch((import.meta.env.VITE_API_URL || '') + '/presentation/stream')
      .then(res => {
         // Nós não vamos consumir o stream SSE se não for preciso, 
         // o backend pode mandar o state inicial num fetch normal se adaptarmos, 
         // ou podemos apenas esperar pelo primeiro evento Supabase.
      }).catch(()=>{});

    const channel = supabase.channel('presentation_sync')
      .on('broadcast', { event: 'sync' }, (payload) => {
         if (payload.payload) processEvent(payload.payload);
      })
      .subscribe((status) => {
         if (status === 'SUBSCRIBED') {
             presentationChannelRef.current = channel;
         }
      });

    return () => { supabase.removeChannel(channel); presentationChannelRef.current = null; };
  }, [currentSlide]);

  useEffect(() => {
    let interval: any;
    if (timerActive) interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  const formatTime = (secs: number) => {
    return `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isAdmin) return;
    const currentIndex = ALL_ROUTES.indexOf(currentSlide);
    if (isBlackout && ['ArrowRight', 'ArrowLeft', 'Enter', 'Escape'].includes(e.key)) return changeServerState({ blackout: false });
    if (e.key === 'ArrowRight' && currentIndex < ALL_ROUTES.length - 1) changeServerState({ slide: ALL_ROUTES[currentIndex + 1] });
    else if (e.key === 'ArrowLeft' && currentIndex > 0) changeServerState({ slide: ALL_ROUTES[currentIndex - 1] });
  }, [isAdmin, currentSlide, isBlackout]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getDomPath = (node: Node | null, doc: Document) => {
    const path = [];
    while (node && node !== doc.body && node !== doc.documentElement) {
      let index = 0, sibling = node.previousSibling;
      while (sibling) { index++; sibling = sibling.previousSibling; }
      path.push(index); node = node.parentNode;
    }
    return path.reverse();
  };

  const getNodeFromPath = (path: number[], doc: Document) => {
    let node: Node = doc.body;
    for (const index of path) {
      if (node && node.childNodes[index]) node = node.childNodes[index];
      else break;
    }
    return node;
  };

  const changeServerState = (updates: { slide?: string, blackout?: boolean }) => {
    if (updates.slide) setCurrentSlide(updates.slide);
    if (updates.blackout !== undefined) setIsBlackout(updates.blackout);
    if (!csrfTokenRef.current) return;
    fetch((import.meta.env.VITE_API_URL || '') + '/presentation/slide', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfTokenRef.current },
      body: JSON.stringify(updates)
    }).catch(()=>{});
  };

  const applyPendingSync = () => {
    if (!pendingSyncRef.current) return;
    if (pendingSyncRef.current.scroll) handleViewerSync('SCROLL', pendingSyncRef.current.scroll);
    if (pendingSyncRef.current.highlight) handleViewerSync('HIGHLIGHT', pendingSyncRef.current.highlight);
    if (pendingSyncRef.current.laser) handleViewerSync('LASER', pendingSyncRef.current.laser);
    if (pendingSyncRef.current.models3D) {
      Object.values(pendingSyncRef.current.models3D).forEach(payload => handleViewerSync('MODEL_3D', payload));
    }
    pendingSyncRef.current = null;
  };

  // ─── APLICADOR DE EVENTOS NA AUDIÊNCIA ───
  const handleViewerSync = (action: string, payload: any) => {
    const win = iframeRef.current?.contentWindow as any;
    const doc = iframeRef.current?.contentDocument;
    if (!win || !doc) return;

    if (action === 'LASER') setLaserPos(payload);

    // Reproduz Clicks exatos em Botões / Navbar / Toggles (Theme)
    if (action === 'DOM_EVENT' && payload) {
      const el = getNodeFromPath(payload.path, doc) as HTMLElement;
      if (el && payload.type === 'click') {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: win }));
      }
    }

    // Preenche Inputs automaticamente para a audiência ver o login a ser escrito
    if (action === 'INPUT' && payload) {
      const el = getNodeFromPath(payload.path, doc) as HTMLInputElement;
      if (el) setNativeReactValue(el, payload.value);
    }

    // Controla vídeos e áudios
    if (action === 'MEDIA' && payload) {
      const el = getNodeFromPath(payload.path, doc) as HTMLMediaElement;
      if (el && typeof el.play === 'function') {
         if (payload.state === 'play') el.play().catch(()=>{});
         if (payload.state === 'pause') el.pause();
         if (payload.state === 'volume') { el.volume = payload.volume; el.muted = payload.muted; }
         if (payload.state === 'rate') el.playbackRate = payload.rate;
      }
    }

    if (action === 'FILE_UPLOAD_SIMULATION' && payload) {
        const el = getNodeFromPath(payload.path, doc) as HTMLElement;
        if (el) {
           const indicator = doc.createElement('div');
           indicator.innerHTML = `📎 Anexo: ${payload.name} (${Math.round(payload.size/1024)}KB)`;
           indicator.style.cssText = "position:absolute; top:-35px; right:0; background:#4f46e5; color:white; padding:6px 12px; border-radius:6px; font-size:12px; font-weight:bold; z-index:99999; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); pointer-events:none; animation: slideIn 0.3s ease-out;";
           
           if (!doc.getElementById('upload-anim-css')) {
             const style = doc.createElement('style');
             style.id = 'upload-anim-css';
             style.innerHTML = `@keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`;
             doc.head.appendChild(style);
           }

           if (el.parentElement) {
             el.parentElement.style.position = 'relative';
             el.parentElement.appendChild(indicator);
             setTimeout(() => {
               indicator.style.opacity = '0';
               indicator.style.transition = 'opacity 0.3s';
               setTimeout(() => indicator.remove(), 300);
             }, 4000);
           }
        }
    }

    if (action === 'FULLSCREEN') {
       if (payload && !document.fullscreenElement) {
         document.documentElement.requestFullscreen().catch(()=>{});
       } else if (!payload && document.fullscreenElement) {
         document.exitFullscreen().catch(()=>{});
       }
    }

    if (action === 'MODEL_3D' && payload) {
       const el = getNodeFromPath(payload.path, doc) as any;
       if (el && el.tagName.toLowerCase() === 'model-viewer') {
           el.cameraOrbit = payload.orbit;
           if (payload.target) el.cameraTarget = payload.target;
       }
    }

    if (action === 'STORAGE_SYNC' && payload) {
      try {
        if (payload.cookies) doc.cookie = payload.cookies;
        if (payload.storage) {
          const parsed = JSON.parse(payload.storage);
          Object.keys(parsed).forEach(k => win.localStorage.setItem(k, parsed[k]));
        }
      } catch (e) {}
    }

    if (action === 'SCROLL' && payload) {
      const el = getNodeFromPath(payload.path, doc) as HTMLElement;
      if (el) {
         const maxScroll = el.scrollHeight - el.clientHeight;
         el.scrollTo({ top: maxScroll * payload.percent, behavior: 'smooth' });
      }
    }

    if (action === 'HIGHLIGHT') {
      if (payload) {
        try {
          const range = doc.createRange();
          range.setStart(getNodeFromPath(payload.startPath, doc), payload.startOffset);
          range.setEnd(getNodeFromPath(payload.endPath, doc), payload.endOffset);
          if ('Highlight' in win) {
            const highlight = new win.Highlight(range);
            win.CSS.highlights.set('admin-selection', highlight);
          } else {
            const selection = win.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        } catch (e) {}
      } else {
        if ('Highlight' in win) win.CSS.highlights.clear();
        win.getSelection()?.removeAllRanges();
      }
    }
  };

  // ─── GRAVADOR DE EVENTOS DO ADMIN ───
  const handleIframeLoad = () => {
    const win = iframeRef.current?.contentWindow as any;
    const doc = iframeRef.current?.contentDocument;
    if (!win || !doc) return;

    const styleId = 'presentation-css';
    if (!doc.getElementById(styleId)) {
      const style = doc.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        ::selection { background-color: rgba(255, 235, 59, 0.6) !important; color: inherit !important; }
        ::highlight(admin-selection) { background-color: rgba(255, 235, 59, 0.6); }
      `;
      doc.head.appendChild(style);
    }

    if (!isAdmin) return applyPendingSync();

    if (!win.__eventsPatched) {
      
      setInterval(() => {
        try {
          const currentPath = win.location.pathname + win.location.search;
          if (currentPath !== lastPathRef.current && currentPath !== 'blank') {
            lastPathRef.current = currentPath;
            changeServerState({ slide: currentPath });
          }
          
          const safeCookies = doc.cookie.split(';').filter((c: string) => !c.trim().startsWith('presenter_token=')).join(';');
          const currentStorage = JSON.stringify(win.localStorage);
          const stateHash = currentStorage + safeCookies;
          
          if (stateHash !== lastStorageRef.current) {
            lastStorageRef.current = stateHash;
            queueSyncEvent('STORAGE_SYNC', { storage: currentStorage, cookies: safeCookies });
          }
        } catch (e) {}
      }, 300);

      // --- NOVO: Capturador de Cliques, Vídeo e Escrita ---
      doc.addEventListener('click', (e: MouseEvent) => {
        if (!e.isTrusted) return; // Ignorar cliques simulados pelo próprio sistema
        const target = e.target as HTMLElement;
        fireInstantSync('DOM_EVENT', { type: 'click', path: getDomPath(target, doc) });
      }, true);

      doc.addEventListener('input', (e: Event) => {
        const target = e.target as HTMLInputElement;
        queueSyncEvent('INPUT', { path: getDomPath(target, doc), value: target.value });
      }, true);

      // Média Sync
      const syncMedia = (e: Event, state: string) => fireInstantSync('MEDIA', { path: getDomPath(e.target as Node, doc), state });
      doc.addEventListener('play', (e: Event) => syncMedia(e, 'play'), true);
      doc.addEventListener('pause', (e: Event) => syncMedia(e, 'pause'), true);
      doc.addEventListener('volumechange', (e: Event) => {
          const t = e.target as HTMLMediaElement;
          fireInstantSync('MEDIA', { path: getDomPath(t, doc), state: 'volume', volume: t.volume, muted: t.muted });
      }, true);
      doc.addEventListener('ratechange', (e: Event) => {
          const t = e.target as HTMLMediaElement;
          fireInstantSync('MEDIA', { path: getDomPath(t, doc), state: 'rate', rate: t.playbackRate });
      }, true);

      // File Upload Simulation
      doc.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.type === 'file' && target.files && target.files.length > 0) {
           fireInstantSync('FILE_UPLOAD_SIMULATION', { 
               path: getDomPath(target, doc), 
               name: target.files[0].name, 
               size: target.files[0].size 
           });
        }
      }, true);

      // Scroll
      const handleScroll = throttle((e: Event) => {
        const target = e.target as HTMLElement | Document;
        const el = target === doc ? doc.documentElement : target as HTMLElement;
        const maxScroll = el.scrollHeight - el.clientHeight;
        if (maxScroll > 0) queueSyncEvent('SCROLL', { path: getDomPath(el, doc), percent: el.scrollTop / maxScroll });
      }, 100); 
      doc.addEventListener('scroll', handleScroll, true); 

      // Highlight
      const handleSelection = throttle(() => {
        const selection = win.getSelection();
        if (!selection || selection.isCollapsed) return queueSyncEvent('HIGHLIGHT', null); 
        const range = selection.getRangeAt(0);
        queueSyncEvent('HIGHLIGHT', {
           startPath: getDomPath(range.startContainer, doc), startOffset: range.startOffset,
           endPath: getDomPath(range.endContainer, doc), endOffset: range.endOffset
        });
      }, 150);
      doc.addEventListener('selectionchange', handleSelection);

      // 3D Model Interception
      doc.addEventListener('camera-change', throttle((e: any) => {
        if (e.target.tagName.toLowerCase() === 'model-viewer' && e.detail.source === 'user-interaction') {
           let orbit = e.target.getAttribute('camera-orbit');
           if (typeof e.target.getCameraOrbit === 'function') {
               const o = e.target.getCameraOrbit();
               orbit = `${o.theta}rad ${o.phi}rad ${o.radius}m`;
           }
           queueSyncEvent('MODEL_3D', { path: getDomPath(e.target, doc), orbit: orbit, target: e.target.getAttribute('camera-target') });
        }
      }, 50), true);

      // Laser
      doc.addEventListener('mousemove', throttle((e: MouseEvent) => {
        if (!laserActiveRef.current) return; 
        queueSyncEvent('LASER', { x: (e.clientX / win.innerWidth) * 100, y: (e.clientY / win.innerHeight) * 100 });
      }, 60));

      // Fullscreen
      document.addEventListener('fullscreenchange', () => {
         if (isAdmin) fireInstantSync('FULLSCREEN', !!document.fullscreenElement);
      });

      win.__eventsPatched = true;
    }
  };

  useEffect(() => { handleIframeLoad(); }, [laserActive]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-gray-900 relative flex font-sans">
      
      {/* ─── ADMIN PANEL ─── */}
      {isAdmin && (
        <div className={`absolute left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-xl border-r border-gray-200 shadow-2xl z-50 transition-transform duration-300 flex flex-col ${isPanelOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-5 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="font-bold text-gray-800 text-lg leading-tight">Director Mode</h2>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Em Direto
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    {viewers} {viewers === 1 ? 'Viewer' : 'Viewers'}
                  </span>
                </div>
              </div>
              <button onClick={() => setIsPanelOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition">✕</button>
            </div>
            
            <div className="flex items-center justify-between bg-gray-800 text-white rounded-lg p-3 shadow-inner">
              <span className="font-mono text-xl tracking-wider font-semibold">{formatTime(timer)}</span>
              <div className="flex gap-2">
                <button onClick={() => setTimerActive(!timerActive)} className="p-1.5 hover:bg-gray-700 rounded text-xs font-bold text-gray-300">{timerActive ? 'PAUSA' : 'INICIAR'}</button>
                <button onClick={() => { setTimerActive(false); setTimer(0); }} className="p-1.5 hover:bg-gray-700 rounded text-xs text-gray-400">↺</button>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-gray-200 grid grid-cols-2 gap-3 bg-white">
            <button onClick={() => changeServerState({ blackout: !isBlackout })} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${isBlackout ? 'bg-gray-900 border-gray-900 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              <span className="text-xs font-bold uppercase tracking-wide">{isBlackout ? 'Retomar' : 'Modo Foco'}</span>
            </button>
            <button onClick={() => setLaserActive(!laserActive)} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${laserActive ? 'bg-red-50 border-red-200 text-red-600 shadow-inner' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
              <span className="text-xs font-bold uppercase tracking-wide">{laserActive ? 'Laser ON' : 'Laser OFF'}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-semibold mb-2">Teclado: Setas ⬅ ➡ p/ Navegar</p>
            {ROUTE_GROUPS.map((group, idx) => (
              <div key={idx}>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 pl-1">{group.category}</h3>
                <div className="space-y-1">
                  {group.routes.map((route) => (
                    <button key={route.path} onClick={() => changeServerState({ slide: route.path })} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${currentSlide === route.path ? 'bg-blue-600 text-white shadow-md transform scale-[1.02]' : 'text-gray-600 hover:bg-gray-100'}`}>
                      {route.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            {DEMO_USERS.map((user, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 text-sm shadow-sm">
                <div className="font-semibold text-gray-800 text-xs mb-2 uppercase tracking-wide">{user.role} Demo</div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500 text-xs truncate">{user.email}</span>
                  <button onClick={() => copyToClipboard(user.email)} className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs font-bold transition">{copiedText === user.email ? '✓' : 'COPIAR'}</button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs tracking-widest">••••••••</span>
                  <button onClick={() => copyToClipboard(user.pass)} className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs font-bold transition">{copiedText === user.pass ? '✓' : 'COPIAR PW'}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && !isPanelOpen && (
        <button onClick={() => setIsPanelOpen(true)} className="absolute top-5 left-5 z-50 bg-white/90 backdrop-blur shadow-xl border border-gray-200 rounded-2xl p-3 text-gray-800 hover:scale-105 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      )}

      {/* ─── ECRÃ DE DESBLOQUEIO DE MÉDIA (Apenas Audiência) ─── */}
      {!isAdmin && !hasInteracted && (
        <div 
          className="absolute inset-0 z-[70] bg-gray-900/90 backdrop-blur-md flex flex-col items-center justify-center cursor-pointer text-white transition-opacity"
          onClick={() => setHasInteracted(true)}
        >
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
             <svg className="w-10 h-10 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-3xl font-bold mb-3 tracking-tight">Sincronização Pronta</h2>
          <p className="text-gray-400 font-medium text-lg">Clique em qualquer lado para ativar a receção de vídeo em tempo real.</p>
        </div>
      )}

      {/* Escudo Base da Audiência (após interação inicial) */}
      {!isAdmin && hasInteracted && (
        <div className="absolute inset-0 z-40 bg-transparent cursor-default pointer-events-auto" title="O apresentador está no controlo" />
      )}
      
      {!isAdmin && laserPos && (
        <div 
          className="absolute z-50 w-4 h-4 bg-red-500 rounded-full shadow-[0_0_15px_4px_rgba(239,68,68,0.7)] pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
          style={{ 
            left: `${laserPos.x}%`, 
            top: `${laserPos.y}%`, 
            transition: 'left 250ms linear, top 250ms linear'
          }}
        />
      )}

      {isBlackout && (
        <div className="absolute inset-0 z-[60] bg-gray-950 flex flex-col items-center justify-center transition-opacity duration-700">
           {isAdmin ? (
             <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-6">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-wide mb-2">Modo Foco Ativado</h1>
                <p className="text-gray-400 text-sm mb-8">A audiência está a ver um ecrã de pausa.</p>
                <button onClick={() => changeServerState({ blackout: false })} className="px-8 py-3 bg-white text-gray-900 font-bold rounded-full hover:bg-gray-200 transition-transform active:scale-95 shadow-lg">Retomar Apresentação</button>
             </div>
           ) : (
             <div className="text-center flex flex-col items-center animate-in fade-in zoom-in duration-1000">
               <svg className="w-16 h-16 text-gray-600 mb-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
               <h1 className="text-2xl font-bold text-gray-300 tracking-wide mb-2">Atenção no Orador</h1>
               <p className="text-gray-500 text-sm">A apresentação será retomada em breve...</p>
             </div>
           )}
        </div>
      )}

      <iframe ref={iframeRef} onLoad={handleIframeLoad} src={currentSlide} className="w-full h-full border-none flex-1 bg-white" title="Presentation Screen" />
    </div>
  );
};