const express = require('express');
const router = express.Router();
const { kv } = require('@vercel/kv');
const EventEmitter = require('events');

const presentationEvents = new EventEmitter();
presentationEvents.setMaxListeners(500);

let localState = {
  slide: '/',
  blackout: false,
  ephemeral: {
    scroll: null,
    highlight: null,
    laser: null,
    models3D: {} 
  }
};

let activeViewers = 0;

async function getPresentationState() {
  try {
    if (process.env.KV_REST_API_URL) {
      const state = await kv.get('presentation_state');
      return { ...(state || { slide: '/', blackout: false }), ephemeral: localState.ephemeral };
    }
    return localState;
  } catch (error) { return localState; }
}

async function updatePresentationState(updates) {
  localState = { ...localState, ...updates };
  if (process.env.KV_REST_API_URL) {
    try { await kv.set('presentation_state', { slide: localState.slide, blackout: localState.blackout }); } catch (e) {}
  }
  return localState;
}

// GET: SSE Stream (Tempo Real)
router.get('/stream', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive'
  });

  const cookies = req.headers.cookie || '';
  const isAdmin = cookies.includes('presenter_token="PEEBestProject=CareSync@26"');

  if (!isAdmin) {
    activeViewers++;
    presentationEvents.emit('viewer_count', activeViewers); 
  }

  const initialState = await getPresentationState();
  res.write(`data: ${JSON.stringify({ type: 'full_sync', state: initialState })}\n\n`);
  res.write(`data: ${JSON.stringify({ type: 'viewer_count', count: activeViewers })}\n\n`);
  if (typeof res.flush === 'function') res.flush();

  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
    if (typeof res.flush === 'function') res.flush();
  }, 15000);

  const sendUpdate = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    if (typeof res.flush === 'function') res.flush();
  };

  const sendViewerCount = (count) => {
    res.write(`data: ${JSON.stringify({ type: 'viewer_count', count })}\n\n`);
    if (typeof res.flush === 'function') res.flush();
  };

  presentationEvents.on('update', sendUpdate);
  presentationEvents.on('viewer_count', sendViewerCount);
  
  req.on('close', () => {
    clearInterval(heartbeat);
    presentationEvents.off('update', sendUpdate);
    presentationEvents.off('viewer_count', sendViewerCount);

    if (!isAdmin) {
      activeViewers = Math.max(0, activeViewers - 1);
      presentationEvents.emit('viewer_count', activeViewers);
    }
  });
});

// POST: Mudar o slide ou estado principal
router.post('/slide', async (req, res) => {
  const cookies = req.headers.cookie || '';
  if (!cookies.includes('presenter_token="PEEBestProject=CareSync@26"')) return res.status(403).json({ error: 'Unauthorized' });
  
  localState.ephemeral = { scroll: null, highlight: null, laser: null, models3D: {} };
  const newState = await updatePresentationState(req.body);
  
  presentationEvents.emit('update', { type: 'state_sync', state: { slide: newState.slide, blackout: newState.blackout } });
  res.json({ success: true, state: newState });
});

// POST: Sincronizar Movimentos (DOM Clicks, Input, Laser, Scroll)
router.post('/sync', (req, res) => {
  const cookies = req.headers.cookie || '';
  if (!cookies.includes('presenter_token="PEEBestProject=CareSync@26"')) return res.status(403).json({ error: 'Unauthorized' });

  const { action, payload } = req.body;
  if (action === 'BATCH' && Array.isArray(payload)) {
    payload.forEach(item => {
      if (item.action === 'SCROLL') localState.ephemeral.scroll = item.payload;
      if (item.action === 'HIGHLIGHT') localState.ephemeral.highlight = item.payload;
      if (item.action === 'LASER') localState.ephemeral.laser = item.payload;
      if (item.action === 'MODEL_3D') localState.ephemeral.models3D[item.payload.path.join('-')] = item.payload;
    });
    presentationEvents.emit('update', { type: 'batch_sync', batch: payload });
  } else {
    presentationEvents.emit('update', { type: 'sync', action, payload });
  }

  res.json({ success: true });
});

module.exports = router;