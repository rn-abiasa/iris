import { motion } from "motion/react";
import { Link } from "react-router-dom";
import Button from "../components/button";
import GardenBackground from "../components/backgrounds/GardenBackground";
import coverPhoto from "../assets/siri_with_hat.webp";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.28, delayChildren: 0.2 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

const photoIn = {
  hidden: { opacity: 0, scale: 0.6, rotate: -10, y: 20 },
  show: {
    opacity: 1,
    scale: 1,
    rotate: -4,
    y: 0,
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Cover() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-x-hidden">
      <GardenBackground className="-z-10" />

      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center sm:gap-5"
      >
        <motion.h1
          variants={fadeUp}
          className="yuyu text-3xl leading-tight text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.35)] sm:text-5xl md:text-6xl"
        >
          Happy Birthday
          <br />
          My Lovee...
        </motion.h1>

        {/* age number, with the photo overlapping on top of it */}
        <div className="relative mt-4 flex items-start justify-center sm:mt-6">
          <motion.p
            variants={fadeUp}
            className="pacifico select-none text-[6rem] leading-none text-white/90 drop-shadow-[0_8px_22px_rgba(0,0,0,0.35)] -rotate-5 sm:text-[9rem] md:text-[15rem]"
          >
            20
          </motion.p>

          <motion.div
            variants={photoIn}
            className="absolute -top-10 left-1/2 -translate-x-1/2 sm:top-5"
          >
            <motion.img
              src={coverPhoto}
              alt="Foto ulang tahun"
              animate={{ y: [0, -10, 0], rotate: [-4, -1, -4] }}
              transition={{
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" },
              }}
              className="h-28 w-28 object-cover sm:h-40 sm:w-40 md:h-48 md:w-48"
            />
          </motion.div>
        </div>

        <div className="mt-6 sm:mt-8">
          <Link to="/memories">
            <Button>PRESS ME</Button>
          </Link>
        </div>
      </motion.section>
    </main>
  );
}
