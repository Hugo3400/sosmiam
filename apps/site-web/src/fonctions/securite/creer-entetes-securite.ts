const PERMISSIONS: Record<string, string> = {
  accelerometer: "()",
  camera: "()",
  "display-capture": "()",
  geolocation: "(self)",
  gyroscope: "()",
  hid: "()",
  "idle-detection": "()",
  magnetometer: "()",
  microphone: "()",
  midi: "()",
  payment: "()",
  "screen-wake-lock": "()",
  serial: "()",
  usb: "()",
  "xr-spatial-tracking": "()",
};

export function creerEntetesSecurite(nonce: string, developpement: boolean): Record<string, string> {
  const scripts = ["'self'", `'nonce-${nonce}'`, ...(developpement ? ["'unsafe-eval'"] : [])];
  const connexions = ["'self'", ...(developpement ? ["ws:"] : [])];
  const politique = [
    "default-src 'self'",
    `script-src ${scripts.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self'",
    "font-src 'self'",
    `connect-src ${connexions.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  return {
    "Content-Security-Policy": politique.join("; "),
    "Permissions-Policy": Object.entries(PERMISSIONS).map(([permission, origines]) => `${permission}=${origines}`).join(", "),
  };
}
