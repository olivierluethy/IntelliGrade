async function exportToExcel(tableId, filename) {
  var table = document.getElementById(tableId);
  var rows = table ? table.querySelectorAll("tbody tr") : [];

  if (!table || rows.length === 0) {
    alert("Add some grades first");
    return;
  }

  // Same threshold and totals as the PDF export
  var PASS = "FF16A34A"; // green text
  var FAIL = "FFDC2626"; // red text
  var PASS_BG = "FFDCFCE7"; // light green fill
  var FAIL_BG = "FFFEE2E2"; // light red fill

  var data = [];
  var sum = 0;
  var count = 0;
  var sumGrades = 0;
  var sumWeights = 0;

  rows.forEach(function (row) {
    var inputs = row.querySelectorAll("input[type='number']");
    if (inputs.length >= 2) {
      var grade = parseFloat(inputs[0].value);
      var weight = parseFloat(inputs[1].value);
      data.push([grade, weight]);
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

  var average = sum / count;
  var neededGrade = (3.75 * (sumWeights + 1) - sumGrades).toFixed(2);

  var thin = {
    top: { style: "thin", color: { argb: "FFE2E8F0" } },
    left: { style: "thin", color: { argb: "FFE2E8F0" } },
    bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
    right: { style: "thin", color: { argb: "FFE2E8F0" } },
  };

  var workbook = new ExcelJS.Workbook();
  var worksheet = workbook.addWorksheet("Grades");
  worksheet.columns = [
    { header: "Grade", key: "grade", width: 34 },
    { header: "Weight", key: "weight", width: 16 },
  ];

  // Header row styling
  worksheet.getRow(1).eachCell(function (cell) {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF111827" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = thin;
  });

  // Grade rows — colour-code the grade cell green (pass) / red (fail)
  data.forEach(function (pair) {
    var grade = pair[0];
    var weight = pair[1];
    var row = worksheet.addRow([grade, weight]);
    row.eachCell(function (cell) {
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = thin;
    });

    var gradeCell = row.getCell(1);
    var pass = !isNaN(grade) && grade >= 4;
    gradeCell.font = { bold: true, color: { argb: pass ? PASS : FAIL } };
    gradeCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: pass ? PASS_BG : FAIL_BG },
    };
  });

  // Spacer + summary rows (same information as the PDF)
  worksheet.addRow([]);

  var avgRow = worksheet.addRow(["Average", isNaN(average) ? "" : Number(average.toFixed(2))]);
  avgRow.getCell(1).font = { bold: true };
  avgRow.getCell(2).font = { bold: true, color: { argb: average >= 4 ? PASS : FAIL } };
  avgRow.getCell(2).alignment = { horizontal: "center" };

  var notPossible = neededGrade > 6 || neededGrade < 1;
  var needRow = worksheet.addRow([
    "Grade required for minimum 3.75 average",
    notPossible ? "Not possible" : Number(neededGrade),
  ]);
  needRow.getCell(1).font = { bold: true };
  needRow.getCell(2).alignment = { horizontal: "center" };
  if (!notPossible) {
    needRow.getCell(2).font = { bold: true, color: { argb: neededGrade >= 4 ? PASS : FAIL } };
  }

  // Write the workbook and trigger the download
  var buffer = await workbook.xlsx.writeBuffer();
  var blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  var url = URL.createObjectURL(blob);
  var link = document.createElement("a");
  link.href = url;
  link.download = filename || "grades.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
