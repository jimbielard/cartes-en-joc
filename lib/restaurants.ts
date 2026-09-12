export type PlaceRestaurant = {
  id: string;
  name: string;
  area: string;
  rating: number | null;
  type: string;
  price: string;
  description: string;
  keywords: string[];
};

export function normalizeRestaurantText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
}

export function toPlaceRestaurant(restaurant: { id: string; name: string; area: string; cuisine: string }): PlaceRestaurant {
  return { id: `local-${restaurant.id}`, name: restaurant.name, area: restaurant.area, type: restaurant.cuisine, rating: null, price: "", description: "Afegit per la comunitat", keywords: [restaurant.name, restaurant.area, restaurant.cuisine] };
}
