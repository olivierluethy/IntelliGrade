function calculateGrade(){
    /* Calculate grade */
    let earnedPoints = parseInt(document.getElementById("earnedPoints").value);
    let maxPoints = parseInt(document.getElementById("maxPoints").value);

    let grade = (earnedPoints * 5) / maxPoints + 1;

    if(!isNaN(grade)){
        document.getElementById("showGrade").innerHTML = "Your grade is a: " + grade.toFixed(2);
    }
}

// Calculates the mark a user needs to get to achieve a desired average
function calculate_magic_mark(total_marks, num_marks) {
    // Prompts the user for the desired average
    let desired_average = prompt("Type your desired average");
    // Calculates the magic mark using the formula (num_marks + 1) * desired_average - total_marks
    let magic_mark = (num_marks + 1) * desired_average - total_marks;
  
    // If the magic mark is greater than 6, it is not allowed and an error message is displayed
    if (magic_mark > 6) {
      alert("The wished mark isn't possible");
    } else {
      // Displays the magic mark the user needs to get to achieve the desired average
      alert("You need a " + magic_mark.toFixed(3));
      let confirm = confirm("Calculate again or stop?");
      if(confirm == "true"){
        calculateMagicMark();
      }else if(confirm == "false"){
        return;
      }
    }
  }
  
  // Prompts the user to enter marks until they stop the input
  function calculateMagicMark() {
    let total_marks = 0;
    let num_marks = 0;
  
    // Loops until the user inputs 's' to stop
    while (true) {
      let mark = prompt("Type a mark (s to stop)");
      if(mark == "s"){
        calculate_magic_mark(total_marks, num_marks);
    }else{
        mark = parseFloat(mark);
        if (isNaN(mark)){
            alert("Invalid input. Please enter a valid mark or 's' to stop.");
        } else if (mark > 6){
            alert("Mark isn't valid");
        } else {
            total_marks += mark;
            num_marks += 1;
        }
    }
    }
  }
  