"use client";

// SSR-safe обгортка над Leaflet-мапою: Leaflet чіпає window на імпорті, тож вантажимо
// CarpoolMap лише на клієнті (ssr:false). dynamic(ssr:false) дозволений тільки в клієнт-компоненті.
import dynamic from "next/dynamic";
import type { CarpoolMapProps } from "@/components/site/CarpoolMap";

const CarpoolMapDynamic = dynamic(() => import("@/components/site/CarpoolMap"), {
  ssr: false,
  loading: () => <div className="h-[60vh] min-h-[320px] w-full animate-pulse bg-gray-100" />,
});

export default function CarpoolView(props: CarpoolMapProps) {
  return <CarpoolMapDynamic {...props} />;
}
