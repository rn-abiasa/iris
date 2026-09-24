import { useEffect, useRef, useState } from "react";

// =============================================================================
// useReveal.js — pengganti ringan untuk `whileInView` milik framer-motion.
//
// Kembalikan `[ref, revealed]`: pasang `ref` ke elemennya, lalu pakai
// `revealed` untuk menukar class `anim-hold` -> `is-revealed`. Animasinya tetap
// 100% CSS (lihat seksi "Animasi entrance / idle" di src/index.css); hook ini
// hanya menandai kapan animasinya boleh jalan.
//
//   const [ref, revealed] = useReveal({ amount: 0.4 });
//   <div ref={ref} className={`anim-rise ${revealed ? "is-revealed" : "anim-hold"}`} />
//
// amount : porsi elemen yang harus terlihat dulu — sama artinya dengan
//          `viewport={{ amount: 0.4 }}` di framer-motion (0 = "some").
// once   : kalau true, observer dilepas setelah reveal pertama, sama seperti
//          `viewport={{ once: true }}`.
// =============================================================================
export default function useReveal({ amount = 0, once = true } = {}) {
  const ref = useRef(null);

  // Lazy initial state (bukan setState di dalam effect, sekaligus aman dari
  // rule react-hooks/set-state-in-effect):
  //  - tanpa IntersectionObserver (browser lawas) -> langsung dianggap reveal
  //  - prefers-reduced-motion: reduce -> langsung dianggap reveal supaya isi
  //    halaman tampil penuh dan tanpa animasi (CSS juga mematikannya)
  const [revealed, setRevealed] = useState(
    () =>
      typeof IntersectionObserver === "undefined" ||
      (typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setRevealed(false);
          }
        }
      },
      { threshold: amount }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [amount, once]);

  return [ref, revealed];
}
