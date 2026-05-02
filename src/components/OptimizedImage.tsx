import { useState } from "react";
import { cn } from "@/lib/utils";
import logo from "@/assets/grow-logo.png";

interface OptimizedImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: string;
  width?: number;
  height?: number;
}

export const OptimizedImage = ({ src, alt, className, fallback, width, height }: OptimizedImageProps) => {
  const [errored, setErrored] = useState(false);

  const resolvedSrc = (!src || errored) ? (fallback ?? logo) : src;

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
      className={cn("object-cover", className)}
    />
  );
};
