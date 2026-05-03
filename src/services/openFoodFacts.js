export async function searchProduct(query) {
  const url = `https://world.openfoodfacts.net/cgi/search.pl`
          + `?search_terms=${encodeURIComponent(query)}`
          + `&search_simple=1&action=process&json=1&page_size=1`;

  const res = await fetch(url);
  const data = await res.json();
  return data.products?.[0] || null;
}