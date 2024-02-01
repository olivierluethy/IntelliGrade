// Get the modal
var modal = document.getElementById("myModal");

// Get the button that opens the modal
var btn = document.getElementById("myBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal
btn.onclick = function () {
  modal.style.display = "block";
};

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
  modal.style.display = "none";
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

var defaultWeight = 1; // Standardgewicht, falls keine Gewichtung eingegeben wird

function addRow() {
  var marksContainer = document.getElementById("marksContainer");
  var row = document.createElement("div");
  var lastWeightInput = document.querySelector(".weightInput:last-child");

  // Wenn das letzte Gewichtsfeld existiert, nimm seinen Wert als Standardgewicht
  if (lastWeightInput) {
    defaultWeight = parseFloat(lastWeightInput.value) || defaultWeight;
  }

  row.innerHTML = `
    <input type="number" placeholder="Enter Mark" class="markInput">
    <input type="number" placeholder="Enter Weight" class="weightInput" value="${defaultWeight}" onchange="updateDefaultWeight(this)"><br><br>
  `;
  marksContainer.appendChild(row);
}

// Funktion zum Aktualisieren des Standardgewichts
function updateDefaultWeight(input) {
  defaultWeight = parseFloat(input.value) || defaultWeight;
}

// Funktion zum Schließen des Modalfensters
function closeModal() {
  document.getElementById("myModal").style.display = "none";
}

// Funktion zum Berechnen des Durchschnitts der Noten unter Berücksichtigung der Gewichtung
function calculateAverageMarks() {
  var modal = document.getElementById("myModal");
  modal.style.display = "block";

  var marksContainer = document.getElementById("marksContainer");
  var row = document.createElement("div");
  var lastWeightInput = document.querySelector(".weightInput:last-child");

  // Wenn das letzte Gewichtsfeld existiert, nimm seinen Wert als Standardgewicht
  if (lastWeightInput) {
    defaultWeight = parseFloat(lastWeightInput.value) || defaultWeight;
  }

  row.innerHTML = `
    <input type="number" placeholder="Enter Mark" class="markInput">
    <input type="number" placeholder="Enter Weight" class="weightInput" value="${defaultWeight}" onchange="updateDefaultWeight(this)"><br><br>
  `;
  marksContainer.appendChild(row);

  var markInputs = document.getElementsByClassName("markInput");
  var weightInputs = document.getElementsByClassName("weightInput");
  var totalWeight = 0;
  var weightedTotal = 0;

  // Berechne die gewichtete Summe der Noten
  for (var i = 0; i < markInputs.length; i++) {
    var mark = parseFloat(markInputs[i].value);
    var weight = parseFloat(weightInputs[i].value);

    if (!isNaN(mark) && !isNaN(weight)) {
      weightedTotal += mark * weight;
      totalWeight += weight;
    }
  }

  // Berechne den Durchschnitt
  var average = totalWeight !== 0 ? weightedTotal / totalWeight : 0;

  //   // Zeige den Durchschnitt im Modal an
  //   alert("The average is " + average.toFixed(2));
}

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
  modal.style.display = "none";
};
