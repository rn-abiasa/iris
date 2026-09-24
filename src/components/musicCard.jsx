import useReveal from "../lib/useReveal";

/**
 * A music card that shows a YouTube thumbnail with a play button first
 * (so the page doesn't load N heavy iframes up front), and swaps in the
 * real embedded player once the person taps it.
 *
 * Playback is controlled by the parent (`isPlaying` / `onPlay`) rather
 * than kept as local state, so the parent can guarantee only one card
 * plays at a time — see songs.jsx.
 *
 * Animasinya murni CSS (lihat seksi "Animasi entrance / idle" di index.css):
 * `.music-card` + keyframes `card-in` (jalan saat kartu masuk viewport lewat
 * useReveal), `pulse-soft` untuk tombol play, dan `note-spin` untuk ikon ♪.
 *
 * videoId: the YouTube video ID only (the part after "v=" in the URL),
 *          e.g. for https://www.youtube.com/watch?v=dQw4w9WgXcQ it's
 *          "dQw4w9WgXcQ".
 */
export default function MusicCard({
  videoId,
  title,
  note,
  index = 0,
  isPlaying = false,
  onPlay,
}) {
  const tilt = index % 2 === 0 ? -3 : 3;
  const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const [revealRef, revealed] = useReveal({ amount: 0.4 });

  return (
    <div
      ref={revealRef}
      style={{
        "--card-tilt": `${tilt}deg`,
        "--card-tilt-half": `${tilt / 2}deg`,
        "--anim-delay": `${index * 0.1}s`,
      }}
      className={`music-card ${
        revealed ? "is-revealed" : "anim-hold"
      } relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/50 bg-white/80 shadow-lg backdrop-blur-sm`}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-black/10">
        {isPlaying ? (
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={title}
            allow="accelerate; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => onPlay?.(index)}
            className="group relative block h-full w-full cursor-pointer"
            aria-label={`Putar ${title}`}
          >
            <img
              src={thumbnail}
              alt={title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/10">
              <span className="music-card__play flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-2xl text-[#274e33] shadow-md">
                ▶
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        <span
          className={`music-card__note flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#274e33] text-sm text-white ${
            isPlaying ? "music-card__note--spin" : ""
          }`}
        >
          ♪
        </span>
        <div className="min-w-0 text-left">
          <p className="truncate text-sm font-semibold text-[#274e33] sm:text-base">
            {title}
          </p>
          {note && (
            <p className="truncate text-xs text-[#274e33]/70 sm:text-sm">
              {note}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
