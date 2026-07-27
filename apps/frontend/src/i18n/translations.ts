import type { Product } from "@qai-shop/shared";

export type Lang = "pl" | "en";

export const LANGS: Lang[] = ["pl", "en"];
export const DEFAULT_LANG: Lang = "pl";

export const LANG_META: Record<Lang, { flag: string; label: string }> = {
  pl: { flag: "🇵🇱", label: "Polski" },
  en: { flag: "🇬🇧", label: "English" },
};

export const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  pl: {
    "logo.home": "Strona główna",
    "header.cart": "Koszyk",
    "header.logout": "Wyloguj",
    "lang.aria": "Wybór języka",

    "login.title": "Zaloguj się",
    "login.simulated": "Logowanie symulowane.",
    "login.credentials": "Dane do logowania:",
    "login.username": "Nazwa użytkownika",
    "login.password": "Hasło",
    "login.submit": "Zaloguj się",
    "login.submitting": "Logowanie...",
    "login.error.credentials": "Nieprawidłowa nazwa użytkownika lub hasło.",
    "login.error.generic": "Nie udało się zalogować. Sprawdź, czy backend działa.",

    "products.title": "Produkty",
    "common.loading": "Ładowanie...",
    "products.error": "Nie udało się pobrać produktów.",
    "products.adding": "Dodaję...",
    "products.addToCart": "Do koszyka",
    "products.details": "Szczegóły",
    "products.added": "Dodano do koszyka",

    "product.notFound": "Nie znaleziono produktu.",
    "product.missing": "Brak produktu",
    "product.backToList": "← Powrót do listy",
    "product.quantity": "Ilość:",
    "product.quantityAria": "Liczba sztuk",
    "product.decrease": "Zmniejsz",
    "product.increase": "Zwiększ",
    "product.back": "← Powrót",

    "cart.title": "Koszyk",
    "cart.checkoutError": "Nie udało się sfinalizować zakupu.",
    "cart.empty": "Twój koszyk jest pusty.",
    "cart.backToProducts": "← Powrót do listy produktów",
    "cart.quantityFor": "Ilość: {title}",
    "cart.remove": "Usuń",
    "cart.total": "Razem ({count} szt.):",
    "cart.backToList": "← Powrót do listy",
    "cart.processing": "Przetwarzanie...",
    "cart.buyNow": "Kup teraz",

    "summary.title": "Dziękujemy za zakup!",
    "summary.message": "Dziękujemy! Twoje zamówienie zostało opłacone i przyjęte do realizacji.",
    "summary.orderId": "Numer zamówienia",
    "summary.itemsCount": "Liczba produktów",
    "summary.paid": "Zapłacono",
    "summary.backToShop": "Wróć do sklepu",
  },
  en: {
    "logo.home": "Home",
    "header.cart": "Cart",
    "header.logout": "Log out",
    "lang.aria": "Language selection",

    "login.title": "Sign in",
    "login.simulated": "Simulated login.",
    "login.credentials": "Login credentials:",
    "login.username": "Username",
    "login.password": "Password",
    "login.submit": "Sign in",
    "login.submitting": "Signing in...",
    "login.error.credentials": "Invalid username or password.",
    "login.error.generic": "Sign-in failed. Check that the backend is running.",

    "products.title": "Products",
    "common.loading": "Loading...",
    "products.error": "Failed to load products.",
    "products.adding": "Adding...",
    "products.addToCart": "To cart",
    "products.details": "Details",
    "products.added": "Added to cart",

    "product.notFound": "Product not found.",
    "product.missing": "No product",
    "product.backToList": "← Back to list",
    "product.quantity": "Quantity:",
    "product.quantityAria": "Item quantity",
    "product.decrease": "Decrease",
    "product.increase": "Increase",
    "product.back": "← Back",

    "cart.title": "Cart",
    "cart.checkoutError": "Checkout failed.",
    "cart.empty": "Your cart is empty.",
    "cart.backToProducts": "← Back to products",
    "cart.quantityFor": "Quantity: {title}",
    "cart.remove": "Remove",
    "cart.total": "Total ({count} items):",
    "cart.backToList": "← Back to list",
    "cart.processing": "Processing...",
    "cart.buyNow": "Buy now",

    "summary.title": "Thank you for your purchase!",
    "summary.message": "Thank you! Your order has been paid and accepted for processing.",
    "summary.orderId": "Order number",
    "summary.itemsCount": "Number of items",
    "summary.paid": "Paid",
    "summary.backToShop": "Back to shop",
  },
};

/**
 * Translations of product (seed) data by slug/id.
 * PL comes from the API (database); here we keep EN overrides.
 */
const PRODUCT_EN: Record<string, { title: string; description: string }> = {
  "qai-mug": {
    title: "Mug",
    description:
      "Ceramic 350 ml mug with the QAI logo. Perfect for your morning coffee before an exploratory testing session.",
  },
  "qai-tshirt": {
    title: "T-shirt",
    description:
      "Cotton T-shirt with a 'Trust, but verify' print. Soft, breathable, in graphite grey.",
  },
  "qai-hoodie": {
    title: "Hoodie",
    description:
      "Warm hooded sweatshirt for the QA team. Kangaroo pocket and embroidered logo on the chest.",
  },
  "qai-stickers": {
    title: "Sticker set",
    description: "A set of 12 vinyl laptop stickers: bugs, green tests and AI workflow.",
  },
  "qai-notebook": {
    title: "Notebook",
    description:
      "A5 dotted notebook, 160 pages. For test scenarios, ideas and architecture sketches.",
  },
  "qai-bottle": {
    title: "Bottle",
    description:
      "Stainless steel thermal bottle 500 ml. Keeps temperature for 12 hours. Stay hydrated between builds.",
  },
};

/** Returns a product with title/description in the selected language (EN overrides from the map, fallback = API value). */
export function translateProduct(lang: Lang, product: Product): Product {
  if (lang === "en") {
    const en = PRODUCT_EN[product.id];
    if (en) return { ...product, title: en.title, description: en.description };
  }
  return product;
}

/** Translates just the product title by id (e.g. for cart items); fallback = the given PL title. */
export function translateProductTitle(lang: Lang, id: string, fallback: string): string {
  if (lang === "en") return PRODUCT_EN[id]?.title ?? fallback;
  return fallback;
}
