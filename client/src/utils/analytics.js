import ReactGA from "react-ga4";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const initGA = () => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    console.log("📊 GA4 Initialized");
  } else {
    console.log("⚠️ GA4 Measurement ID missing in env. Log fallbacks will trigger in console.");
  }
};

export const trackPageView = (path) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.send({ hitType: "pageview", page: path });
  }
};

export const trackAnalyticsEvent = (action, category = "engagement", label = "") => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.event({
      action,
      category,
      label,
    });
  } else {
    console.log(`[GA4 event stub]: Action="${action}", Category="${category}", Label="${label}"`);
  }
};
