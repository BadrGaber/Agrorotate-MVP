import { useState } from "react";
import {
  HERO_SLIDE_1_URI,
  HERO_SLIDE_2_URI,
  HERO_SLIDE_3_URI,
} from "../data/heroImages";

export const LANDING_SLIDES = [
  {
    index: 0,
    imageUri: HERO_SLIDE_1_URI,
    iconKey: "soilLayers",
    script: "Cultivating Living Earth & Sovereign Harvests",
    title: "SOIL & PARCEL DIAGNOSTICS",
    subtitle:
      "Draw the parcel and record what you can actually observe — kept separate from laboratory numbers, always.",
    cardTitle: "Soil & Parcel Diagnostics",
    cardDesc:
      "Boundary, area, observations and lab results — each value labelled with its real source.",
    accentColor: "#34D399",
  },
  {
    index: 1,
    imageUri: HERO_SLIDE_2_URI,
    iconKey: "waterDrop",
    script: "Harmony of Rain, Root Moisture & Solar Winds",
    title: "CLIMATE & WATER BALANCE",
    subtitle:
      "One live NASA POWER window for climate context. Water quality stays a laboratory question, not a guess.",
    cardTitle: "Climate & Water Balance",
    cardDesc:
      "Fetch real NASA POWER records, and keep rainfall distinct from irrigation delivery.",
    accentColor: "#38BDF8",
  },
  {
    index: 2,
    imageUri: HERO_SLIDE_3_URI,
    iconKey: "wheat",
    script: "Six Seasons of Verdant Abundance & Renewal",
    title: "3-YEAR LAND ROTATION PLAN",
    subtitle:
      "Explore six seasons where every verdict prints its evidence — and every missing check stays visible.",
    cardTitle: "3-Year Plan & Advisor",
    cardDesc:
      "Six seasons, sourced salinity checks, family breaks and honest data gaps.",
    accentColor: "#FBBF24",
  },
];

export function useLandingController(onEnterDashboard: () => void) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [viewedSlides, setViewedSlides] = useState<number[]>([0]);

  const handleSelectSlide = (idx: number) => {
    setActiveSlide(idx);
    setViewedSlides((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
  };



  const handleActionClick = () => {
    onEnterDashboard();
  };

  const current = LANDING_SLIDES[activeSlide] || LANDING_SLIDES[0];

  return {
    slides: LANDING_SLIDES,
    activeSlide,
    allThreeViewed: viewedSlides.length >= 3,
    current,
    handleSelectSlide,
    handleActionClick,
  };
}
