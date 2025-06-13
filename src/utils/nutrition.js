// Utility functions to automatically fetch nutrition information based on
// user location and dish name.

const FSQ_API_KEY = process.env.REACT_APP_FSQ_API_KEY; // Foursquare Places API
const EDAMAM_APP_ID = process.env.REACT_APP_EDAMAM_APP_ID; // Edamam Nutrition API
const EDAMAM_APP_KEY = process.env.REACT_APP_EDAMAM_APP_KEY;

export async function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation nicht unterstützt'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => reject(err)
    );
  });
}

export async function fetchNearbyRestaurants(lat, lon) {
  if (!FSQ_API_KEY) return [];
  const url = `https://api.foursquare.com/v3/places/search?ll=${lat},${lon}&query=restaurant&limit=5`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json', Authorization: FSQ_API_KEY } });
    if (!res.ok) throw new Error('Foursquare API Fehler');
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error('Fehler beim Abrufen der Restaurants:', err);
    return [];
  }
}

export async function fetchText(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export function extractNutritionFromMenu(html, dish) {
  if (!html) return null;
  const snippetIndex = html.toLowerCase().indexOf(dish.toLowerCase());
  if (snippetIndex === -1) return null;
  const snippet = html.slice(snippetIndex, snippetIndex + 500);
  const calories = /([0-9]+)\s?kcal/i.exec(snippet);
  const protein = /([0-9]+)g[^\n]*protein/i.exec(snippet);
  const carbs = /([0-9]+)g[^\n]*carb/i.exec(snippet);
  const fat = /([0-9]+)g[^\n]*fat/i.exec(snippet);
  if (calories || protein || carbs || fat) {
    return {
      calories: calories ? parseInt(calories[1]) : null,
      protein: protein ? parseInt(protein[1]) : null,
      carbs: carbs ? parseInt(carbs[1]) : null,
      fat: fat ? parseInt(fat[1]) : null,
    };
  }
  return null;
}

export async function fetchNutritionForDish(dish) {
  if (!EDAMAM_APP_ID || !EDAMAM_APP_KEY) return null;
  const encoded = encodeURIComponent(dish);
  const url = `https://api.edamam.com/api/nutrition-data?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}&ingr=${encoded}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Edamam API Fehler');
    const data = await res.json();
    if (data && typeof data.calories === 'number') {
      return {
        calories: data.calories,
        protein: data.totalNutrients.PROCNT?.quantity || null,
        carbs: data.totalNutrients.CHOCDF?.quantity || null,
        fat: data.totalNutrients.FAT?.quantity || null,
      };
    }
  } catch (err) {
    console.error('Fehler bei der Nährwertabfrage:', err);
  }
  return null;
}

export async function getNutritionForFood(dish) {
  try {
    const pos = await getCurrentPosition();
    const restaurants = await fetchNearbyRestaurants(pos.lat, pos.lon);
    for (const r of restaurants) {
      const url = r.menuUrl || r.website || r.url;
      if (!url) continue;
      const html = await fetchText(url);
      const n = extractNutritionFromMenu(html, dish);
      if (n) return n;
    }
    const fallback = await fetchNutritionForDish(dish);
    return fallback;
  } catch (err) {
    console.error('Automatische Nährwertsuche fehlgeschlagen:', err);
    return null;
  }
}

