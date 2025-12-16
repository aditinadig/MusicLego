export type SampleName = "E2" | "E3" | "E4" | "E5";

export type SampleDef = {
  name: SampleName;
  midi: number;
  url: string; // from /public
};

export const GUITAR_SAMPLE_DEFS: SampleDef[] = [
  { name: "E2", midi: 40, url: "/E2.wav" },
  { name: "E3", midi: 52, url: "/E3.wav" },
  { name: "E4", midi: 64, url: "/E4.wav" },
  { name: "E5", midi: 76, url: "/E5.wav" },
];