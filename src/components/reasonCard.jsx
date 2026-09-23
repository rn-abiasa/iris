export default function ReasonCard({ index, text }) {
  return (
    <div className="flex h-full w-full flex-col justify-between rounded-2xl border border-[#e8c26e]/60 bg-[#fff8e6] p-6 text-left shadow-inner sm:p-8">
      <span className="pacifico text-4xl leading-none text-[#e8c26e] sm:text-5xl">
        &ldquo;
      </span>
      <p className="yuyu text-lg text-[#6b4a1f] sm:text-xl">{text}</p>
      <span className="text-right text-xs uppercase tracking-[0.3em] text-[#6b4a1f]/50">
        alasan #{index + 1}
      </span>
    </div>
  );
}
