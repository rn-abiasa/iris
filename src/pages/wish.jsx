import DuskBackground from "../components/backgrounds/DuskBackground";

export default function Wish() {
  return (
    <main className="relative h-screen overflow-hidden p-10">
      <DuskBackground className="-z-10" />

      <section className="relative z-10 flex h-full flex-col items-center justify-center gap-6">
        <h1 className="text-center text-3xl font-semibold text-[#fdf6e3] drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
          Wish
        </h1>
      </section>
    </main>
  );
}
