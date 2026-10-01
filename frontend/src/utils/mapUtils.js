import { toLonLat } from "ol/proj";
import { getDistance } from "ol/sphere";

export function circleToSearchArea(circle) {
  const center3857 = circle.getCenter();

  const radius3857 = circle.getRadius();

  const edge3857 = [center3857[0] + radius3857, center3857[1]];

  const center4326 = toLonLat(center3857);

  const edge4326 = toLonLat(edge3857);

  const radiusMeters = getDistance(center4326, edge4326);

  return {
    longitude: center4326[0],
    latitude: center4326[1],
    radiusMeters,
  };
}
