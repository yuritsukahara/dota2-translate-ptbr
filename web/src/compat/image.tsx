import type { ImgHTMLAttributes } from "react";

export default function Image({
  priority,
  unoptimized: _unoptimized,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & {
  priority?: boolean;
  unoptimized?: boolean;
}) {
  void _unoptimized;
  return (
    <img
      {...props}
      loading={priority ? "eager" : props.loading || "lazy"}
      decoding="async"
    />
  );
}
