import type { Metadata } from "next";
import { PublicPage } from "@/components/PublicPage";

export const metadata: Metadata = {
  title: "About Us | Mission & Vision",
  description:
    "ByteBreach exists to build the next breach-proof generation through hands-on simulated cyber warfare, enterprise networking curricula, and gamified CTF challenges.",
};

export default function AboutPage() {
  return (
    <PublicPage eyebrow="About the academy" title="About ByteBreach Security Academy">
      <p>
        ByteBreach exists to build the next breach-proof generation through hands-on, simulated cyber warfare. Operatives learn by doing: packet analysis, networking engineering across CCNA, CCNP, and CCIE paths, ethical hacking, and authorized penetration testing.
      </p>
      <p>
        Our gamified progression engine turns consistent practice into visible momentum. Earn XP from Daily Challenges, complete structured study rooms, and capture flags on CTF practice targets while advancing through operative ranks.
      </p>
      <p>
        Every exercise is designed for controlled learning, defensive understanding, and responsible security research.
      </p>
    </PublicPage>
  );
}
