document.querySelector(".dwnPDF").addEventListener("click", function () {
  var table = document.getElementById("gradesTable");
  var rows = table ? table.querySelectorAll("tbody tr") : [];

  if (!table || rows.length === 0) {
    alert("Add some grades first!");
    return;
  }

  // Colours (display only — the numbers below are unchanged from the original logic)
  var GREEN = [22, 163, 74];
  var RED = [220, 38, 38];
  var INK = [15, 23, 42];
  var MUTED = [120, 130, 145];

  // Collect the table data and the running totals
  var data = [];
  var sum = 0; // sum of grade values
  var count = 0; // number of grade values
  var sumGrades = 0; // sum of grade * weight
  var sumWeights = 0; // sum of weights

  rows.forEach(function (row) {
    var inputs = row.querySelectorAll("input[type='number']");
    if (inputs.length >= 2) {
      var gradeStr = inputs[0].value;
      var weightStr = inputs[1].value;
      data.push([gradeStr, weightStr]);

      var grade = parseFloat(gradeStr);
      var weight = parseFloat(weightStr);
      if (!isNaN(grade)) {
        sum += grade;
        count++;
      }
      if (!isNaN(grade) && !isNaN(weight)) {
        sumGrades += grade * weight;
        sumWeights += weight;
      }
    }
  });

  // Same results as before: unweighted average, and needed grade for a 3.75 average (next weight = 1)
  var average = sum / count;
  var neededGrade = (3.75 * (sumWeights + 1) - sumGrades).toFixed(2);

  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF();
  var pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text("Grades Table", pageWidth / 2, 22, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text("IntelliGrade  ·  Swiss scale 1–6  ·  pass at 4.0", pageWidth / 2, 29, {
    align: "center",
  });

  // Grades table with green/red colour coding on the Grade column
  doc.autoTable({
    startY: 38,
    head: [["Grade", "Weight"]],
    body: data,
    theme: "grid",
    styles: { fontSize: 11, cellPadding: 3, halign: "center", lineColor: [226, 232, 240] },
    headStyles: { fillColor: [17, 24, 39], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: function (hook) {
      if (hook.section === "body" && hook.column.index === 0) {
        var value = parseFloat(hook.cell.raw);
        if (!isNaN(value)) {
          hook.cell.styles.textColor = value < 4 ? RED : GREEN;
          hook.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  var y = doc.lastAutoTable.finalY + 16;

  // Average
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(INK[0], INK[1], INK[2]);
  var avgLabel = "Average:  ";
  doc.text(avgLabel, 15, y);
  var avgColour = average >= 4 ? GREEN : RED;
  doc.setTextColor(avgColour[0], avgColour[1], avgColour[2]);
  doc.text(isNaN(average) ? "—" : average.toFixed(2), 15 + doc.getTextWidth(avgLabel), y);

  // Grade required to reach the wished average (minimum 3.75, as in the original)
  y += 11;
  doc.setTextColor(INK[0], INK[1], INK[2]);
  var neededLabel = "Grade required for minimum 3.75 average:   ";
  doc.text(neededLabel, 15, y);
  var neededX = 15 + doc.getTextWidth(neededLabel);

  if (neededGrade > 6 || neededGrade < 1) {
    doc.setTextColor(RED[0], RED[1], RED[2]);
    doc.text("Not possible", neededX, y);
  } else {
    var neededColour = neededGrade >= 4 ? GREEN : RED;
    doc.setTextColor(neededColour[0], neededColour[1], neededColour[2]);
    doc.text(String(neededGrade), neededX, y);
  }

  // Show the PDF in the preview modal
  var pdfData = doc.output("datauristring");
  document.getElementById("pdfPreview").src = pdfData;

  var modalPdf = document.getElementById("ModalPDFPreview");
  modalPdf.classList.remove("hidden");
  modalPdf.classList.add("flex");
});

// PDF preview modal: close handling
(function () {
  var modalPdf = document.getElementById("ModalPDFPreview");

  function closePreview() {
    modalPdf.classList.add("hidden");
    modalPdf.classList.remove("flex");
  }

  var spanPDF = document.getElementsByClassName("closePDF")[0];
  if (spanPDF) spanPDF.onclick = closePreview;

  modalPdf.addEventListener("click", function (event) {
    if (event.target === modalPdf) closePreview();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modalPdf.classList.contains("hidden")) {
      closePreview();
    }
  });
})();
