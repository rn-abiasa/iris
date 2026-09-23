import PaintingBackground from "../components/PaintingBackground";

export default function Message() {
  return (
    <main className="relative h-screen overflow-hidden p-10">
      <PaintingBackground scene="mountains" className="-z-10" />

      <section className="relative z-10 flex h-full flex-col items-center justify-center gap-6">
        <h1 className="text-center text-3xl font-semibold text-[#4a3826] drop-shadow-[0_2px_6px_rgba(255,255,255,0.65)]">
          Message
        </h1>
      </section>
    </main>
  );
}
