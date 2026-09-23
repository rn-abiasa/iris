import Button from "../components/button";
import GardenBackground from "../components/backgrounds/GardenBackground";

export default function Cover() {
  return (
    <>
      <main className="relative h-screen overflow-hidden p-10">
        <GardenBackground className="-z-10" />

        <section className="relative z-10 flex h-full flex-col items-center justify-center gap-6">
          <h1 className="text-center text-3xl font-semibold text-[#3b3550] drop-shadow-[0_2px_6px_rgba(255,255,255,0.65)]">
            Happy Birthday My Lovee 🤍
          </h1>
          <Button>PRESS ME</Button>
        </section>
      </main>
    </>
  );
}
