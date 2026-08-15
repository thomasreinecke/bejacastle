/**
 * Bejacastle - Automatic Codebase Hot-Reloader & Watcher
 * Continuously watches the codebase for edits in JavaScript, CSS, HTML, and audio files.
 * Triggers an instant automatic browser reload whenever any file is saved.
 */

(function initLiveReload() {
  let initialVersion = null;
  let isReloading = false;

  function triggerReload() {
    if (isReloading) return;
    isReloading = true;
    console.log('%c[CastleLiveReload] 🔄 Codebase modification detected! Reloading...', 'background: #b45309; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 3px;');
    setTimeout(() => {
      window.location.reload();
    }, 150);
  }

  // 1. Server-Sent Events (SSE) stream for zero-latency hot reload without polling logs
  let isSSEConnected = false;

  if (typeof EventSource !== 'undefined') {
    try {
      const evtSource = new EventSource('/api/live-reload');
      evtSource.onopen = () => {
        isSSEConnected = true;
      };
      evtSource.onmessage = (e) => {
        if (e.data === 'reload') {
          triggerReload();
        }
      };
      evtSource.onerror = () => {
        isSSEConnected = false;
        evtSource.close();
        // Retry SSE connection after a short wait
        setTimeout(initFallbackPolling, 3000);
      };
    } catch (e) {
      initFallbackPolling();
    }
  } else {
    initFallbackPolling();
  }

  // 2. Quiet Fallback Polling (only active if SSE is unavailable or disconnected)
  function initFallbackPolling() {
    if (isSSEConnected) return;

    async function checkVersion() {
      if (isSSEConnected) return;
      try {
        const res = await fetch('/api/code-version?t=' + Date.now(), { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (initialVersion === null) {
            initialVersion = data.version;
          } else if (data.version && data.version > initialVersion) {
            triggerReload();
            return;
          }
        }
      } catch (err) {
        // If server is restarting, check when it comes back up
        if (initialVersion !== null) {
          setTimeout(triggerReload, 1000);
          return;
        }
      }
      if (!isSSEConnected) {
        setTimeout(checkVersion, 3000);
      }
    }

    checkVersion();
  }
})();
