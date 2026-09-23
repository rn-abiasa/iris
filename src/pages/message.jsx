import { motion } from "motion/react";
import { Link } from "react-router-dom";
import MountainBackground from "../components/backgrounds/MountainBackground";
import Typewriter from "../components/typewriter";
import PhotoFrame from "../components/photoFrame";
import Button from "../components/button";
import img1 from "../assets/1.webp";
import img2 from "../assets/2.webp";
import img3 from "../assets/3.webp";

// TODO: ganti dengan pesan spesial yang benar-benar kamu mau sampaikan.
const specialMessage = `Di antara semua hari yang kita lewati bareng, hari ini aku cuma mau bilang: makasih sudah jadi rumah paling nyaman buat aku pulang. Semoga umur baru ini bawa lebih banyak alasan buat kita ketawa bareng.`;

export default function Message() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center overflow-x-hidden px-6 py-12 text-center">
      <MountainBackground className="-z-10" />

      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="pacifico text-sm uppercase tracking-[0.3em] text-[#4a3826]/70 sm:text-base">
          a little something
        </p>
        <h1 className="yuyu text-3xl text-[#4a3826] drop-shadow-[0_2px_8px_rgba(255,255,255,0.6)] sm:text-5xl">
          Message
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="mt-8 w-full max-w-xl rounded-3xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm sm:mt-10 sm:p-8"
      >
        <Typewriter
          text={specialMessage}
          startDelay={700}
          speed={28}
          className="yuyu whitespace-pre-line text-lg leading-relaxed text-[#4a3826] sm:text-xl"
        />
      </motion.div>

      {/* decorative photos */}
      <div className="mt-10 flex w-full max-w-2xl flex-wrap items-start justify-center gap-4 sm:mt-14 sm:gap-8">
        <PhotoFrame src={img1} alt="Kenangan 1" rotate={-6} delay={0.1} />
        <PhotoFrame
          src={img2}
          alt="Kenangan 2"
          rotate={4}
          delay={0.25}
          className="mt-4 sm:mt-8"
        />
        <PhotoFrame src={img3} alt="Kenangan 3" rotate={-3} delay={0.4} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="mt-10 sm:mt-14"
      >
        <Link to="/reason">
          <Button>NEXT</Button>
        </Link>
      </motion.div>
    </main>
  );
}
