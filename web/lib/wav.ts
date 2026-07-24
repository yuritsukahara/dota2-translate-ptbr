export type WavInfo = {
  channels: number;
  sampleRate: number;
  bitsPerSample: number;
  durationMs: number;
};

export function inspectWav(buffer: ArrayBuffer): WavInfo {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const ascii = (offset: number, length: number) =>
    String.fromCharCode(...bytes.slice(offset, offset + length));
  if (buffer.byteLength < 44 || ascii(0, 4) !== "RIFF" || ascii(8, 4) !== "WAVE") {
    throw new Error("O arquivo não é um WAV RIFF válido.");
  }

  let offset = 12;
  let format: { audioFormat: number; channels: number; sampleRate: number; byteRate: number; bits: number } | null = null;
  let dataSize = 0;
  while (offset + 8 <= buffer.byteLength) {
    const id = ascii(offset, 4);
    const size = view.getUint32(offset + 4, true);
    const body = offset + 8;
    if (body + size > buffer.byteLength) throw new Error("WAV truncado.");
    if (id === "fmt " && size >= 16) {
      format = {
        audioFormat: view.getUint16(body, true),
        channels: view.getUint16(body + 2, true),
        sampleRate: view.getUint32(body + 4, true),
        byteRate: view.getUint32(body + 8, true),
        bits: view.getUint16(body + 14, true),
      };
    }
    if (id === "data") dataSize = size;
    offset = body + size + (size % 2);
  }
  if (!format || !dataSize) throw new Error("WAV sem blocos fmt/data.");
  if (format.audioFormat !== 1 || format.channels !== 1 || format.bits !== 16) {
    throw new Error("Use WAV PCM mono de 16 bits.");
  }
  if (![24000, 48000].includes(format.sampleRate)) {
    throw new Error("Use taxa de amostragem de 24 kHz ou 48 kHz.");
  }
  const durationMs = Math.round((dataSize / format.byteRate) * 1000);
  if (durationMs > 20_000) throw new Error("A gravação deve ter no máximo 20 segundos.");
  return { channels: format.channels, sampleRate: format.sampleRate, bitsPerSample: format.bits, durationMs };
}
