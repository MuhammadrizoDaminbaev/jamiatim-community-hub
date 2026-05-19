export const CATEGORIES = [
  { id: "talim", label: "Ta'lim" },
  { id: "tibbiyot", label: "Tibbiyot" },
  { id: "dunyoviy", label: "Dunyoviy" },
  { id: "oila", label: "Oila" },
  { id: "ish", label: "Ish va kasb" },
  { id: "ruhiy", label: "Ruhiy holat" },
  { id: "boshqa", label: "Boshqa" },
] as const;

export const categoryLabel = (id: string) =>
  CATEGORIES.find((c) => c.id === id)?.label ?? id;
