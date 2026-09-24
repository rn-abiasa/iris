import { Link } from "react-router-dom";
import MeadowBackground from "../components/backgrounds/MeadowBackground";
import Stack from "../components/stack";
import ReasonCard from "../components/reasonCard";
import PhotoFrame from "../components/photoFrame";
import Button from "../components/button";
import useReveal from "../lib/useReveal";
import img7 from "../assets/7.webp";
import img5 from "../assets/5.webp";

// TODO: ganti dengan alasan-alasan asli kamu — makin spesifik makin kena.
const reasons = [
  "Karena senyummu selalu jadi alasan aku pulang dengan hati yang lebih ringan.",
  "Karena kamu selalu dengerin cerita panjangku tanpa pernah keliatan bosan.",
  "Karena bareng kamu, hal paling biasa pun jadi kenangan favorit.",
  "Karena kamu selalu percaya sama aku, bahkan waktu aku ragu sama diri sendiri.",
  "Karena caramu peduli itu diam-diam, tapi selalu kerasa.",
];

export default function Reason() {
  // Tombol NEXT yang dulu whileInView sekarang pakai reveal CSS + useReveal.
  const [nextRef, nextRevealed] = useReveal();

  return (
    <main className="relative flex min-h-dvh flex-col items-center overflow-x-hidden px-6 py-12 text-center">
      <MeadowBackground className="-z-10" />

      <div
        style={{ "--anim-from": "-18px", "--anim-dur": "0.8s" }}
        className="anim-rise anim-run"
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
      </div>

      <div className="relative mt-10 flex flex-col items-center gap-10 sm:mt-14 sm:flex-row sm:items-start sm:justify-center sm:gap-12">
        {/* decorative blank note peeking behind the stack */}
        <div
          aria-hidden="true"
          style={{ "--anim-dur": "0.9s", "--anim-delay": "0.15s" }}
          className="anim-note-in anim-run absolute h-64 w-56 rounded-2xl border border-[#d9b25a]/40 bg-[#fdf3d8] shadow-md sm:h-72 sm:w-64"
        />

        <div
          style={{
            "--anim-from": "24px",
            "--anim-dur": "0.8s",
            "--anim-delay": "0.3s",
          }}
          className="anim-pop anim-run relative h-64 w-56 sm:h-72 sm:w-64"
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
        </div>

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

      <div
        ref={nextRef}
        style={{ "--anim-from": "16px", "--anim-dur": "0.7s", "--anim-delay": "0.15s" }}
        className={`anim-rise ${
          nextRevealed ? "is-revealed" : "anim-hold"
        } mt-12 sm:mt-16`}
      >
        <Link to="/songs">
          <Button>NEXT</Button>
        </Link>
      </div>
    </main>
  );
}
