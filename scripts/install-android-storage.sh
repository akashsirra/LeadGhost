#!/usr/bin/env bash
set -euo pipefail

PKG_DIR="android/app/src/main/java/com/akashsirra/brok"
mkdir -p "$PKG_DIR"

cat > "$PKG_DIR/StorageBridge.java" <<'JAVA'
package com.akashsirra.brok;

import android.content.Context;
import android.content.SharedPreferences;
import android.webkit.JavascriptInterface;

public final class StorageBridge {
    private final SharedPreferences prefs;

    public StorageBridge(Context context) {
        prefs = context.getSharedPreferences("brok_native_storage", Context.MODE_PRIVATE);
    }

    @JavascriptInterface
    public String get(String key) {
        return prefs.getString(key, "");
    }

    @JavascriptInterface
    public void set(String key, String value) {
        prefs.edit().putString(key, value == null ? "" : value).apply();
    }

    @JavascriptInterface
    public void remove(String key) {
        prefs.edit().remove(key).apply();
    }

    @JavascriptInterface
    public void clear() {
        prefs.edit().clear().apply();
    }
}
JAVA

cat > "$PKG_DIR/MainActivity.java" <<'JAVA'
package com.akashsirra.brok;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private boolean storageBridgeInstalled = false;

    @Override
    public void onResume() {
        super.onResume();
        if (storageBridgeInstalled) return;

        WebView webView = getBridge().getWebView();
        if (webView == null) return;

        webView.addJavascriptInterface(new StorageBridge(this), "BrokStorage");
        storageBridgeInstalled = true;

        // Android only exposes a newly-added JavaScript interface after the next
        // page load. Reload once so native-storage.js sees BrokStorage before
        // BROK's application code executes.
        webView.post(webView::reload);
    }
}
JAVA

python3 - <<'PY'
from pathlib import Path
p = Path('public/index.html')
s = p.read_text()
needle = '<script src="native-storage.js"></script>'
if needle not in s:
    s = s.replace('</head>', needle + '\n</head>', 1)
p.write_text(s)
PY
