import manifest from "../data/images.json";

const key = (name: string) =>
  name
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");
const restaurants = new Map(
  manifest.restaurants.map((image) => [key(image.name), image]),
);
const items = new Map(
  manifest.items.map((image) => [
    `${key(image.restaurant)}:${key(image.name)}`,
    image,
  ]),
);

/** Solo coincidencias exactas de restaurante y producto; nunca una foto genérica. */
export function restaurantImage(name: string) {
  return restaurants.get(key(name)) ?? null;
}

export function restaurantItemImage(restaurant: string, item: string) {
  return items.get(`${key(restaurant)}:${key(item)}`) ?? null;
}
