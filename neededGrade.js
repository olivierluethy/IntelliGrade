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

document.addEventListener("DOMContentLoaded", function () {
  // Füge das onkeypress-Ereignis hinzu
  document.addEventListener("keypress", function (event) {
    // Prüfe, ob die gedrückte Taste die Eingabetaste ist
    if (event.key === "Enter") {
      var gradesContainer = document.querySelector(".grades-container");
      gradesContainer.style.display = "block";

      // Increase the height by 50px
      var currentHeight = parseInt(getComputedStyle(gradesContainer).height);

      // Check if the height exceeds 300px, if so, apply overflow: auto;
      if (currentHeight + 50 > 300) {
        gradesContainer.style.overflowY = "auto";
      } else {
        gradesContainer.style.height = currentHeight + 57 + "px";
      }

      // Create a new input field for grades
      var inputField = document.createElement("input");
      inputField.type = "text";
      inputField.style.width = "80px";
      inputField.placeholder = "Enter your grade";
      inputField.classList.add("grades-line");

      // Append the input field for grades to the gradesContainer
      gradesContainer.appendChild(inputField);

      // Create a new input field for weight
      var weightField = document.createElement("input");
      weightField.type = "text";
      weightField.placeholder = "Weight";
      weightField.style.width = "80px";
      weightField.style.marginLeft = "2rem";

      // Append the input field for weight to the gradesContainer
      gradesContainer.appendChild(weightField);

      // Create a span element for the icon
      var iconSpan = document.createElement("span");
      iconSpan.classList.add("delete-icon"); // You can add your own class for styling

      // Add your icon to the span element
      // Example: using Font Awesome
      iconSpan.innerHTML =
        "<i class='fa fa-trash' style='margin-left: 2rem;'></i>"; // Adjust margin-left as needed

      // Append the icon span after the weight input field
      gradesContainer.appendChild(iconSpan);

      // Add a line break
      var lineBreak = document.createElement("br");
      gradesContainer.appendChild(lineBreak);

      // Scroll to the bottom after new content is added
      gradesContainer.scrollTop = gradesContainer.scrollHeight;
    }
  });
});
