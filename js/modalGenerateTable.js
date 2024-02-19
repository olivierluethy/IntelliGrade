document.addEventListener("DOMContentLoaded", function () {
  // Implement standard weighting of one, which is usual
  document.getElementById("weighting").value = 1;

  // Add the onkeypress event listener
  document.addEventListener("keypress", function (event) {
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

        document.querySelector("#gradesTable tr:first-child").style.visibility =
          "visible";

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
        deleteIcon.addEventListener("click", function () {
          row.remove();
          var gradesContainer = document.querySelector("#gradesTable");

          // Collect all rows in the table
          var gradeLines = gradesContainer.querySelectorAll("tr");

          // Check if there is only one table row (excluding the header row)
          if (gradeLines.length === 1) {
            // The table contains only one row excluding the header row
            document.querySelector(
              "#gradesTable tr:first-child"
            ).style.visibility = "hidden";
          }
        });

        cell3.appendChild(deleteIcon);

        // Scroll to the bottom after new content is added
        table.scrollTop = table.scrollHeight;
      }
    }
  });
});
