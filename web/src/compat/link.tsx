import type {
  AnchorHTMLAttributes,
  MouseEvent,
  ReactNode,
} from "react";
import { useClientRouter } from "@/src/router";

export default function Link({
  href,
  children,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children: ReactNode;
}) {
  const { navigate } = useClientRouter();
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    props.onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      props.target === "_blank" ||
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("/api/")
    ) {
      return;
    }
    event.preventDefault();
    navigate(href);
  };

  return (
    <a href={href} {...props} onClick={onClick}>
      {children}
    </a>
  );
}
