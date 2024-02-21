document.querySelector(".dwnPDF").addEventListener("click", function () {
  var table = document.getElementById("gradesTable");

  // Collect all rows in the table
  var gradeLines = table.querySelectorAll("tr");

  if (table && gradeLines.length > 1) {
    var rows = table.getElementsByTagName("tr");

    // Create a new jsPDF instance
    var doc = new jsPDF();

    // Add background image to the document
    var backgroundImage = new Image();

    // Specify the path to your image
    backgroundImage.src = "/images/watermark.png";

    // Add an event listener for the error event
    backgroundImage.onerror = function () {
      console.error("Error loading image");
    };

    // Add an event listener for the load event
    backgroundImage.onload = function () {
      // The image loaded successfully, you can use it here
      console.log("Image loaded successfully");
    };

    // Define the size of the watermark
    var watermarkWidth = 25; // You can adjust this value
    var watermarkHeight = 25; // You can adjust this value

    // Calculate the position of the watermark (bottom right corner)
    var watermarkX = doc.internal.pageSize.width - watermarkWidth;
    var watermarkY = doc.internal.pageSize.height - watermarkHeight;

    // Add an event listener for the load event
    backgroundImage.onload = function () {
      // Add the watermark to the document
      doc.addImage(
        backgroundImage,
        "PNG",
        watermarkX,
        watermarkY,
        watermarkWidth,
        watermarkHeight
      );
    };

    // Define title for the document
    var title = "Grades Table";

    // Set font size
    doc.setFontSize(30);

    // Calculate the width of the title
    var titleWidth =
      (doc.getStringUnitWidth(title) * doc.internal.getFontSize()) /
      doc.internal.scaleFactor;

    // Calculate the position of the title (center-aligned)
    var titleX = (doc.internal.pageSize.width - titleWidth) / 2;

    // Define the top margin
    var marginTop = 19; // Equivalent to 2rem

    // Add the title to the document with the top margin
    doc.text(title, titleX, marginTop);

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
      }
    }
    // Define the top margin for the table
    var tableMarginTop = 10; // You can adjust this value

    // Initialize a variable to store the sum of the values
    var sum = 0;
    var count = 0;

    // Add the table to the PDF document
    doc.autoTable({
      startY: marginTop + tableMarginTop, // Start the table below the title
      head: [columns], // Specify the table header
      body: data, // Specify the table data
      didDrawCell: function (data) {
        var cell = data.cell;
        // Check if this is a body cell (not a header cell), the value is a number, and this is the first column
        if (
          data.section === "body" &&
          !isNaN(cell.text[0]) &&
          data.column.index === 0
        ) {
          var value = parseFloat(cell.text[0]);
          sum += value; // Add the value to the sum
          count++; // Increment the count
          // Set the text color based on the cell value
          if (value < 4) {
            doc.setTextColor(255, 0, 0); // Red for values less than 4
          } else {
            doc.setTextColor(0, 255, 0); // Green for values 4 or greater
          }
          // Delete the original cell content
          doc.setFillColor(255, 255, 255); // Set fill color to white
          doc.rect(cell.x, cell.y, cell.width, cell.height, "F"); // Fill rectangle with white to cover original content
          // Draw the text in the cell with the correct color
          doc.text(
            cell.text,
            cell.x + cell.padding("left"),
            cell.y + cell.height / 1.5,
            { baseline: "middle" }
          );
        }
      },
    });

    // Calculate the average
    var average = sum / count;

    // Set the font size
    doc.setFontSize(15); // Change this value to the desired font size

    // Add the "Average: " text to the document
    doc.setTextColor(0, 0, 0); // Black color for the text
    doc.text(
      "Average: ",
      15,
      doc.autoTable.previous.finalY + 20 // Position the text below the table
    );

    // Set the text color based on the average value
    if (average >= 4) {
      doc.setTextColor(0, 255, 0); // Green for positive values
    } else {
      doc.setTextColor(255, 0, 0); // Red for negative values
    }

    doc.text(
      average.toFixed(2),
      15 +
        (doc.getStringUnitWidth("Average: ") * doc.internal.getFontSize()) /
          doc.internal.scaleFactor,
      doc.autoTable.previous.finalY + 20 // Position the text below the table
    );

    // Initialize variables to store the sum of grades and weights
    var sumGrades = 0;
    var sumWeights = 0;

    // Loop through all rows
    for (var i = 0; i < data.length; i++) {
      // Assume that the first column is the grade and the second column is the weight
      var grade = parseFloat(data[i][0]);
      var weight = parseFloat(data[i][1]);

      // Add the weighted grade to the sum of grades
      sumGrades += grade * weight;

      // Add the weight to the sum of weights
      sumWeights += weight;
    }

    // Calculate the current weighted average grade
    var currentAverage = sumGrades / sumWeights;

    // Calculate the grade needed to achieve at least a 3.75
    // Assume that the weight of the next exam is 1
    var neededGrade = (3.75 * (sumWeights + 1) - sumGrades).toFixed(2);

    // Add the "Needed grade to achieve at least a 3.75: " text to the document
    doc.setTextColor(0, 0, 0); // Black color for the text
    doc.text(
      "Grade required for minimum 3.75 average:   ",
      15,
      doc.autoTable.previous.finalY + 35
    );

    if (neededGrade > 6 || neededGrade < 1) {
      doc.text(
        "Not possible",
        15 +
          (doc.getStringUnitWidth(
            "Grade required for minimum 3.75 average:   "
          ) *
            doc.internal.getFontSize()) /
            doc.internal.scaleFactor,
        doc.autoTable.previous.finalY + 35
      );
    } else {
      // Add the needed grade value to the document
      // Set the text color based on the average value
      if (neededGrade >= 4) {
        doc.setTextColor(0, 255, 0); // Green for positive values
      } else {
        doc.setTextColor(255, 0, 0); // Red for negative values
      }

      doc.text(
        neededGrade,
        15 +
          (doc.getStringUnitWidth(
            "Grade required for minimum 3.75 average:   "
          ) *
            doc.internal.getFontSize()) /
            doc.internal.scaleFactor,
        doc.autoTable.previous.finalY + 35
      );
    }

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
