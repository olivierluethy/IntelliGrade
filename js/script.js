function calculateGrade() {
  const earnedPoints = document.getElementById("earnedPoints").value.trim();
  const maxPoints = document.getElementById("maxPoints").value.trim();

  if (earnedPoints === "" || maxPoints === "") {
    document.getElementById("showGrade").innerHTML =
      "Please enter values for earned points and max points.";
    return;
  }

  const earnedPointsValue = parseInt(earnedPoints);
  const maxPointsValue = parseInt(maxPoints);

  if (
    !isNaN(earnedPointsValue) &&
    !isNaN(maxPointsValue) &&
    maxPointsValue !== 0
  ) {
    const grade = (earnedPointsValue * 5) / maxPointsValue + 1;
    document.getElementById(
      "showGrade"
    ).innerHTML = `Your grade is: <b>${grade.toFixed(2)}</b>`;
  } else {
    console.error("Invalid input. Please enter valid numeric values.");
  }
}

// This function calculates the increase or decrease in percentage of the raised grade compared to the original grade
function calculateGradeInDecrease() {
  // Get the original grade from the input field with the id "original_grade"
  const originalGrade = parseFloat(
    document.getElementById("original_grade").value
  );

  // Get the raised grade from the input field with the id "raised_grade"
  const raisedGrade = parseFloat(document.getElementById("raised_grade").value);

  // Calculate the increase by subtracting the original grade from the raised grade
  let increase = raisedGrade - originalGrade;

  // Calculate the percentage increase by dividing the increase by the original grade
  let percentageIncrease = (increase / originalGrade) * 100;

  // Check if the increase is greater than 0, less than 0, or equal to 0
  if (increase > 0) {
    // If the increase is greater than 0, display the percentage increase with the text "It got increased by: "
    document.getElementById(
      "showIncrease"
    ).innerHTML = `It got increased by: <span style="font-weight: bold;">${percentageIncrease.toFixed(
      2
    )}%</span>`;
  } else if (increase < 0) {
    // If the increase is less than 0, take the absolute value of the percentage increase and display it with the text "It got decreased by: "
    percentageIncrease = Math.abs(percentageIncrease);
    document.getElementById(
      "showIncrease"
    ).innerHTML = `It got decreased by: <span style="font-weight: bold;">${percentageIncrease.toFixed(
      2
    )}%</span>`;
  } else {
    // If the increase is equal to 0, display the text "There was no change."
    document.getElementById("showIncrease").innerHTML = `There was no change.`;
  }
  if (
    document.getElementById("original_grade").value.trim() === "" &&
    document.getElementById("raised_grade").value.trim() === ""
  ) {
    document.getElementById("showIncrease").innerHTML = ``;
  }
}
function calculateUpscale() {
  var new_Grade = parseFloat(document.getElementById("new_Grade").value);
  var raise_percentage = parseFloat(
    document.getElementById("raise_percentage").value
  );

  var old_grade = new_Grade - (new_Grade * raise_percentage) / 100;

  if (!isNaN(old_grade)) {
    document.getElementById("showOriginalGrade").innerHTML = old_grade;
  } else {
    document.getElementById("showOriginalGrade").innerHTML = "";
  }
}
