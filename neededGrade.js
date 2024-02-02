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

// Initialize a counter variable to track IDs
var inputIdCounter = 1;

document.addEventListener("DOMContentLoaded", function () {
  // Füge das onkeypress-Ereignis hinzu
  document.addEventListener("keypress", function (event) {
    // Check if the pressed key is Enter
    if (event.key === "Enter") {
      var mark = document.getElementById("grade").value;
      var weight = document.getElementById("weighting").value;

      if (mark === "" && weight === "") {
        alert("Enter a grade and a weight");
      } else if (mark === "" && weight !== "") {
        alert("Enter a grade");
      } else if (weight === "" && mark !== "") {
        alert("Enter a weight");
      } else {
        var gradesContainer = document.querySelector(".grades-container");
        gradesContainer.style.display = "block";

        // Increase the height by 50px
        var currentHeight = parseInt(getComputedStyle(gradesContainer).height);

        // Check if the height exceeds 300px, if so, apply overflow: auto;
        if (currentHeight + 50 > 300) {
          gradesContainer.style.overflowY = "auto";
        } else {
          gradesContainer.style.overflowY = "none";
          gradesContainer.style.height = currentHeight + 62 + "px";
        }

        // Create a container for the line of elements
        var gradesLineContainer = document.createElement("div");
        gradesLineContainer.classList.add("grades-line");

        // Create a new input field for grades
        var inputField = document.createElement("input");
        inputField.type = "number";
        inputField.style.width = "80px";
        inputField.placeholder = "Enter your grade";
        inputField.value = mark;
        inputField.id = "gradeInput" + inputIdCounter; // Set the ID
        gradesLineContainer.appendChild(inputField);

        // Create a new input field for weight
        var weightField = document.createElement("input");
        weightField.type = "number";
        weightField.style.width = "80px";
        weightField.value = weight;
        weightField.style.marginLeft = "2rem";
        weightField.id = "weightInput" + inputIdCounter; // Set the ID
        gradesLineContainer.appendChild(weightField);

        // Create a span element for the icon
        var iconSpan = document.createElement("span");
        iconSpan.classList.add("delete-icon"); // You can add your own class for styling

        // Add your icon to the span element
        // Example: using Font Awesome
        iconSpan.innerHTML =
          "<i class='fa fa-close' style='margin-left: 2rem;'></i>"; // Adjust margin-left as needed

        // Add click event listener to the icon to remove the line
        iconSpan.addEventListener("click", function () {
          // Remove the entire line container
          gradesLineContainer.remove();

          // Get the height of the line container being removed
          var lineContainerHeight = gradesLineContainer.offsetHeight;

          // Reduce the height of the gradesContainer by the height of the removed line container
          gradesContainer.style.height =
            currentHeight - lineContainerHeight + "px";
        });

        // Append the icon span after the weight input field
        gradesLineContainer.appendChild(iconSpan);

        // Append the entire gradesLineContainer to the gradesContainer
        gradesContainer.appendChild(gradesLineContainer);

        // Add a line break
        var lineBreak = document.createElement("br");
        gradesContainer.appendChild(lineBreak);

        // Increment the input ID counter for the next elements
        inputIdCounter++;

        // Scroll to the bottom after new content is added
        gradesContainer.scrollTop = gradesContainer.scrollHeight;
      }
    }
  });
});
