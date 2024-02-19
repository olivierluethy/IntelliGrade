document.querySelector(".dwnPDF").addEventListener("click", function () {
  var table = document.getElementById("gradesTable");

  // Collect all rows in the table
  var gradeLines = table.querySelectorAll("tr");

  if (table && gradeLines.length > 1) {
    console.log("Element with ID 'gradesTable' exists.");

    var rows = table.getElementsByTagName("tr");

    // Create a new jsPDF instance
    var doc = new jsPDF();

    // Define title for the document
    var title = "Grades Table";

    // Set font size and align for the title
    doc.setFontSize(16);
    doc.text(title, 14, 10);

    // Define columns for the table
    var columns = ["Grades", "Weights"];

    // Initialize an empty array to hold the data for the table
    var data = [];

    // Loop through all rows
    for (var i = 0; i < rows.length; i++) {
      var cells = rows[i].getElementsByTagName("input");

      if (cells.length > 0) {
        var rowData = [];

        // Loop through all cells in the current row
        for (var j = 0; j < cells.length; j++) {
          rowData.push(cells[j].value); // Add cell value to rowData array
        }

        // Add the rowData array to the data array
        data.push(rowData);
      } else {
        console.log("No cells found in row " + (i + 1));
      }
    }

    // Add the table to the PDF document
    doc.autoTable({
      head: [columns], // Specify the table header
      body: data, // Specify the table data
    });

    // Output PDF content to a data URL
    var pdfData = doc.output("datauristring");

    // Display PDF content in the preview area
    var pdfPreview = document.getElementById("pdfPreview");
    pdfPreview.src = pdfData;

    // Show the preview area
    pdfPreview.style.display = "block";

    // Get the modal
    var modalPdf = document.getElementById("ModalPDFPreview");
    modalPdf.style.display = "block";

    // Get the <span> element that closes the modal
    var spanPDF = document.getElementsByClassName("closePDF")[0];

    // When the user clicks on <span> (x), close the modal
    spanPDF.onclick = function () {
      modalPdf.style.display = "none";
    };

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
      if (event.target == modalPdf) {
        modalPdf.style.display = "none";
      }
    };
  } else {
    alert("Add some grades first!");
  }
});
