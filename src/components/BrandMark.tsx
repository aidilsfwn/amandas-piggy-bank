type BrandMarkProps = {
  size?: "default" | "small";
};

export function BrandMark({ size = "default" }: BrandMarkProps) {
  return (
    <span className={`brandMark${size === "small" ? " brandMark--small" : ""}`} aria-hidden="true">
      <img src="/web-app-manifest-512x512.png" alt="" />
    </span>
  );
}
