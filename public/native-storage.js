(function () {
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
