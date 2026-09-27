/** Local / mock files play directly via <video src>; anything else is WHEP. */
export const isFileUrl = (url: string): boolean =>
  url.startsWith("/mock/") || /\.(mp4|webm|ogg)(\?|$)/i.test(url);

function waitIceGathering(
  pc: RTCPeerConnection,
  timeoutMs = 2000,
): Promise<void> {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === "complete") {
      resolve();
      return;
    }
    const timer = setTimeout(resolve, timeoutMs);
    pc.addEventListener("icegatheringstatechange", () => {
      if (pc.iceGatheringState === "complete") {
        clearTimeout(timer);
        resolve();
      }
    });
  });
}

/** WHEP playback (MediaMTX: http://host:8889/<path>/whep) into a <video>. */
export async function connectWhep(
  url: string,
  video: HTMLVideoElement,
): Promise<RTCPeerConnection> {
  const pc = new RTCPeerConnection();
  pc.addTransceiver("video", { direction: "recvonly" });
  pc.addTransceiver("audio", { direction: "recvonly" });
  pc.ontrack = (e) => {
    const [stream] = e.streams;
    if (stream && video.srcObject !== stream) video.srcObject = stream;
  };

  await pc.setLocalDescription(await pc.createOffer());
  await waitIceGathering(pc);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/sdp" },
    body: pc.localDescription?.sdp,
  });
  if (!res.ok) {
    pc.close();
    throw new Error(`WHEP ${res.status}`);
  }
  await pc.setRemoteDescription({ type: "answer", sdp: await res.text() });
  return pc;
}
