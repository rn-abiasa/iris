import { Link } from "react-router-dom";
import Button from "../components/button";
import GardenBackground from "../components/backgrounds/GardenBackground";
import coverPhoto from "../assets/siri_with_hat.webp";

// Delay stagger disamakan dengan framer-motion sebelumnya
// (staggerChildren 0.28 / delayChildren 0.2, mengikuti urutan render).
const stagger = (i) => ({ "--anim-delay": `${0.2 + i * 0.28}s` });
const rise = (i) => ({
  ...stagger(i),
  "--anim-from": "28px",
  "--anim-dur": "0.9s",
});

export default function Cover() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-x-hidden">
      <GardenBackground className="-z-10" />

      <section className="relative z-10 flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center sm:gap-5">
        <h1
          style={rise(0)}
          className="anim-rise anim-run yuyu text-3xl leading-tight text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.35)] sm:text-5xl md:text-6xl"
        >
          Happy Birthday
          <br />
          My Lovee...
        </h1>

        {/* age number, with the photo overlapping on top of it */}
        <div className="relative mt-4 flex items-start justify-center sm:mt-6">
          <p
            style={rise(1)}
            className="anim-rise anim-run pacifico select-none text-[6rem] leading-none text-white/90 drop-shadow-[0_8px_22px_rgba(0,0,0,0.35)] -rotate-5 sm:text-[9rem] md:text-[15rem]"
          >
            20
          </p>

          <div
            style={stagger(2)}
            className="anim-photo-in anim-run cover-photo-wrap absolute -top-10 left-1/2 -translate-x-1/2 sm:top-5"
          >
            <img
              src={coverPhoto}
              alt="Foto ulang tahun"
              className="cover-photo h-28 w-28 object-cover sm:h-40 sm:w-40 md:h-48 md:w-48"
            />
          </div>
        </div>

        <div style={rise(3)} className="anim-rise anim-run mt-6 sm:mt-8">
          <Link to="/memories">
            <Button>PRESS ME</Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
