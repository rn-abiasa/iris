import { motion } from "motion/react";
import { Link } from "react-router-dom";
import MeadowBackground from "../components/backgrounds/MeadowBackground";
import Stack from "../components/stack";
import ReasonCard from "../components/reasonCard";
import PhotoFrame from "../components/photoFrame";
import Button from "../components/button";
import img7 from "../assets/briliana.jpg";
import img5 from "../assets/brln_bag.jpeg";

// TODO: ganti dengan alasan-alasan asli kamu — makin spesifik makin kena.
const reasons = [
  "Karena senyummu selalu jadi alasan aku pulang dengan hati yang lebih ringan.",
  "Karena kamu selalu dengerin cerita panjangku tanpa pernah keliatan bosan.",
  "Karena bareng kamu, hal paling biasa pun jadi kenangan favorit.",
  "Karena kamu selalu percaya sama aku, bahkan waktu aku ragu sama diri sendiri.",
  "Karena caramu peduli itu diam-diam, tapi selalu kerasa.",
];

export default function Reason() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center overflow-x-hidden px-6 py-12 text-center">
      <MeadowBackground className="-z-10" />

      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="pacifico text-sm uppercase tracking-[0.3em] text-[#6b4a1f]/70 sm:text-base">
          a few (of many) reasons
        </p>
        <h1 className="yuyu text-3xl text-[#6b4a1f] drop-shadow-[0_2px_8px_rgba(255,255,255,0.6)] sm:text-5xl">
          Reason
        </h1>
        <p className="mt-2 text-sm text-[#6b4a1f]/70 sm:text-base">
          geser atau ketuk kartunya ✨
        </p>
      </motion.div>

      <div className="relative mt-10 flex flex-col items-center gap-10 sm:mt-14 sm:flex-row sm:items-start sm:justify-center sm:gap-12">
        {/* decorative blank note peeking behind the stack */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0, rotate: 0, y: 20 }}
          animate={{ opacity: 1, rotate: 6, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="absolute h-64 w-56 rounded-2xl border border-[#d9b25a]/40 bg-[#fdf3d8] shadow-md sm:h-72 sm:w-64"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="relative h-64 w-56 sm:h-72 sm:w-64"
        >
          <Stack
            cards={reasons.map((text, index) => (
              <ReasonCard key={text} index={index} text={text} />
            ))}
            randomRotation
            sendToBackOnClick
            autoplay
            autoplayDelay={3500}
            pauseOnHover
            mobileClickOnly
          />
        </motion.div>

        <div className="mt-6 flex flex-row gap-4 sm:mt-4 sm:flex-col">
          <PhotoFrame src={img7} alt="Kenangan 4" rotate={5} delay={0.5} />
          <PhotoFrame
            src={img5}
            alt="Kenangan 5"
            rotate={-5}
            delay={0.65}
            className="mt-4 sm:mt-8"
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="mt-12 sm:mt-16"
      >
        <Link to="/songs">
          <Button>NEXT</Button>
        </Link>
      </motion.div>
    </main>
  );
}
