export function normalizeGoogleDriveFolderUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.hostname !== "drive.google.com") return null;
    const match = url.pathname.match(/\/folders\/([A-Za-z0-9_-]{10,})/);
    if (!match) return null;
    return `https://drive.google.com/drive/folders/${match[1]}`;
  } catch {
    return null;
  }
}
