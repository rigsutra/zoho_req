import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Fix default marker icons for Leaflet + bundlers
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const checkInIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "hue-rotate-120",
});

L.Marker.prototype.options.icon = defaultIcon;

interface LocationPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  label: string;
  time: string;
  type: "check-in" | "check-out";
}

interface LocationMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  locations: LocationPoint[];
}

export function LocationMapDialog({
  open,
  onOpenChange,
  title,
  locations,
}: LocationMapDialogProps) {
  if (locations.length === 0) return null;

  const center: [number, number] = [
    locations[0]!.latitude,
    locations[0]!.longitude,
  ];

  // Calculate bounds to fit all markers
  const bounds = L.latLngBounds(
    locations.map((loc) => [loc.latitude, loc.longitude] as [number, number])
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="h-[450px] w-full rounded-lg overflow-hidden">
          <MapContainer
            center={center}
            zoom={15}
            bounds={locations.length > 1 ? bounds.pad(0.3) : undefined}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locations.map((loc, idx) => (
              <Marker
                key={idx}
                position={[loc.latitude, loc.longitude]}
                icon={loc.type === "check-in" ? checkInIcon : defaultIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">
                      {loc.type === "check-in" ? "Check In" : "Check Out"}
                    </p>
                    <p>{loc.label}</p>
                    <p className="text-gray-600">{loc.time}</p>
                    <p className="text-gray-500 text-xs">
                      {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Accuracy: {loc.accuracy.toFixed(0)}m
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            Check In
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            Check Out
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
