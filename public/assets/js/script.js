// *********************
// GLOBALS FOR ALL PAGES
// *********************

// Need URL to determine which page to load, and which data
const url = window.location.search;
// Need to know if using Imperial or Metric Units; default to Imperial because we are AMERICANS!
let isImperial = true;
let currentPage = "";
let currentUser = {};
// Html for delete buttons
const delButtonHtml = `<button class="btn waves-effect waves-light teal darken-4 deleteBtn"><i
  class="material-icons left">clear</i><span class="hide-on-small-only">Delete</span></button>`;

// ******************
// ADD/UPDATE GLOBALS
// ******************
// Current recipe/ingredient being added/updated
let currentRecipe = {};
let currentIngredient = {};
// Global array for stashing ingredient list for selected recipe
let ingredientArray = [];
// Global to know if editing an existing ingredient or adding new one
let editingIngredient = false;

// ***************
// PROFILE GLOBALS
// ***************
// Html for edit buttons and public checkboxes
const editButtonHtml = `<button class="btn waves-effect waves-light teal darken-4 editBtn"><i
  class="material-icons left">edit</i><span class="hide-on-small-only">Edit</span></button>&nbsp;`;
// const publicCheckHtml =  `<label><input type="checkbox" class="filled-in" checked="checked" /></label>`;
const publicCheckedHtml = `<i class="material-icons">check</i>`;
const publicUncheckedHtml = `<i class="material-icons">not_interested</i>`;
// const publicCheckedkHtml =  `<input type="checkbox" class="filled-in" checked="checked"></input>`;
// const publicUncheckedHtml =  `<input type="checkbox" class="filled-in" checked="checked"></input>`;

// ***********************
// FUNCTIONS FOR ALL PAGES
// ***********************
// Once DOM is full loaded, add in the appropriate page definition
// Use its callback to load the rest of the event handlers.
$(document).ready(function () {

  // These are needed for every page
  function globalSetup() {
    $(".dropdown-trigger").dropdown(); // Makes Materialize dropdowns function
    $("select").formSelect(); // Makes Materialize select fields function
    $("#imperial").click(toggleUnits); // Event handler for Imperial/Metric unit selector
  };

  // If ?user_id not in URL, then we need search page
  if (url.indexOf("?user_id=") === -1) {
    $("#main-content").load("search.html", function () {
      currentPage = "search";
      globalSetup();
      toggleUnits();
      getCategories();
    });
  }
  // If we do have user_id, then we need either Profile or Add/Update pages
  else {
    let urlArray = url.split("="); // Could have user_id and recipe_id, just user_id, or neither
    let UserId = parseInt(urlArray[1]); // user_id is first
  
    // Get user data
    $.get("/api/user_data/" + UserId, function(data) {
      currentUser = data;
      $("#user-name").text("Welcome " + currentUser.firstName + " " + currentUser.lastName);

      // If ?recipe_id not in URL, then we need Profile page
      if (url.indexOf("?recipe_id=") === -1) {
        $("#main-content").load("profile.html", function () {
          currentPage = "profile";
          globalSetup();

          // These are just for the Manage Profile page
          $("#saveUserBtn").click(saveUser);
          $("#cancelBtn").click(cancelChanges);
          $(".addBtn").click(addRecipe);
          loadUserData(true);
        });
      }
      // If we do have recipe_id, then load Add/Update page
      else {
        let RecipeId = parseInt(urlArray[2]); // Will be last of 3 sections of URL

        $("#main-content").load("add.html", function () {
          currentPage = "add";
          globalSetup();

          // These are just for the Add/Update page
          $("#saveBtn").click(saveRecipe);
          $("#resetBtn").click(resetForm);
          $("#ingredBtn").click(saveIngredient);

          // Retrieve list of categories
          let newOption;
          const categoryList = $("#category_list"); // Use datalist, not select, to get down arrows

          $.get("/api/categories", function(data) {
            data.forEach(item => {
              newOption = $("<option>");
              newOption.data("value", item.id); // data-value is category id and is hidden
              newOption.attr("name", item.id); // name is also id and hidden
              newOption.val(item.name); // value is category name and is displayed
              newOption.attr("id", item.name); // used to find option later when saving recipe
              categoryList.append(newOption);

              // If RecipeId is -1, then we just need blank page; otherwise, get recipe data
              if (RecipeId !== -1) {
                $.get("/api/recipes/" + RecipeId, function(data) {
                  currentRecipe = data;
                  // Get its ingredients, too
                  $.get("/api/ingredients/" + RecipeId, function(result) {
                    ingredientArray = result;
                    toggleUnits();
                  });
                });
              };
            });
          });
        });
      };
    });
  };
}); // End of document ready function

function showPopup() {
  document.getElementById("loginPopup").style.display = "block";
};

// Convert field data to valid input for database
function getInteger(value) {
  let num = parseInt(value);
  if (isNaN(num)) {
    return null
  }
  else {
    return num
  };
};

// Imperial/Metric toggle on click event
function toggleUnits() {
  isImperial = $("#imperial")[0].checked; // Don't use "this" because sometimes called directly

  // If on Add/Update or Search pages, need to update display and data
  if ((currentPage === "add") || (currentPage === "search")) {
    if (isImperial) {
      $("#temp-label").text("Oven Temp (°F)");
      $("#imperialUnitDiv").removeAttr("hidden");
      $("#metricUnitDiv").attr("hidden", true);
    }
    else {
      $("#temp-label").text("Oven Temp (°C)");
      $("#metricUnitDiv").removeAttr("hidden");
      $("#imperialUnitDiv").attr("hidden", true);
    };

    loadRecipeData(); // Refresh recipe info to use correct units
  };
};

// Load the currentRecipe object and ingredients array into the data fields
function loadRecipeData() {

  // Sets each category field
  function setCategory(catNum, catID) {
    let catOption = $(`option[name="${catID}"`); //  <option> element for that category ID
    let catField = $(`#${catNum}`); // <input> element for current category

    // Make sure we found the option element before setting input element
    if (catOption.length > 0) {
      catField.val(catOption[0].value);
      catField.select();
    };
  };

  // Main loadRecipeData function
  if (currentRecipe !== {}) {
    // Set values of all the main recipe fields
    $("#title").val(currentRecipe.title);
    $("#source").val(currentRecipe.source);
    $("#public").val(currentRecipe.public);
    setCategory("category1", currentRecipe.category1);
    setCategory("category2", currentRecipe.category2);
    setCategory("category3", currentRecipe.category3);
    $("#recipe-desc").val(currentRecipe.description);
    M.textareaAutoResize($("#recipe-desc")); // Won't resize to fit data without this
    $("#prep-time").val(currentRecipe.prepTime);
    $("#cook-time").val(currentRecipe.cookTime);
    $("#num-servings").val(currentRecipe.numServings);
    $("#instructions").val(currentRecipe.instructions);
    M.textareaAutoResize($("#instructions")); // Won't resize to fit data without this

    // Set oven temp based on if Imperial or Metric
    if (isImperial) {
      $("#oven-temp").val(currentRecipe.ovenTempF);
    }
    else {
      $("#oven-temp").val(currentRecipe.ovenTempC);
    };

    // Create a table row for each ingredient
    const ingredTable = $("#ingredient-body");
    ingredTable.empty(); // Not sure why this is necessary, but there seemed to be objects attached at load
    let newRow;
    let qty;
    let unit;

    ingredientArray.forEach(item => {
      // Get correct quantity and unit based on Imperial/Metric
      if (isImperial) {
        qty = getFraction(item.imperialQty);
        unit = item.imperialUnit;
      }
      else {
        qty = item.metricQty;
        unit = item.metricUnit;
      };

      newRow = $("<tr>");
      newRow.append($("<td>").html(qty));
      newRow.append($("<td>").html(unit))
      newRow.append($("<td>").html(item.name));
      // Add Delete button if on Add/Update page only
      if (currentPage === "add") {
        newRow.append($("<td>").html(delButtonHtml));
      }
      ingredTable.append(newRow);
    });

    // Add event handlers after elements have been created, if on Add/Update page only
    if (currentPage === "add") {
      $(".deleteBtn").click(deleteIngredient);
      $("tr").click(editIngredient);
    };

    calculateNutrition();
  };
};

// Loop through all ingredients to calculate total nutrition info
function calculateNutrition(numServings) {
  // Validate numServings
  if ((isNaN(numServings)) || (numServings === 0)) {
    numServ = 1
  }
  else {
    numServ = numServings;
  };

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

  // Nutrition info is per serving
  calories /= numServ;
  protein /= numServ;
  carbohydrates /= numServ;
  fat /= numServ;

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
    let leftSide = nums[0].split(" ", 2);

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
      wholeNum = parseInt(leftSide[0]);
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
  let fraction = decimal - wholeNum;
  let fractionString = "";

  // 1/4, 1/3, 1/2, 2/3, and 3/4 are the only fractional values allowed in cooking
  if (fraction >= 0.85) {
    wholeNum++;  // Need to just round up to next whole number
  }
  else if (fraction >= 0.7) {
    fractionString = "3/4";
  }
  else if (fraction >= 0.6) {
    fractionString = "2/3";
  }
  else if (fraction >= 0.4) {
    fractionString = "1/2";
  }
  else if (fraction >= 0.3) {
    fractionString = "1/3";
  }
  else if (fraction >= 0.125) {
    fractionString = "1/4";
  }; // Default is to leave fractionString as empty string

  if (wholeNum > 0) {
    if (fractionString === "") {
      return wholeNum.toString()
    }
    else {
      return wholeNum.toString() + " " + fractionString
    };
  }
  else {
    return fractionString;
  };
};

// *****************************
// FUNCTIONS FOR ADD/UPDATE PAGE
// *****************************
// Save button click event - adds/updates recipe
function saveRecipe(event) {
  event.preventDefault();

  // Function to handle categories
  function getCategory(categoryName) {
    let catName = categoryName.trim();
    if (catName === "") {
      return null
    }
    else {
      // Capitalize first letter of each word, lowercase the rest
      let catList = catName.split(" ");
      for (let i=0; i<catList.length; i++) {
        catList[i] = catList[i][0].toUpperCase() + catList[i].substr(1).toLowerCase();
      };
      catName = catList.join(" ");

      // getElementById returns null if not found, but jQuery always returns something, but length will be zero
      let catOption = $("#" + catName);

      // If an element is found whose ID is the category name, then the cateogory already exists - return its ID
      if (catOption.length > 0) {
        return catOption.data("value")
      }
      else {
        $.post("/api/addcategory", {
          name: catName
        })
        .done(function(data) {
          // Add new category to category_list
          let newOption = $("<option>");
          newOption.data("value", data.id); // data-value is category id and is hidden
          newOption.attr("name", data.id); // name is also id and hidden
          newOption.val(catName); // value is category name and is displayed
          newOption.attr("id", catName); // used to find option later when saving recipe
          $("#category_list").append(newOption);

          return data.id
        })
        .fail(function(error) {
          // TODO: Use something other than alert
          alert("Could not add category ", catName);
          return null
        });
      };
    };
  };

  // Get data from main recipe fields
  currentRecipe.title = $("#title").val();
  currentRecipe.source = $("#source").val();
  currentRecipe.category1 = getCategory($("#category1").val());
  currentRecipe.category2 = getCategory($("#category2").val());
  currentRecipe.category3 = getCategory($("#category3").val());
  currentRecipe.public = $("#public").checked;
  currentRecipe.description = $("#recipe-desc").val();
  currentRecipe.prepTime = getInteger($("#prep-time").val());
  currentRecipe.cookTime = getInteger($("#cook-time").val());
  currentRecipe.numServings = getInteger($("#num-servings").val());
  currentRecipe.instructions = $("#instructions").val();
  currentRecipe.UserId = currentUser.id;

  // Set oven temp based on if Imperial or Metric, convert for other setting
  if (isImperial) {
    currentRecipe.ovenTempF = getInteger($("#oven-temp").val());
    if (currentRecipe.ovenTempF === null) {
      currentRecipe.ovenTempC = null;
    }
    else {
      currentRecipe.ovenTempC = Math.round((currentRecipe.ovenTempF - 32) * 5 / 9);
    };
  }
  else {
    currentRecipe.ovenTempC = getInteger($("#oven-temp").val());
    if (currentRecipe.ovenTempC === null) {
      currentRecipe.ovenTempF = null;
    }
    else {
      currentRecipe.ovenTempF = Math.round((currentRecipe.ovenTempC / 5 * 9) + 32);
    };
  };

  // Update existing recipe
  if (currentRecipe.id) {
    $.ajax({
      method: "PUT",
      url: "/api/recipes",
      data: currentRecipe
    })
    .done(function() {
      // TODO: Use something other than alert
      alert("Recipe updated.");
    })
    .fail(function() {
      // TODO: Use something other than alert
      alert("Unable to update recipe.");
    });
  }
  // Add new recipe
  else {
    $.post("/api/addrecipe", currentRecipe)
    .done(function(data) {
      currentRecipe = data;

      if (ingredientArray.length > 0) {
        // Set RecipeId for each ingredient
        ingredientArray.forEach(item => item.RecipeId = currentRecipe.id);

        $.post("/api/addingredient", ingredientArray)
        .done(function() {
          loadRecipeData();
          // TODO: Use something other than alert
          alert("Recipe added!");
        })
        .fail(function(error) {
          // TODO: Use something other than alert
          alert("Error adding ingredients: ", error);
        });
      }
      else {
        loadRecipeData();
        // TODO: Use something other than alert
        alert("Recipe added!");
      };
    })
    .fail(function(error) {
      // TODO: Use something other than alert
      alert("Error adding recipe: ", error);
    });
  };
};

// Ingredient Save click event - adds/updates ingredient
function saveIngredient(event) {
  event.preventDefault();

  // Get pointer to ingredient table body
  const ingredTable = $("#ingredient-body");

  // Everything that needs to be done to update existing ingredient, except for updating database
  function updateIngredient() {
    // Get index of currentIngredient in ingredientArray to update table row
    let arrayIndex = ingredientArray.findIndex(ingred => ingred.id === currentIngredient.id);

    // Index should be found since we are updating existing ingredient, but check anyway
    if (arrayIndex >= 0) {
      ingredientArray.splice(arrayIndex, 1, currentIngredient); // replace item in array
      let tableRow = ingredTable[0].rows[arrayIndex];

      if (isImperial) {
        tableRow.cells[0].innerText = getFraction(currentIngredient.imperialQty);
        tableRow.cells[1].innerText = currentIngredient.imperialUnit;
      }
      else {
        tableRow.cells[0].innerText = currentIngredient.metricQty;
        tableRow.cells[1].innerText = currentIngredient.metricUnit;
      };
      tableRow.cells[2].innerText = currentIngredient.name;
    };

    // Clear ingredient form and recalcuate nutrition info
    $(".ingredient-form")[0].reset();
    currentIngredient = {};
    editingIngredient = false;
    calculateNutrition(getInteger($("#num-servings").val()));
  };

  // Everything that needs to be done to add a new ingredient, except for updating database
  function addIngredient() {
    ingredientArray.push(currentIngredient); // Add new ingredient to array

    // Add new ingredient to table
    let qty;
    let unit;

    if (isImperial) {
      qty = getFraction(currentIngredient.imperialQty);
      unit = currentIngredient.imperialUnit;
    }
    else {
      qty = currentIngredient.metricQty;
      unit = currentIngredient.metricUnit;
    };

    let newRow = $("<tr>");
    newRow.append($("<td>").html(qty));
    newRow.append($("<td>").html(unit))
    newRow.append($("<td>").html(currentIngredient.name));
    newRow.append($("<td>").html(delButtonHtml));
    ingredTable.append(newRow);

    // Attach event handlers, clear ingredient form, and recalcuate nutrition info
    $(".deleteBtn").click(deleteIngredient);
    $("tr").click(editIngredient);
    $(".ingredient-form")[0].reset();
    currentIngredient = {};
    calculateNutrition(getInteger($("#num-servings").val()));
  };

  // Main body of saveIngredient
  const spoonacularApiKey = "6572c1d2e7734a0385d6e5765993d8ca"; // TODO: Move to server side to protect key
  const apiGetIngredInfo = `https://api.spoonacular.com/recipes/parseIngredients` +
    `?apiKey=${spoonacularApiKey}&includeNutrition=true&ingredientList=`;
 
  // Retrieve the name from the input form
  let ingredList = currentIngredient.name = $("#ingredient").val();

  // Instantiate variables for API call
  let sourceAmount;
  let sourceUnit;
  let targetUnit;

  // Retrieve the quantity and amount, set appropriate values
  if (isImperial) {
    sourceAmount = currentIngredient.imperialQty = getDecimal($("#quantity").val());
    sourceUnit = currentIngredient.imperialUnit = $("#imperialUnit").val();
    ingredList = currentIngredient.imperialQty + " " + currentIngredient.imperialUnit + " " + ingredList;
    targetUnit = "grams";
  }
  else {
    sourceAmount = currentIngredient.metricQty = $("#quantity").val();
    sourceUnit = currentIngredient.metricUnit = $("#metricUnit").val();
    ingredList = currentIngredient.metricQty + " " + currentIngredient.metricUnit + " " + ingredList;
    // TODO: Would be nice to determine target unit more precisely, i.e. tsp, tbl, cup, etc.
    targetUnit = "cups";
  };

  const apiGetConversion = `https://api.spoonacular.com/recipes/convert?apiKey=${spoonacularApiKey}` +
    `&ingredientName=${currentIngredient.name}&sourceAmount=${sourceAmount}&sourceUnit=${sourceUnit}` +
    `&targetUnit=${targetUnit}`;

  // First, do call to get ingredient information
  $.ajax({
    url: apiGetIngredInfo + ingredList,
    method: "POST",
    contentType: "application/x-www-form-urlencoded"
  })
  .done(function (response) {
    // Then, retrieve all the nutrition info
    const nutrients = response[0].nutrition.nutrients; // array of nutrient info
    currentIngredient.calories = Math.round(nutrients.find(item => item.title === "Calories").amount);
    currentIngredient.protein = Math.round(nutrients.find(item => item.title === "Protein").amount);
    currentIngredient.carbs = Math.round(nutrients.find(item => item.title === "Carbohydrates").amount);
    currentIngredient.fat = Math.round(nutrients.find(item => item.title === "Fat").amount);

    // Finally, do call to get imperial/metric conversion
    $.ajax({
      url: apiGetConversion,
      method: "GET",
      contentType: "application/json"
    })
    .done(function (res) {
      // Set quantity/unit fields with converted data
      if (isImperial) {
        currentIngredient.metricQty = res.targetAmount;
        currentIngredient.metricUnit = res.targetUnit;
      }
      else {
        currentIngredient.imperialQty = res.targetAmount;
        currentIngredient.imperialUnit = res.targetUnit;
      };

      // Time to save: determine if we are updating existing ingredient
      if (editingIngredient) {
        // If editing existing recipe, go ahead and update the database
        if (currentRecipe.id) {
          $.ajax({
            method: "PUT",
            url: "/api/ingredients",
            data: currentIngredient
          })
          .done(function() {
            updateIngredient();
          })
          .fail(function(error) {
            // TODO: use something other than alert
            alert("Could not update ingredient. Error code " + error);
          });
        }
        // If adding a new recipe, we don't save ingredient in database until recipe saved
        else {
          updateIngredient();
        };
      }
      // Adding new ingredient to existing recipe, go ahead and save to database
      else if (currentRecipe.id) {
        currentIngredient.RecipeId = currentRecipe.id;

        $.post("/api/addingredient", currentIngredient)
        .done(function(data) {
          currentIngredient = data;
          addIngredient();
          // TODO: Use something other than alert
          alert("Added ingredient.");
        })
        .fail(function(error) {
          // TODO: Use something other than alert
          alert("Could not add ingredient. Error code ", error);
        });
      };
    })
    .fail(function (error) {
      // TODO: Use something other than alert
      alert("Could not retrieve conversion information. Error code ", error);
    });
  })
  .fail(function (error) {
    // TODO: Use something other than alert
    alert("Could not retrieve nutrition information. Error code ", error);
  });
};

// Ingredient Delete click event - deletes selected ingredient
function deleteIngredient(event) {  
  event.stopPropagation(); // Don't want row click event handle called

  const ingredRow = this.parentNode.parentNode;
  const ingredIndex = ingredRow.rowIndex - 1; // subtract one because of header

  // TODO: Use something other than confirm
  if (confirm("Delete " + ingredientArray[ingredIndex].name + "?")) {
    // Delete ingredient from database
    $.ajax({
      method: "DELETE",
      url: "/api/ingredients/" + ingredientArray[ingredIndex].id
    })
    .done(function() {
      // Delete row from table
      ingredRow.remove();
      // Clear ingredient add/update form if it holds deleted ingredient
      if (currentIngredient.id === ingredientArray[ingredIndex].id) {
        $(".ingredient-form")[0].reset();
        currentIngredient = {};
      };
      // Delete from ingredient array
      ingredientArray.splice(ingredIndex, 1);
      // Recalculate nutrition info
      calculateNutrition(getInteger($("#num-servings").val()));
    })
    .fail(function(error) {
      // TODO: use something other than alert
      alert("Could not delete ingredient. Error code " + error);
    });
  };
};

// Ingredient table row click event - edit ingredient
function editIngredient(event) {
  // Do nothing if they click on header row
  if (this.rowIndex > 0) {
    currentIngredient = ingredientArray[(this.rowIndex) - 1]; // subtract one because of header
    editingIngredient = true;

    if (isImperial) {
      $("#quantity").val(getFraction(currentIngredient.imperialQty));
      $("#imperialUnit").val(currentIngredient.imperialUnit);
      $("#imperialUnit").formSelect(); // Dropdown refresh
    }
    else {
      $("#quantity").val(currentIngredient.metricQty);
      $("#metricUnit").val(currentIngredient.metricUnit);
      $("#metricUnit").formSelect(); // Dropdown refresh
    };

    $("#ingredient").val(currentIngredient.name);
    M.updateTextFields(); // Labels won't move out of the way if you don't do this
  };
};

// Reset button click event - clears all fields, including ingredients and nutrition info
function resetForm(event) {
  // Clear globals
  currentRecipe = {};
  currentIngredient = {};
  ingredientArray = [];

  // Clear ingredient add/update form
  $(".ingredient-form")[0].reset();

  // Clear ingredient table
  $("#ingredient-body").empty();

  // Clear nutrition fields
  calculateNutrition(1);
};

// **************************
// FUNCTIONS FOR PROFILE PAGE
// **************************

// On click for Save button on Profile page
function saveUser(event) {
  event.preventDefault();

  // Email and password are validated and set on change; don't need to update here; ID set on load
  currentUser.firstName = $("#first-name").val();
  currentUser.lastName = $("#last-name").val();
  currentUser.location = $("#location").val();
  currentUser.aboutMe = $("#about-me").val();
  currentUser.imperial = $("#imperial")[0].checked;

  $.ajax({
    method: "PUT",
    url: "/api/user",
    data: currentUser
  })
  .done(function() {
    // TODO: Use something other than alert
    alert("Profile updated.");
  })
  .fail(function() {
    // TODO: Use something other than alert
    alert("Unable to update profile.");
  });
};

// On click for Cancel button on Profile page
function cancelChanges(event) {
  event.preventDefault();
  loadUserData(false);
};

// On click for Add Recipe button on Profile page
function addRecipe(event) {

};

function editRecipe(event) {

};

function deleteRecipe(event) {

};

// Function that loads user's information on Profile page
function loadUserData(loadRecipes) {
  $("#username").val(currentUser.email);
  $("#current-password").val(currentUser.password);
  $("#new-password").val(currentUser.password);

  $("#first-name").val(currentUser.firstName);
  $("#last-name").val(currentUser.lastName);
  $("#location").val(currentUser.location);
  $("#about-me").val(currentUser.aboutMe);
  isImperial = $("#imperial")[0].checked = currentUser.imperial;

  M.updateTextFields(); // Labels won't move out of the way if you don't do this
  M.textareaAutoResize($("#about-me")); // Won't resize to fit data without this

  if (loadRecipes) {
    $.get("/api/recipesByUser/" + currentUser.id, function(data) {
      // Create a table row for each recipe
      const recipeTable = $("#recipe-body");
      let newRow;

      data.forEach(item => {
        newRow = $("<tr>");
        // Display recipe title
        newRow.append($("<td>").html(item.title));
        // Convert MySQL datetime to # milliseconds midnight of January 1, 1970, then to date string
        newRow.append($("<td>").html((new Date(Date.parse(item.createdAt))).toLocaleDateString()));
        // Set public to check if true, not sign if false
        if (item.public) {
          newRow.append($("<td>").html(publicCheckedHtml));
        }
        else {
          newRow.append($("<td>").html(publicUncheckedHtml));
        };
        // Add buttons to edit or delete recipe
        newRow.append($("<td>").html(editButtonHtml + delButtonHtml));
        recipeTable.append(newRow);
      });

      // Add event handlers after elements have been created
      $(".editBtn").click(editRecipe);
      $(".deleteBtn").click(deleteRecipe);
    });
  };
};

// *************************
// FUNCTIONS FOR SEARCH PAGE
// *************************

function getCategories() {
  $("select").formSelect();
  $(".categoriesOptions").on("contentChanged", function () {
    $(this).formSelect();
  });

  $.get("/api/categories", function (data) {
    for (let i = 0; i < data.length; i++) {
      let newOption = $(`<option value="${data[i].id}">${data[i].name}</option>`)
      $(".categoriesOptions").append(newOption)
    }
    $(".categoriesOptions").trigger("contentChanged");
  });
};

let recipesArr = [];

$(document).on("click", "#searchBtn", function (event) {
  event.preventDefault();

  let category = $(".categoriesOptions").val();
  let title = $("#keyword").val().trim();

  if (title === "") {
    title = null;
  };

  let recipesByCategory;
  let recipesbyTitle;

  search(category, title, handleSearchResults);

  function handleSearchResults(categoryData, titleData) {
    if (categoryData !== "" && categoryData !== undefined && categoryData !== null) {
      recipesByCategory = categoryData;
    } else {
      recipesByCategory = null;
    }

    if (titleData !== "" && titleData !== undefined && titleData !== null) {
      recipesbyTitle = titleData;
    } else {
      recipesbyTitle = null;
    }

    let categoryIDArr = [];
    let titleIDArr = [];

    if (recipesByCategory !== null) {
      for (let i = 0; i < recipesByCategory.length; i++) {
        categoryIDArr.push(recipesByCategory[i].id)
      };
    } else {
      categoryIDArr = null;
    }

    if (recipesbyTitle) {
      for (let i = 0; i < recipesbyTitle.length; i++) {
        titleIDArr.push(recipesbyTitle[i].id)
      };
    } else {
      titleIDArr = null;
    }

    if (categoryIDArr !== null) {
      for (let i = 0; i < recipesByCategory.length; i++) {
        if (titleIDArr !== null && titleIDArr.includes(categoryIDArr[i])) {
          recipesArr.push(recipesByCategory[i])
        } else if (titleIDArr === null) {
          recipesArr.push(recipesByCategory[i])
        }
      }
    } else if (titleIDArr !== null) {
      for (let i = 0; i < recipesbyTitle.length; i++) {
        if (categoryIDArr === null) {
          recipesArr.push(recipesbyTitle[i])
        }
      }
    }

    $(".center").text(recipesArr[0].title);
    $("#recipe-desc").val(recipesArr[0].description);
    $("#desc-label").addClass("active");
    $("#submitted-by").val(recipesArr[0].User.firstName + " " + recipesArr[0].User.lastName);
    $("#submitted-label").addClass("active");
    $("#source").val(recipesArr[0].source);
    $("#source-label").addClass("active");
    $("#prep-time").val(recipesArr[0].prepTime + " mins");
    $("#prep-label").addClass("active");
    $("#cook-time").val(recipesArr[0].cookTime + " mins");
    $("#cook-label").addClass("active");
    $("#oven-temp").val(recipesArr[0].ovenTempF + "°F");
    $("#temp-label").addClass("active");
    $("#num-servings").val(recipesArr[0].numServings);
    $("#servings-label").addClass("active");
    $("#instructions").val(recipesArr[0].instructions);
    $("#instructions-label").addClass("active");

    let ingredients = recipesArr[0].Ingredients
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    const ingredientTable = $("#ingredient-table")
    $(ingredientTable).empty();

    for (let i = 0; i < ingredients.length; i++) {
      let td1 = $("<td>").text(ingredients[i].imperialQty)
      let td2 = $("<td>").text(ingredients[i].imperialUnit)
      let td3 = $("<td>").text(ingredients[i].name)
      let tr = $("<tr>")

      $(tr).append(td1)
      $(tr).append(td2)
      $(tr).append(td3)
      $(ingredientTable).append(tr)

      totalCalories += parseInt(ingredients[i].calories)
      totalProtein += parseInt(ingredients[i].protein)
      totalCarbs += parseInt(ingredients[i].carbs)
      totalFat += parseInt(ingredients[i].fat)

      let calories = totalCalories / recipesArr[0].numServings;
      let protein = totalProtein / recipesArr[0].numServings;
      let carbs = totalCarbs / recipesArr[0].numServings;
      let fat = totalFat / recipesArr[0].numServings;
      $("#calories").val(calories);
      $("#calories-label").addClass("active");
      $("#protein").val(protein);
      $("#protein-label").addClass("active");
      $("#carbohydrates").val(carbs);
      $("#carbs-label").addClass("active");
      $("#fat").val(fat);
      $("#fat-label").addClass("active");

      M.textareaAutoResize($('#recipe-desc'));
      M.textareaAutoResize($('#instructions'));
      M.updateTextFields();
    }

    return recipesArr
  };
});

let currentIndex = 0;

$(document).on("click", "#prevBtn", function (event) {
  event.stopPropagation();

  if (currentIndex === 0) {
    currentIndex = recipesArr.length - 1
  } else {
    currentIndex--
  }

  console.log("Index: " + currentIndex)
  updateSearchDom(currentIndex)

  return currentIndex;
});

$(document).on("click", "#nextBtn", function (event) {
  event.stopPropagation();

  if (currentIndex === recipesArr.length - 1) {
    currentIndex = 0
  } else {
    currentIndex++
  }

  console.log("Index: " + currentIndex)
  updateSearchDom(currentIndex)

  return currentIndex;
});

function updateSearchDom(currentIndex) {
  $(".center").text(recipesArr[currentIndex].title);
  $("#recipe-desc").val(recipesArr[currentIndex].description);
  $("#desc-label").addClass("active");
  $("#submitted-by").val(recipesArr[currentIndex].User.firstName + " " + recipesArr[currentIndex].User.lastName);
  $("#submitted-label").addClass("active");
  $("#source").val(recipesArr[currentIndex].source);
  $("#source-label").addClass("active");
  $("#prep-time").val(recipesArr[currentIndex].prepTime + " mins");
  $("#prep-label").addClass("active");
  $("#cook-time").val(recipesArr[currentIndex].cookTime + " mins");
  $("#cook-label").addClass("active");
  $("#oven-temp").val(recipesArr[currentIndex].ovenTempF + "°F");
  $("#temp-label").addClass("active");
  $("#num-servings").val(recipesArr[currentIndex].numServings);
  $("#servings-label").addClass("active");
  $("#instructions").val(recipesArr[currentIndex].instructions);
  $("#instructions-label").addClass("active");

  let ingredients = recipesArr[currentIndex].Ingredients
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  const ingredientTable = $("#ingredient-table")
  $(ingredientTable).empty();

  for (let i = 0; i < ingredients.length; i++) {
    let td1 = $("<td>").text(ingredients[i].imperialQty)
    let td2 = $("<td>").text(ingredients[i].imperialUnit)
    let td3 = $("<td>").text(ingredients[i].name)
    let tr = $("<tr>")

    $(tr).append(td1)
    $(tr).append(td2)
    $(tr).append(td3)
    $(ingredientTable).append(tr)

    totalCalories += parseInt(ingredients[i].calories)
    totalProtein += parseInt(ingredients[i].protein)
    totalCarbs += parseInt(ingredients[i].carbs)
    totalFat += parseInt(ingredients[i].fat)

    let calories = totalCalories / recipesArr[currentIndex].numServings;
    let protein = totalProtein / recipesArr[currentIndex].numServings;
    let carbs = totalCarbs / recipesArr[currentIndex].numServings;
    let fat = totalFat / recipesArr[currentIndex].numServings;
    $("#calories").val(calories);
    $("#calories-label").addClass("active");
    $("#protein").val(protein);
    $("#protein-label").addClass("active");
    $("#carbohydrates").val(carbs);
    $("#carbs-label").addClass("active");
    $("#fat").val(fat);
    $("#fat-label").addClass("active");

    M.textareaAutoResize($('#recipe-desc'));
    M.textareaAutoResize($('#instructions'));
    M.updateTextFields();
  }
}

function search(categoryID, title, cb) {
  let categoryData;
  let titleData;

  if (categoryID !== null && title !== null) {
    $.get(`/api/recipesByCategory/${categoryID}`)
      .done(function (data) {
        categoryData = data

        $.get(`/api/recipesbytitle/${title}`)
          .done(function (data) {
            titleData = data

            cb(categoryData, titleData)
          })
          .fail(function (err) {
            console.log(err)
          })
      })
      .fail(function (err) {
        console.log(err)
      });

  } else if (categoryID !== null && title === null) {
    $.get(`/api/recipesByCategory/${categoryID}`)
      .done(function (data) {
        categoryData = data
        titleData = null

        cb(categoryData, titleData)
      })
      .fail(function (err) {
        console.log(err)
      });

  } else if (categoryID === null && title !== null) {
    $.get(`/api/recipesbytitle/${title}`)
      .done(function (data) {
        titleData = data
        categoryData = null

        cb(categoryData, titleData)
      })
      .fail(function (err) {
        console.log(err)
      });
  };
};