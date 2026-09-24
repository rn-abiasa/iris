import { useState } from "react";
import { Link } from "react-router-dom";
import ForestBackground from "../components/backgrounds/ForestBackground";
import MusicCard from "../components/musicCard";
import PhotoFrame from "../components/photoFrame";
import Button from "../components/button";
import useReveal from "../lib/useReveal";
import img6 from "../assets/6.webp";

// TODO: ganti videoId di bawah dengan ID video YouTube lagu pilihanmu.
// Cara ambil ID: di URL https://www.youtube.com/watch?v=XXXXXXXXXXX
// yang dipakai hanya bagian setelah "v=" (11 karakter), yaitu XXXXXXXXXXX.
const songs = [
  {
    videoId: "__Pb1fO2H2A",
    title: "Overnight - Kita Lewati Berdua",
    note: "Kita lewati semuanya bersama yaa",
  },
  {
    videoId: "7SqNVv98e8Q",
    title: "Sal Priadi - Kita Usahakan Rumah Itu",
    note: "Ceritain kenangan di balik lagu ini di sini",
  },
  {
    videoId: "mJE0ROBWPvY",
    title: "Raim Laode - Lesung Pipi",
    note: "Tunggu proses ku yaa",
  },
];

export default function Songs() {
  // Only one card may play at a time: this index is the single source of
  // truth, handed down to every MusicCard as `isPlaying`.
  const [activeIndex, setActiveIndex] = useState(null);
  // Tombol NEXT yang dulu whileInView sekarang pakai reveal CSS + useReveal.
  const [nextRef, nextRevealed] = useReveal();

  return (
    <main className="relative flex min-h-dvh flex-col overflow-x-hidden">
      <ForestBackground className="-z-10" />

      <section className="relative z-10 flex flex-1 flex-col items-center gap-10 px-4 py-10 sm:py-14">
        <div
          style={{ "--anim-from": "-18px", "--anim-dur": "0.8s" }}
          className="anim-rise anim-run text-center"
        >
          <p className="pacifico text-sm uppercase tracking-[0.3em] text-[#fff3c0]/80 sm:text-base">
            our soundtrack
          </p>
          <h1 className="yuyu text-3xl text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] sm:text-5xl">
            Songs
          </h1>
        </div>

        <div className="flex w-full max-w-4xl flex-col items-center gap-6 sm:grid sm:grid-cols-2 sm:gap-8">
          {songs.map((song, index) => (
            <MusicCard
              key={`${song.videoId}-${index}`}
              index={index}
              isPlaying={activeIndex === index}
              onPlay={setActiveIndex}
              {...song}
            />
          ))}
        </div>

        <div
          ref={nextRef}
          style={{ "--anim-from": "16px", "--anim-dur": "0.7s", "--anim-delay": "0.15s" }}
          className={`anim-rise ${nextRevealed ? "is-revealed" : "anim-hold"}`}
        >
          <Link to="/wish">
            <Button>NEXT</Button>
          </Link>
        </div>
      </section>

      {/* decorative photo, pinned to the window's bottom-right corner */}
      <div className="pointer-events-none fixed bottom-3 right-3 z-20 sm:bottom-6 sm:right-6">
        <PhotoFrame
          src={img6}
          alt="Kenangan"
          rotate={6}
          delay={0.6}
          className="pointer-events-auto w-24 sm:w-40"
        />
      </div>
    </main>
  );
}
