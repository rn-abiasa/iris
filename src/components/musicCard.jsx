import { useState } from "react";
import { motion } from "motion/react";

/**
 * A music card that shows a YouTube thumbnail with a play button first
 * (so the page doesn't load N heavy iframes up front), and swaps in the
 * real embedded player once the person taps it.
 *
 * videoId: the YouTube video ID only (the part after "v=" in the URL),
 *          e.g. for https://www.youtube.com/watch?v=dQw4w9WgXcQ it's
 *          "dQw4w9WgXcQ".
 */
export default function MusicCard({ videoId, title, note, index = 0 }) {
  const [playing, setPlaying] = useState(false);
  const tilt = index % 2 === 0 ? -3 : 3;
  const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 36, rotate: tilt }}
      whileInView={{ opacity: 1, y: 0, rotate: tilt / 2 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
        delay: index * 0.1,
      }}
      whileHover={{ rotate: 0, scale: 1.02, y: -4 }}
      className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/50 bg-white/80 shadow-lg backdrop-blur-sm"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-black/10">
        {playing ? (
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
            onClick={() => setPlaying(true)}
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
              <motion.span
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-2xl text-[#274e33] shadow-md"
              >
                ▶
              </motion.span>
            </span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        <motion.span
          animate={playing ? { rotate: 360 } : { rotate: 0 }}
          transition={
            playing
              ? { duration: 3, repeat: Infinity, ease: "linear" }
              : { duration: 0.3 }
          }
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#274e33] text-sm text-white"
        >
          ♪
        </motion.span>
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
    </motion.div>
  );
}
