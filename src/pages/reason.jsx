import PaintingBackground from "../components/PaintingBackground";

export default function Reason() {
  return (
    <main className="relative h-screen overflow-hidden p-10">
      <PaintingBackground scene="meadow" className="-z-10" />

      <section className="relative z-10 flex h-full flex-col items-center justify-center gap-6">
        <h1 className="text-center text-3xl font-semibold text-[#6b4a1f] drop-shadow-[0_2px_6px_rgba(255,255,255,0.65)]">
          Reason
        </h1>
      </section>
    </main>
  );
}
