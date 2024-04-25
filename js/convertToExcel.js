function exportToExcel(tableId, filename) {
  // Reference the table element
  const table = document.getElementById(tableId);

  // Check if table exists
  if (!table) {
    alert("Add some grades first");
    return;
  }

  // Create a workbook using SheetJS
  const workbook = XLSX.utils.book_new();

  // Create a new worksheet
  const worksheet = XLSX.utils.aoa_to_sheet([["Grade", "Weight"]]);

  // Get all rows of the table
  const rows = table.querySelectorAll("tr");

  // Loop through each row and extract values from input fields
  rows.forEach((row, rowIndex) => {
    const cells = row.querySelectorAll('td input[type="number"]');
    const rowData = [];
    cells.forEach((cell, cellIndex) => {
      const value = cell.value;
      // Add the value to the rowData array
      rowData[cellIndex] = value;
      // Determine background color based on the grade
      const color = value < 4 ? "FF0000" : "00FF00"; // Red for grades under 4, green for 4 and above
      // Set background color for the cell
      XLSX.utils.format_cell(
        { s: { bg_color: { rgb: color } } },
        { c: cellIndex, r: rowIndex + 1 },
        worksheet
      );
    });
    // Add the row data to the worksheet
    XLSX.utils.sheet_add_aoa(worksheet, [rowData], { origin: -1 });
  });

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Grades");

  // Write the workbook to a file and initiate download
  XLSX.writeFile(workbook, filename || "grades.xlsx");
}
