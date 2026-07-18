// Grades modal open/close handling.
(function () {
  var modal = document.getElementById("myModal");
  var openBtn = document.getElementById("modalCalculator");

  function openModal() {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    var grade = document.getElementById("grade");
    if (grade) grade.focus();
  }

  function closeModal() {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }

  // Open the modal
  openBtn.onclick = openModal;

  // Close via the (x) button in the header
  var span = document.getElementsByClassName("close")[0];
  if (span) span.onclick = closeModal;

  // Close when clicking on the dark backdrop (outside the panel)
  modal.addEventListener("click", function (event) {
    if (event.target === modal) closeModal();
  });

  // Close on Escape
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });

  // Preserved from the original: a counter used to track input IDs.
  var inputIdCounter = 0; // Initialize the input ID counter
})();
