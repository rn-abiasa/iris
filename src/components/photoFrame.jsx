import { motion } from "motion/react";

/**
 * A tilted polaroid-style photo with a little "tape" strip and a caption.
 * Straightens and lifts slightly on hover, drifts gently while idle.
 */
export default function PhotoFrame({
  src,
  alt,
  caption,
  rotate = -4,
  delay = 0,
  className = "",
}) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 26, rotate: rotate * 2.2 }}
      whileInView={{ opacity: 1, y: 0, rotate }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
      whileHover={{ rotate: 0, scale: 1.04, y: -4 }}
      className={`relative w-36 select-none rounded-sm bg-white p-2.5 pb-5 shadow-xl sm:w-44 ${className}`}
    >
      <motion.span
        aria-hidden="true"
        animate={{
          rotate: [
            rotate > 0 ? 4 : -4,
            rotate > 0 ? 1 : -1,
            rotate > 0 ? 4 : -4,
          ],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-3 left-1/2 h-6 w-14 -translate-x-1/2 rounded-[2px] bg-white/70"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
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
    </motion.figure>
  );
}
