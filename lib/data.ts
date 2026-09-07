export type Track = {
  id: string;
  name: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  modules: number;
  completed: number;
  color: string;
  icon: string;
};

export const tracks: Track[] = [
  { id: "ccna", name: "CCNA", description: "Build a rock-solid networking foundation.", level: "Beginner", modules: 24, completed: 14, color: "cyan", icon: "◈" },
  { id: "ccnp", name: "CCNP Enterprise", description: "Design and troubleshoot enterprise networks.", level: "Advanced", modules: 32, completed: 7, color: "violet", icon: "⌁" },
  { id: "ethical-hacking", name: "Ethical Hacking", description: "Think like an attacker. Defend like a pro.", level: "Intermediate", modules: 28, completed: 18, color: "amber", icon: "⌬" }
];

export const weeklyActivity = [42, 67, 52, 88, 73, 94, 62];

export const modules = [
  { id: "subnetting", track: "CCNA", title: "IPv4 Subnetting", category: "Networking", duration: "42 min", progress: 72, status: "In progress", accent: "cyan" },
  { id: "scanning", track: "Ethical Hacking", title: "Network Reconnaissance", category: "Offensive Security", duration: "38 min", progress: 100, status: "Completed", accent: "amber" },
  { id: "ospf", track: "CCNP Enterprise", title: "OSPF Multi-Area", category: "Routing", duration: "51 min", progress: 24, status: "In progress", accent: "violet" }
];

export const stats = [
  { label: "Day streak", value: "12", suffix: "days", icon: "flame" },
  { label: "Learning time", value: "18.4", suffix: "hours", icon: "clock" },
  { label: "Labs completed", value: "28", suffix: "labs", icon: "shield" }
];
