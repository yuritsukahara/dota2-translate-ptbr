import { useClientRouter } from "@/src/router";

export function usePathname() {
  return useClientRouter().pathname;
}

export function useRouter() {
  const { navigate } = useClientRouter();
  return {
    push: navigate,
    replace: (path: string) => window.location.replace(path),
    refresh: () => window.location.reload(),
  };
}

export function useParams<T extends Record<string, string>>() {
  const segments = usePathname()
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));
  if (segments[0] === "packs") {
    return { hero: segments[1] || "" } as unknown as T;
  }
  return { id: segments[1] || "" } as unknown as T;
}
