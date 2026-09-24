import { Link } from "react-router-dom";
import MountainBackground from "../components/backgrounds/MountainBackground";
import Typewriter from "../components/typewriter";
import PhotoFrame from "../components/photoFrame";
import Button from "../components/button";
import useReveal from "../lib/useReveal";
import img7 from "../assets/7.webp";
import img2 from "../assets/2.webp";
import img8 from "../assets/8.webp";

// TODO: ganti dengan pesan spesial yang benar-benar kamu mau sampaikan.
const specialMessage = `Selamat ulang tahun, sayang. Di hari spesialmu ini, aku cuma ingin kamu tahu betapa bersyukurnya aku bisa mengenal dan menjalani banyak hal bersamamu. Terima kasih sudah menjadi seseorang yang selalu punya tempat istimewa di hidupku, untuk setiap cerita, tawa, dan bahkan hari-hari yang nggak selalu mudah. Semoga di usia barumu ini, kamu selalu dikelilingi hal-hal baik, diberi kesehatan, dan dipertemukan dengan banyak alasan untuk tersenyum.
`;

export default function Message() {
  // Tombol NEXT dulu memakai whileInView; sekarang animasinya CSS dan
  // useReveal hanya menandai kapan tombolnya masuk viewport.
  const [nextRef, nextRevealed] = useReveal();

  return (
    <main className="relative flex min-h-dvh flex-col items-center overflow-x-hidden px-6 py-12 text-center">
      <MountainBackground className="-z-10" />

      <div
        style={{ "--anim-from": "-18px", "--anim-dur": "0.8s" }}
        className="anim-rise anim-run"
      >
        <p className="pacifico text-sm uppercase tracking-[0.3em] text-[#4a3826]/70 sm:text-base">
          a little something
        </p>
        <h1 className="yuyu text-3xl text-[#4a3826] drop-shadow-[0_2px_8px_rgba(255,255,255,0.6)] sm:text-5xl">
          Message
        </h1>
      </div>

      <div
        style={{
          "--anim-from": "18px",
          "--anim-dur": "0.7s",
          "--anim-delay": "0.4s",
          "--anim-ease": "ease-out",
        }}
        className="anim-rise anim-run mt-8 w-full max-w-xl rounded-3xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm sm:mt-10 sm:p-8"
      >
        <Typewriter
          text={specialMessage}
          startDelay={700}
          speed={28}
          className="yuyu whitespace-pre-line text-lg leading-relaxed text-[#4a3826] sm:text-xl"
        />
      </div>

      {/* decorative photos */}
      <div className="mt-10 flex w-full max-w-2xl flex-wrap items-start justify-center gap-4 sm:mt-14 sm:gap-8">
        <PhotoFrame src={img7} alt="Kenangan 1" rotate={-6} delay={0.1} />
        <PhotoFrame
          src={img2}
          alt="Kenangan 2"
          rotate={4}
          delay={0.25}
          className="mt-4 sm:mt-8"
        />
        <PhotoFrame src={img8} alt="Kenangan 3" rotate={-3} delay={0.4} />
      </div>

      <div
        ref={nextRef}
        style={{ "--anim-from": "16px", "--anim-dur": "0.7s", "--anim-delay": "0.15s" }}
        className={`anim-rise ${
          nextRevealed ? "is-revealed" : "anim-hold"
        } mt-10 sm:mt-14`}
      >
        <Link to="/reason">
          <Button>NEXT</Button>
        </Link>
      </div>
    </main>
  );
}
