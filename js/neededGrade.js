// Get the modal
var modal = document.getElementById("myModal");

// Get the button that opens the modal
var btn = document.getElementById("modalCalculator");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal
btn.onclick = function() {
    modal.style.display = "block";
};

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

// Initialize a counter variable to track IDs
var inputIdCounter = 0; // Initialize the input ID counter

document.addEventListener("DOMContentLoaded", function() {
    // Implement standard weighting of one, which is usual
    document.getElementById("weighting").value = 1;

    // Add the onkeypress event listener
    document.addEventListener("keypress", function(event) {
        // Check if the pressed key is Enter
        if (event.key === "Enter") {
            // Select the text inside the input field
            document.getElementById("grade").select();
            var mark = document.getElementById("grade").value;
            var weight = document.getElementById("weighting").value;

            if (mark === "" && weight === "") {
                alert("Enter a grade and a weight");
            } else if (mark === "" && weight !== "") {
                alert("Enter a grade");
            } else if (weight === "" && mark !== "") {
                alert("Enter a weight");
            } else if (mark < 1 || mark > 6) {
                alert("Enter a valid grade (Swiss format: 1 worst; 6 best)");
            } else {
                var table = document.getElementById("gradesTable");

                document.querySelector("#gradesTable tr:first-child").style.visibility = "visible";

                // Create a new row
                var row = table.insertRow();

                // Insert cells into the row
                var cell1 = row.insertCell(0);
                var cell2 = row.insertCell(1);
                var cell3 = row.insertCell(2);

                // Create input fields for grade and weight
                var gradeInput = document.createElement("input");
                gradeInput.type = "number";
                gradeInput.value = mark || ""; // Set value if provided
                cell1.appendChild(gradeInput);

                var weightInput = document.createElement("input");
                weightInput.type = "number";
                weightInput.value = weight || ""; // Set value if provided
                cell2.appendChild(weightInput);

                // Create delete icon
                var deleteIcon = document.createElement("i");
                deleteIcon.classList.add("fa", "fa-close", "delete-icon");
                deleteIcon.style.fontSize = "50px";
                deleteIcon.title = "Delete line";

                // Add click event listener to the delete icon to remove the row
                deleteIcon.addEventListener("click", function() {
                    row.remove();
                    var gradesContainer = document.querySelector("#gradesTable");

                    // Collect all rows in the table
                    var gradeLines = gradesContainer.querySelectorAll("tr");

                    // Check if there is only one table row (excluding the header row)
                    if (gradeLines.length === 1) {
                        // The table contains only one row excluding the header row
                        document.querySelector("#gradesTable tr:first-child").style.visibility = "hidden";
                    }
                });

                cell3.appendChild(deleteIcon);

                // Scroll to the bottom after new content is added
                table.scrollTop = table.scrollHeight;
            }
        }
    });
});

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
        var gradeInput = gradeLine.querySelector("td:nth-child(1) input[type='number']");
        var weightInput = gradeLine.querySelector("td:nth-child(2) input[type='number']");

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

    // alert("Total marks: " + totalMarks)
    // alert("Total weights: " + totalWeight)

    if (totalWeight > 0) {
        var desiredAverageString = prompt("Which average do you wish to achieve?");
        var desiredAverage = parseFloat(desiredAverageString);

        var desiredWeightString = prompt("What is the weight for the next exam?");
        var desiredWeight = parseFloat(desiredWeightString);

        // alert("Desired Average: " + desiredAverage)
        // alert("Desired Weight: " + desiredWeight)

        // Calculate the needed grade considering the weighting
        var neededGrade = (desiredAverage * (totalWeight + desiredWeight) - totalMarks) / desiredWeight;

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