import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type RouterContextValue = {
  pathname: string;
  navigate: (href: string) => void;
};

const RouterContext = createContext<RouterContextValue | null>(null);
const navigationEvent = "dublagem:navigate";

function currentPathname() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

export function RouterProvider({ children }: PropsWithChildren) {
  const [pathname, setPathname] = useState(currentPathname);

  useEffect(() => {
    const sync = () => setPathname(currentPathname());
    window.addEventListener("popstate", sync);
    window.addEventListener(navigationEvent, sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener(navigationEvent, sync);
    };
  }, []);

  const navigate = useCallback((href: string) => {
    const target = new URL(href, window.location.origin);
    if (target.origin !== window.location.origin) {
      window.location.assign(target);
      return;
    }
    window.history.pushState(null, "", target);
    window.dispatchEvent(new Event(navigationEvent));
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const value = useMemo(() => ({ pathname, navigate }), [pathname, navigate]);
  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
}

export function useClientRouter() {
  const context = useContext(RouterContext);
  if (!context) throw new Error("RouterProvider ausente.");
  return context;
}
