function calculateGrade() {
  const earnedPoints = parseInt(document.getElementById("earnedPoints").value);
  const maxPoints = parseInt(document.getElementById("maxPoints").value);

  if (!isNaN(earnedPoints) && !isNaN(maxPoints) && maxPoints !== 0) {
    const grade = (earnedPoints * 5) / maxPoints + 1;
    document.getElementById(
      "showGrade"
    ).innerHTML = `Your grade is: ${grade.toFixed(2)}`;
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

// Prompts the user to enter marks until they stop the input
function calculateAverageMarks() {
  let total_marks = 0;
  let num_marks = 0;

  // Loops until the user inputs 's' to stop
  while (true) {
    let mark = prompt("Type a mark ('s' to stop)");
    if (mark === "s") {
      calculateMagicMark(total_marks, num_marks);
      break;
    } else if (mark === null) {
      break;
    } else {
      mark = parseFloat(mark);
      if (isNaN(mark)) {
        alert("Invalid input. Please enter a valid mark or 's' to stop.");
      } else if (mark > 6) {
        alert("Mark isn't valid");
      } else {
        total_marks += mark;
        num_marks += 1;
      }
    }
  }
  if (num_marks > 0) {
    let average = total_marks / num_marks;
    alert("The average is " + average);
  } else {
    alert("No marks were entered");
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
    ).innerHTML = `It got increased by: <span style="font-weight: bold;">${percentageIncrease.toFixed(2)}%</span>`;
  } else if (increase < 0) {
    // If the increase is less than 0, take the absolute value of the percentage increase and display it with the text "It got decreased by: "
    percentageIncrease = Math.abs(percentageIncrease);
    document.getElementById(
      "showIncrease"
    ).innerHTML = `It got decreased by: <span style="font-weight: bold;">${percentageIncrease.toFixed(2)}%</span>`;
  } else {
    // If the increase is equal to 0, display the text "There was no change."
    document.getElementById("showIncrease").innerHTML = `There was no change.`;
  }
}
