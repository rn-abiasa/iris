import { Link } from "react-router-dom";
import LakeBackground from "../components/backgrounds/LakeBackground";
import InfiniteSpiral from "../components/infiniteSpiral";
import Button from "../components/button";
import img2 from "../assets/2.webp";
import img3 from "../assets/3.webp";
import img4 from "../assets/4.webp";
import img5 from "../assets/5.webp";
import img6 from "../assets/6.webp";

const images = [
  { src: img2, alt: "Memory 2" },
  { src: img3, alt: "Memory 3" },
  { src: img4, alt: "Memory 4" },
  { src: img5, alt: "Memory 5" },
  { src: img6, alt: "Memory 6" },
];

// Delay stagger disamakan dengan framer-motion sebelumnya
// (staggerChildren 0.22 / delayChildren 0.15, mengikuti urutan render).
const stagger = (i) => ({
  "--anim-delay": `${0.15 + i * 0.22}s`,
  "--anim-from": "24px",
});

export default function Memories() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-x-hidden">
      <LakeBackground className="-z-10" />

      <section className="relative z-10 flex flex-1 flex-col items-center gap-6 px-4 py-10 text-center sm:gap-8 sm:py-14">
        <div style={stagger(0)} className="anim-rise anim-run space-y-1">
          <p className="pacifico text-sm uppercase tracking-[0.3em] text-[#2c4a40]/70 sm:text-base">
            a little scroll through time
          </p>
          <h1 className="yuyu text-3xl text-[#2c4a40] drop-shadow-[0_2px_6px_rgba(255,255,255,0.65)] sm:text-5xl">
            Memories
          </h1>
          <p className="pacifico mx-auto mt-2 max-w-xs text-sm text-[#2c4a40]/80 sm:max-w-sm sm:text-base">
            &ldquo;Setiap foto ini adalah alasan kecil kenapa aku jatuh cinta
            berkali-kali sama kamu.&rdquo;
          </p>
        </div>

        <div
          style={stagger(1)}
          className="anim-rise anim-run w-full max-w-3xl flex-1 min-h-70"
        >
          <InfiniteSpiral
            items={images}
            animationMode="all"
            speed={0.5}
            radius={170}
            cardWidth={100}
            cardHeight={100}
            verticalSpacing={62}
            perspective={1000}
            cardRadius={14}
            centerScale={1.25}
            edgeBlur={5}
            cardsPerTurn={7}
            pauseOnHover
            direction="up"
            imageFit="cover"
            grayscale={0}
          />
        </div>

        <div style={stagger(2)} className="anim-rise anim-run mt-1 sm:mt-2">
          <Link to="/message">
            <Button>NEXT</Button>
          </Link>
        </div>

        {/* decorative romantic quotes, corners only on larger screens so
            they never crowd the gallery on small phones (drift + fade-nya
            murni CSS lewat .quote-drift--up / .quote-drift--down) */}
        <p
          aria-hidden="true"
          className="quote-drift--up pacifico pointer-events-none absolute left-6 top-24 hidden max-w-40 -rotate-6 text-sm text-[#2c4a40]/60 sm:block"
        >
          &ldquo;home isn&apos;t a place, it&apos;s you.&rdquo;
        </p>
        <p
          aria-hidden="true"
          className="quote-drift--down pacifico pointer-events-none absolute bottom-24 right-6 hidden max-w-40 rotate-6 text-right text-sm text-[#2c4a40]/60 sm:block"
        >
          &ldquo;every memory with you is my favorite one.&rdquo;
        </p>
      </section>
    </main>
  );
}
