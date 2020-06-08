// Global array for stashing ingredient list for selected recipe
let ingredientArray = [];
let currentRecipe = {};

// TODO: for testing only
ingredientArray = [
  {id: 0,
    name: "All-purpose flour",
    imperialQty: 2,
    imperialUnit: "Cup",
    metricQty: 250,
    metricUnit: "g",
    calories: 910,
    protein: 26,
    carbs: 190,
    fat: 2.4,
    recipeID: 0},
  {id: 1,
    name: "Sugar",
    imperialQty: 0.75,
    imperialUnit: "Cup",
    metricQty: 150,
    metricUnit: "g",
    calories: 576,
    protein: 0,
    carbs: 150,
    fat: 0,
    recipeID: 0},
  {id: 2,
    name: "Butter, softened",
    imperialQty: 0.5,
    imperialUnit: "Cup",
    metricQty: 112,
    metricUnit: "g",
    calories: 816,
    protein: 1,
    carbs: 0.1,
    fat: 96,
    recipeID: 0}];

// Once DOM is full loaded, add in the appropriate page definition
// Use its callback to load the rest of the event handlers.
$(document).ready(function() {
  // TODO: Need some way to know which sub-page to load
  $("#main-content").load("add.html", function(){
    // These are needed for every page
    $(".dropdown-trigger").dropdown();
    $("select").formSelect();
    // These are just for the Add/Update page
    $("#saveBtn").click(saveRecipe);
    $("#resetBtn").click(resetForm);
    $("#ingredBtn").click(saveIngredient);
    $("#deleteBtn").click(deleteIngredient);
    $(".tr").click(editIngredient);

    // TODO: Need some way to know if we are adding new recipe, or updating existing recipe (and its id),
    // or know which recipe id to display on search page
    $.get("/api/recipe_data").then(function(data) {
      if (data.id) {
        loadRecipeData(data);
      }
      else {
        clearRecipeData(true);
      };
    })
    // .catch(function(error) {
    //   clearRecipeData(true);
    // });
  }) 
});

// Save button click event - adds/updates recipe and all ingredients
function saveRecipe(event) {

};

// Reset button click event - clears all fields, including ingredients and nutrition info
function resetForm(event) {
  clearRecipeData(false);
};

// Ingredient Save click event - adds/updates ingredient
function saveIngredient(event) {
  calculateNutrition();
};

// Ingredient Delete click event - deletes selected ingredient
function deleteIngredient(event) {
  calculateNutrition();
};

// Ingredient table row click event - edit ingredient
function editIngredient(event) {
  // Do nothing if they click on header row
  if ($(this).rowIndex > 0) {
    ingredientArray[$(this).rowIndex]
  };
};

// Load the passed recipe object into the data fields; retrieve ingredients, too
function loadRecipeData(recipeData) {
  // Set value of recipe global
  currentRecipe = recipeData;

  // Set values of all the main recipe fields
  $("#title").val(currentRecipe.title);
  $("#source").val(currentRecipe.source);
  $("#public").val(currentRecipe.public);
  $("#category1").val(currentRecipe.category1);
  $("#category2").val(currentRecipe.category2);
  $("#category3").val(currentRecipe.category3);
  $("#recipe-desc").val(currentRecipe.description);
  $("#prep-time").val(currentRecipe.prepTime);
  $("#cook-time").val(currentRecipe.cookTime);
  $("#num-servings").val(currentRecipe.numServings);
  $("#instructions").val(currentRecipe.instructions);

  // Set oven temp based on if Imperial or Metric
  if ($("#imperial").val()) {
    $("#oven-temp").val(currentRecipe.ovenTempF);
  }
  else {
    $("#oven-temp").val(currentRecipe.ovenTempC);
  };

  // Retrieve ingredients for this recipe
  $.get("/api/ingredient_data:" + currentRecipe.id).then(function(data) {
    ingredientArray = data;
  });
};

// Clear all fields
function clearRecipeData(resetForm) {
  // If not called from the Reset button on click handler, then need to reset form
  if (resetForm) {
    $(".recipe-form")[0].reset();
  };

  // Clear globals
  currentRecipe = {};
  ingredientArray = [];

  // Clear ingredient add/update form
  $(".ingredient-form")[0].reset();

  // Clear ingredient table
  $("#ingredient-body").children().remove();

  // Clear nutrition fields
  calculateNutrition();
};

// Loop through all ingredients to calculate total nutrition info
function calculateNutrition() {
  // Initialize counters
  let calories = 0;
  let protein = 0;
  let carbohydrates = 0;
  let fat = 0;

  // Loop through and sum nutrition info
  ingredientArray.forEach(item => {
    calories += item.calories;
    protein += item.protein;
    carbohydrates += item.carbs;
    fat += item.fat;
  });

  // Update display fields
  $("#calories").val(calories); 
  $("#protein").val(protein); 
  $("#carbohydrates").val(carbohydrates); 
  $("#fat").val(fat); 
  M.updateTextFields(); // Labels won't move out of the way if you don't do this
};

function getDecimal(number) {
  // If already a number, then no conversion needed
  if (!isNaN(number)) {
    return number
  }
  else {
    let wholeNum = 0;
    let numerator = 0;
    let denominator = 1;

    let nums = number.split("/");
    let leftSide = nums[0].split(" ",2);

    // If nums length is 1, then there was no slash. 
    // If, for some reason, there is more than one slash, just ignore anything beyond the first
    if (nums.length > 1) {
      denominator = parseInt(nums[1]);
    };

    // If leftSide length is 1, then there was only one number to the left of the slash, or no slash at all
    if (leftSide.length === 1) {
      numerator = parseInt(leftSide[0]);
    }
    // The whole number is the first number that is followed by a space, numerator is next number
    // If, for some reason, there is more than two numbers separated by a space, just ignore anything after the first two
    else {
      wholeNum = parseInit(leftSide[0]);
      numerator = parseInt(leftSide[1]);
    };

    // Double check that everything is a number; if not, reset to defaults
    if (isNaN(wholeNum)) {
      wholeNum = 0;
    };

    if (isNaN(numerator)) {
      numerator = 0;
    };

    if (isNaN(denominator)) {
      denominator = 1;
    };

    return wholeNum + (numerator / denominator);
  };
};

function getFraction(decimal) {
  // Make sure input is a number
  if (isNaN(decimal)) {
    return decimal
  }
  // If integer then no calculation needed
  else if (Number.isInteger(decimal)) {
    return decimal.toString()
  };

  let wholeNum = Math.trunc(decimal);
  let fraction = (decimal - wholeNum).toFixed(2);
  let fractionString = "";

  // These are the only fractional values allowed in cooking
  switch (fraction) {
    case 0.25: 
      fractionString = "1/4";
      break;
    case 0.33:
      fractionString = "1/3";
      break;
    case 0.5:
      fractionString = "1/2";
      break;
    case 0.67:
      fractionString = "2/3";
      break;
    case 0.75:
      fractionString = "3/4";
    // Default action is to remain blank string
  };

  if (wholeNum > 0) {
    return wholeNum.toString() + " " + fractionString;
  }
  else {
    return fractionString;
  };
};