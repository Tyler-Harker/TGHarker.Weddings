// Pure constants/types shared by both client and server code — no server-only
// imports here so client components can use it without pulling in `pg`.

export type MealChoice = "fried_chicken" | "brisket";

export interface MealOption {
  id: MealChoice;
  name: string;
  description: string;
  image: string;
}

export const MEAL_OPTIONS: MealOption[] = [
  {
    id: "fried_chicken",
    name: "Country Fried Chicken",
    description: "Crispy country-fried chicken with white gravy and street corn.",
    image: "/meals/fried-chicken.png",
  },
  {
    id: "brisket",
    name: "Smoked Brisket",
    description: "Slow-smoked, hand-carved beef brisket.",
    image: "/meals/brisket.png",
  },
];

export const MEAL_CHOICES: MealChoice[] = MEAL_OPTIONS.map((m) => m.id);

export function isMealChoice(value: unknown): value is MealChoice {
  return typeof value === "string" && MEAL_CHOICES.includes(value as MealChoice);
}
