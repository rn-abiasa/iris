import { useRef, useState } from "react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import DuskBackground from "../components/backgrounds/DuskBackground";
import Typewriter from "../components/typewriter";
import Button from "../components/button";

// TODO: ganti dengan kalimat harapan yang benar-benar kamu mau ucapkan.
const wishText =
  "Selamat ulang tahun, sayang. Semoga di usia barumu ini, kamu selalu dikelilingi kebahagiaan, kesehatan, dan hal-hal baik yang kamu deserve. Terima kasih sudah hadir dan menjadi bagian indah dalam hidupku. Semoga kita bisa terus tumbuh bersama, saling menemani, dan menciptakan banyak cerita baik ke depannya.";

const CONFETTI_COLORS = ["#ffe9a8", "#f4a261", "#e0e0f0", "#cdb4db", "#ffffff"];

function fireConfetti() {
  const duration = 2200;
  const end = Date.now() + duration;

  confetti({
    particleCount: 120,
    spread: 100,
    origin: { y: 0.45 },
    colors: CONFETTI_COLORS,
  });

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 60,
      origin: { x: 0 },
      colors: CONFETTI_COLORS,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 60,
      origin: { x: 1 },
      colors: CONFETTI_COLORS,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export default function Wish() {
  const [typed, setTyped] = useState(false);
  const firedRef = useRef(false);

  const handleComplete = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    setTyped(true);
    fireConfetti();
  };

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-hidden px-6 py-12 text-center">
      <DuskBackground className="-z-10" />

      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="pacifico text-sm uppercase tracking-[0.3em] text-[#fdf6e3]/80 sm:text-base">
          make a wish
        </p>
        <h1 className="yuyu text-3xl text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] sm:text-5xl">
          Wish
        </h1>
      </motion.div>

      <div className="mt-8 max-w-xl sm:mt-10">
        <Typewriter
          text={wishText}
          as="p"
          speed={32}
          startDelay={800}
          onComplete={handleComplete}
          className="yuyu whitespace-pre-line text-lg leading-relaxed text-[#fdf6e3] drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] sm:text-2xl"
        />
      </div>

      {typed && (
        <a href="/" className="mt-10">
          <Button>Play Again</Button>
        </a>
      )}
    </main>
  );
}
