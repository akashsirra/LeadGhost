import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.akashsirra.brok',
  appName: 'BROK',
  webDir: 'public',
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://BROK-BACKEND-URL.invalid',
    cleartext: false,
  },
}

export default config
