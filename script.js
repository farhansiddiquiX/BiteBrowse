// script.js
// ===================
// Helper & State
// ===================
let allMeals = [];          // holds the full search result
let currentOffset = 0;      // how many we’ve rendered so far
const PAGE_SIZE = 10;       // show 10 at a time

async function fetchRecipes(searchInput) {
  const recipeCon = document.querySelector(".recipe-container");
  const loadBtn   = document.getElementById("loadMore");
  recipeCon.innerHTML = "<h2>Fetching Recipes…</h2>";
  loadBtn.style.display = "none";

  try {
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(searchInput)}`
    );
    const { meals } = await res.json();

    if (!meals) {
      recipeCon.innerHTML = "<p>No recipes found.</p>";
      return;
    }

    // store the full set & reset pagination
    allMeals = meals;
    currentOffset = 0;
    recipeCon.innerHTML = "";    // clear before first page

    renderNextPage();
  } catch (err) {
    console.error(err);
    recipeCon.innerHTML = "<p>Failed to fetch recipes.</p>";
  }
}

function renderNextPage() {
  const recipeCon = document.querySelector(".recipe-container");
  const loadBtn   = document.getElementById("loadMore");

  // slice out the next PAGE_SIZE items
  const nextBatch = allMeals.slice(currentOffset, currentOffset + PAGE_SIZE);
  nextBatch.forEach((meal) => {
    const div = document.createElement("div");
    div.classList.add("recipe");
    div.innerHTML = `
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
      <h3>${meal.strMeal}</h3>
      <p>${meal.strArea} Dish</p>
      <p>Category: ${meal.strCategory}</p>
    `;
    const btn = document.createElement("button");
    btn.textContent = "View Recipe";
    btn.addEventListener("click", () => {
      window.location.href = `recipepage.html?id=${meal.idMeal}`;
    });
    div.appendChild(btn);
    recipeCon.appendChild(div);
  });

  currentOffset += nextBatch.length;

  // show or hide the Load More button
  if (currentOffset < allMeals.length) {
    loadBtn.style.display = "block";
  } else {
    loadBtn.style.display = "none";
  }
}

// build ingredients list (used by both pages)
function fetchIngredients(meal) {
  let list = "";
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    if (!ing) break;
    const m = meal[`strMeasure${i}`] || "";
    list += `<li>${m} ${ing}</li>`;
  }
  return list;
}

// fetch recipe by ID (recipepage.html)
async function fetchRecipeById(id) {
  const container = document.querySelector(".recipe-detail");
  container.innerHTML = "<h2>Loading Recipe…</h2>";
  try {
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(id)}`
    );
    const { meals } = await res.json();
    if (!meals) {
      container.innerHTML = "<p>No recipe found.</p>";
      return;
    }
    const m = meals[0];
    container.innerHTML = `
      <img src="${m.strMealThumb}" alt="${m.strMeal}">
      <h1>${m.strMeal}</h1>
      <h2>${m.strArea} Dish</h2>
      <h3>Category: ${m.strCategory}</h3>
      <iframe src="${m.strYoutube.replace("watch?v=", "embed/")}"
              title="YouTube Recipe Video"
              frameborder="0" allowfullscreen></iframe>
      <div class="ingre">
        <h3>Ingredients:</h3><ul>${fetchIngredients(m)}</ul>
      </div>
      <div class="instructions">
        <h3>Instructions</h3><p>${m.strInstructions}</p>
      </div>
    `;
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load recipe.</p>";
  }
}

// ===================
// DOM Ready
// ===================
document.addEventListener("DOMContentLoaded", () => {
  // wire up search
  const form = document.querySelector("form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = document.querySelector(".searchBox").value.trim();
      if (!q) return;
      window.location.href = `index.html?search=${encodeURIComponent(q)}`;
    });
  }

  // load‐more button
  const loadBtn = document.getElementById("loadMore");
  if (loadBtn) {
    loadBtn.addEventListener("click", renderNextPage);
  }

  // index.html logic
  if (document.querySelector(".recipe-container")) {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("search") || "";
    document.querySelector(".searchBox").value = q;
    fetchRecipes(q);
  }

  // recipepage.html logic
  if (document.querySelector(".recipe-detail")) {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) fetchRecipeById(id);
  }
});
