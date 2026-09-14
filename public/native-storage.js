(function () {
  const style = document.createElement('style');
  style.textContent = `
    :root { color-scheme: dark !important; background: #000 !important; color: #fff !important; }
    html, body { background: #000 !important; color: #fff !important; }
    header { background: rgba(0,0,0,.92) !important; border-color: #1a1a1a !important; }
    .sub, .modes button, .hero p, .meta, .hint, .tool, .thinking, .saveStatus, .security { color: #666 !important; }
    .modes button.active { color: #fff !important; }
    .modes button.agent.active { color: #fff !important; }
    .mark { background: #fff !important; color: #000 !important; }
    .quick button { background: #0a0a0a !important; border-color: #2a2a2a !important; color: #ccc !important; }
    .user .bubble { background: #fff !important; color: #000 !important; }
    .assistant .bubble { color: #eee !important; }
    form, .sheet { background: #0b0b0b !important; border-color: #292929 !important; }
    textarea, .settings input { background: transparent !important; color: #fff !important; }
    .settings input { background: #000 !important; border-color: #292929 !important; }
    .send { background: #fff !important; color: #000 !important; }
    .save, .save.ok, .save.error { background: #fff !important; color: #000 !important; }
    .saveStatus.ok { color: #aaa !important; }
    .saveStatus.error { color: #fff !important; }
    .thinking i { background: #fff !important; box-shadow: none !important; }
    .security { border-color: #202020 !important; }
  `;
  document.head.appendChild(style);

  const native = window.BrokStorage;
  if (!native) return;
  const fallback = window.localStorage;
  const bridgeStore = {
    getItem(key) {
      try {
        const value = native.get(String(key));
        return value !== null && value !== undefined && value !== '' ? String(value) : fallback.getItem(key);
      } catch (_) {
        return fallback.getItem(key);
      }
    },
    setItem(key, value) {
      const k = String(key);
      const v = String(value);
      native.set(k, v);
      try { fallback.setItem(k, v); } catch (_) {}
    },
    removeItem(key) {
      const k = String(key);
      try { native.remove(k); } catch (_) {}
      try { fallback.removeItem(k); } catch (_) {}
    },
    clear() {
      try { native.clear(); } catch (_) {}
      try { fallback.clear(); } catch (_) {}
    },
    key(index) { return fallback.key(index); },
    get length() { return fallback.length; }
  };
  try {
    Object.defineProperty(window, 'localStorage', { configurable: true, value: bridgeStore });
  } catch (_) {
    window.brokNativeStorage = bridgeStore;
  }
})();
