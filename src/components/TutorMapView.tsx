import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import { Star, MapPin, Briefcase, Navigation } from "lucide-react";

// Fix default marker icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface TutorMapItem {
  user_id: string;
  subject: string;
  hourly_rate: number | null;
  rating: number | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  experience_years: number | null;
  is_verified: boolean | null;
  distance?: number;
  profiles: {
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
  } | null;
}

interface TutorMapViewProps {
  tutors: TutorMapItem[];
  searchCoords?: { lat: number; lng: number } | null;
}

const TutorMapView = ({ tutors, searchCoords }: TutorMapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // If map already exists, remove it
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Find center: use search coords, or average of tutor positions, or default India
    const tutorsWithCoords = tutors.filter((t) => t.latitude && t.longitude);
    let center: [number, number] = [20.5937, 78.9629]; // India center
    let zoom = 5;

    if (searchCoords) {
      center = [searchCoords.lat, searchCoords.lng];
      zoom = 12;
    } else if (tutorsWithCoords.length > 0) {
      const avgLat = tutorsWithCoords.reduce((s, t) => s + t.latitude!, 0) / tutorsWithCoords.length;
      const avgLng = tutorsWithCoords.reduce((s, t) => s + t.longitude!, 0) / tutorsWithCoords.length;
      center = [avgLat, avgLng];
      zoom = tutorsWithCoords.length === 1 ? 13 : 11;
    }

    const map = L.map(mapRef.current).setView(center, zoom);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Add search location marker
    if (searchCoords) {
      L.circleMarker([searchCoords.lat, searchCoords.lng], {
        radius: 10,
        fillColor: "hsl(var(--primary))",
        color: "hsl(var(--primary))",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.3,
      })
        .addTo(map)
        .bindPopup("<strong>Search location</strong>");
    }

    // Custom icon for tutors
    const tutorIcon = L.divIcon({
      className: "tutor-map-marker",
      html: `<div style="background: hsl(var(--primary)); color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 2px solid white;">T</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -20],
    });

    // Add tutor markers
    const bounds: L.LatLngExpression[] = [];
    tutorsWithCoords.forEach((t) => {
      const name = t.profiles?.full_name || "Unknown Tutor";
      const distText = t.distance !== undefined
        ? `<br/><span style="color: hsl(var(--primary));">📍 ${t.distance < 1 ? `${Math.round(t.distance * 1000)}m` : `${t.distance.toFixed(1)} km`} away</span>`
        : "";
      const rateText = t.hourly_rate ? `<br/>₹${t.hourly_rate}/hr` : "";
      const ratingText = t.rating ? ` · ⭐ ${t.rating}` : "";
      const verifiedBadge = t.is_verified ? ' <span style="color: green;">✓</span>' : "";

      const popup = `
        <div style="min-width: 180px; font-family: system-ui, sans-serif;">
          <strong style="font-size: 14px;">${name}${verifiedBadge}</strong>
          <br/><span style="color: #666; font-size: 12px;">${t.subject}${ratingText}</span>
          ${rateText}${distText}
          <br/><a href="/tutor/${t.user_id}" style="color: hsl(var(--primary)); font-size: 12px; text-decoration: underline;">View Profile →</a>
        </div>
      `;

      const marker = L.marker([t.latitude!, t.longitude!], { icon: tutorIcon })
        .addTo(map)
        .bindPopup(popup);

      bounds.push([t.latitude!, t.longitude!]);
    });

    // Fit bounds if we have markers and no search coords
    if (bounds.length > 1 && !searchCoords) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50] });
    }

    // Invalidate size after render
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [tutors, searchCoords]);

  const tutorsWithCoords = tutors.filter((t) => t.latitude && t.longitude);
  const tutorsWithoutCoords = tutors.length - tutorsWithCoords.length;

  return (
    <div className="space-y-2">
      <div
        ref={mapRef}
        className="h-[500px] w-full rounded-xl border bg-muted overflow-hidden"
        style={{ zIndex: 1 }}
      />
      {tutorsWithoutCoords > 0 && (
        <p className="text-xs text-muted-foreground">
          {tutorsWithoutCoords} tutor{tutorsWithoutCoords !== 1 ? "s" : ""} not shown on map (no location coordinates)
        </p>
      )}
    </div>
  );
};

export default TutorMapView;
