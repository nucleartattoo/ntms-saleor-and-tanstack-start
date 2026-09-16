export default function LogoSquare({ size }: { size?: "sm" | undefined }) {
  const imageSize = size === "sm" ? 30 : 40;

  return (
    <div className="flex flex-none items-center justify-center rounded-lg border border-black/10 bg-background/75 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,.04)] backdrop-blur-xl dark:bg-black/35">
      <img
        src="/nuclear-favicon.svg"
        alt="Nuclear Tattoo Supply"
        width={imageSize}
        height={imageSize}
        decoding="async"
        className="object-contain"
        style={{ width: imageSize, height: imageSize }}
      />
    </div>
  );
}
