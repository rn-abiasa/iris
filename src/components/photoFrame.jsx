import useReveal from "../lib/useReveal";

/**
 * A tilted polaroid-style photo with a little "tape" strip and a caption.
 * Straightens and lifts slightly on hover, drifts gently while idle.
 *
 * Animasinya murni CSS (lihat seksi "Animasi entrance / idle" di index.css):
 * `.photo-frame` + `.anim-tilt-in` + class `anim-hold`/`is-revealed`
 * menggantikan pasangan whileInView + whileHover, sementara `useReveal`
 * hanya menandai kapan fotonya masuk viewport.
 */
export default function PhotoFrame({
  src,
  alt,
  caption,
  rotate = -4,
  delay = 0,
  className = "",
}) {
  const [revealRef, revealed] = useReveal({ amount: 0.4 });

  return (
    <figure
      ref={revealRef}
      style={{
        "--anim-rot": `${rotate}deg`,
        "--anim-rot-from": `${rotate * 2.2}deg`,
        "--anim-delay": `${delay}s`,
      }}
      className={`photo-frame anim-tilt-in ${
        revealed ? "is-revealed" : "anim-hold"
      } relative w-36 select-none rounded-sm bg-white p-2.5 pb-5 shadow-xl sm:w-44 ${className}`}
    >
      <span
        aria-hidden="true"
        className="photo-frame__tape absolute -top-3 left-1/2 h-6 w-14 -translate-x-1/2 rounded-[2px] bg-white/70"
        style={{
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          "--tape-rot": `${rotate > 0 ? 4 : -4}deg`,
        }}
      />
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="aspect-square w-full rounded-[2px] object-cover"
      />
      {caption && (
        <figcaption className="pacifico mt-2 truncate text-center text-sm text-[#3b3550]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
