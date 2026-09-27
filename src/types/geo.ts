export interface LatLon {
  lat: number;
  lon: number;
}

export interface LatLonAlt extends LatLon {
  altM: number;
}

/** How coordinates are rendered to the operator. */
export type CoordinateFormat = "dd" | "dms" | "mgrs";
