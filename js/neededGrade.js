/* Calculate needed grade to get wished average */
function calculateNeededGrade() {
  var gradesContainer = document.querySelector("#gradesTable");

  // Collect all rows in the table
  var gradeLines = gradesContainer.querySelectorAll("tr");

  // Initialize variables for total marks and total weight
  var totalMarks = 0;
  var totalWeight = 0;

  // Iterate through each row in the table, skipping the header row
  for (var i = 1; i < gradeLines.length; i++) {
    var gradeLine = gradeLines[i];
    // Get the grade and weight input fields within the current grade-line
    var gradeInput = gradeLine.querySelector(
      "td:nth-child(1) input[type='number']"
    );
    var weightInput = gradeLine.querySelector(
      "td:nth-child(2) input[type='number']"
    );

    // Check if both grade and weight inputs exist
    if (gradeInput && weightInput) {
      var grade = parseFloat(gradeInput.value);
      var weight = parseFloat(weightInput.value);

      // Check if grade and weight are valid numbers
      if (!isNaN(grade) && !isNaN(weight)) {
        // Accumulate total marks and total weight
        totalMarks += grade * weight;
        totalWeight += weight;
      }
    }
  }

  if (totalWeight > 0) {
    var desiredAverageString = prompt("Which average do you wish to achieve?");
    var desiredAverage = parseFloat(desiredAverageString);

    var desiredWeightString = prompt("What is the weight for the next exam?");
    var desiredWeight = parseFloat(desiredWeightString);

    // Calculate the needed grade considering the weighting
    var neededGrade =
      (desiredAverage * (totalWeight + desiredWeight) - totalMarks) /
      desiredWeight;

    if (neededGrade > 6) {
      alert(
        "Your goal is not achievable!\n\n" +
          "You would need a grade of " +
          neededGrade.toFixed(2) +
          " which isn't achievable."
      );
    } else {
      alert(
        "To achieve the desired average of " +
          desiredAverage.toFixed(2) +
          ", you need a grade of " +
          neededGrade.toFixed(2)
      );
    }
  } else {
    alert("No valid grades and weights entered.");
  }
}
