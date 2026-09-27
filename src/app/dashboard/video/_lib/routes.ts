export const VIDEO_BASE = "/dashboard/video";

/** Query param instead of a dynamic segment keeps the route statically exportable. */
export const streamHref = (streamId: string): string =>
  `${VIDEO_BASE}/focus?stream=${encodeURIComponent(streamId)}`;
