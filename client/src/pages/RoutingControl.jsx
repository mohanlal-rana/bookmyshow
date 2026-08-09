import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

export default function RoutingControl({ userCoords, venueCoords }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !userCoords || !venueCoords) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(userCoords[0], userCoords[1]),
        L.latLng(venueCoords[0], venueCoords[1]),
      ],
      routeWhileDragging: false,
      show: false, // Set to true if you want step-by-step text instructions inside the map container
      lineOptions: {
        styles: [{ color: "#34908B", weight: 5 }],
      },
    }).addTo(map);

    return () => map.removeControl(routingControl);
  }, [map, userCoords, venueCoords]);

  return null;
}