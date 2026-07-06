const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

export const initPixel = () => {
  if (!PIXEL_ID) {
    console.log("⚠️ Meta Pixel ID missing in env. Log fallbacks will trigger in console.");
    return;
  }

  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */

  window.fbq("init", PIXEL_ID);
  window.fbq("track", "PageView");
  console.log("🔵 Meta Pixel Initialized");
};

export const trackPixelEvent = (eventName, data = {}) => {
  if (PIXEL_ID && window.fbq) {
    window.fbq("track", eventName, data);
  } else {
    console.log(`[Meta Pixel event stub]: Event="${eventName}", Data=`, data);
  }
};
