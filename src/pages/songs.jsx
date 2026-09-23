import { motion } from "motion/react";
import { Link } from "react-router-dom";
import ForestBackground from "../components/backgrounds/ForestBackground";
import MusicCard from "../components/musicCard";
import Button from "../components/button";

// TODO: ganti videoId di bawah dengan ID video YouTube lagu pilihanmu.
// Cara ambil ID: di URL https://www.youtube.com/watch?v=XXXXXXXXXXX
// yang dipakai hanya bagian setelah "v=" (11 karakter), yaitu XXXXXXXXXXX.
const songs = [
  {
    videoId: "VIDEO_ID_1",
    title: "Judul Lagu 1",
    note: "Ceritain kenangan di balik lagu ini di sini",
  },
  {
    videoId: "VIDEO_ID_2",
    title: "Judul Lagu 2",
    note: "Ceritain kenangan di balik lagu ini di sini",
  },
  {
    videoId: "VIDEO_ID_3",
    title: "Judul Lagu 3",
    note: "Ceritain kenangan di balik lagu ini di sini",
  },
];

export default function Songs() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-x-hidden">
      <ForestBackground className="-z-10" />

      <section className="relative z-10 flex flex-1 flex-col items-center gap-10 px-4 py-10 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <p className="pacifico text-sm uppercase tracking-[0.3em] text-[#fff3c0]/80 sm:text-base">
            our soundtrack
          </p>
          <h1 className="yuyu text-3xl text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] sm:text-5xl">
            Songs
          </h1>
        </motion.div>

        <div className="flex w-full max-w-4xl flex-col items-center gap-6 sm:grid sm:grid-cols-2 sm:gap-8">
          {songs.map((song, index) => (
            <MusicCard key={`${song.videoId}-${index}`} index={index} {...song} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <Link to="/wish">
            <Button>NEXT</Button>
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
