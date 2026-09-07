import { ByteBreachLogo } from "@/components/ByteBreachLogo";

export default function Loading() {
  return (
    <div className="grid min-h-screen place-items-center grid-bg bg-[#080b12] text-slate-200">
      <div className="flex flex-col items-center gap-5">
        {/* Official ByteBreach Animated Cyber Logo */}
        <div className="relative">
          <ByteBreachLogo size={72} animated={true} />
        </div>

        {/* Status Line */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="eyebrow text-cyan tracking-widest text-[10px]">
            SYNCHRONIZING TERMINAL
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs text-muted">
            <span>Decrypting academy nodes</span>
            <span className="inline-flex gap-0.5">
              <span className="animate-bounce text-cyan" style={{ animationDelay: "0ms" }}>.</span>
              <span className="animate-bounce text-cyan" style={{ animationDelay: "150ms" }}>.</span>
              <span className="animate-bounce text-cyan" style={{ animationDelay: "300ms" }}>.</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
