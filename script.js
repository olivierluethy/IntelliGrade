function calculateGrade() {
  const earnedPoints = parseInt(document.getElementById("earnedPoints").value);
  const maxPoints = parseInt(document.getElementById("maxPoints").value);

  if (!isNaN(earnedPoints) && !isNaN(maxPoints) && maxPoints !== 0) {
    const grade = (earnedPoints * 5) / maxPoints + 1;
    document.getElementById(
      "showGrade"
    ).innerHTML = `Your grade is: <b>${grade.toFixed(2)}<b>`;
  } else {
    console.error("Invalid input. Please enter valid numeric values.");
  }
}

function calculateMagicMark(totalMarks, numMarks) {
  const desiredAverage = prompt("Type your desired average");

  if (desiredAverage === null) {
    return; // User pressed cancel or closed the prompt
  }

  const magicMark = (numMarks + 1) * desiredAverage - totalMarks;

  if (magicMark > 6) {
    alert("The desired mark isn't possible");
  } else {
    alert(`You need a ${magicMark.toFixed(2)}`);
    const shouldCalculateAgain = confirm("Calculate again or stop?");

    if (shouldCalculateAgain) {
      calculateAverageMarks();
    }
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
