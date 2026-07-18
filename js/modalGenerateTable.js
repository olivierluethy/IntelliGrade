document.addEventListener("DOMContentLoaded", function () {
  var gradeInput = document.getElementById("grade");
  var weightInput = document.getElementById("weighting");
  var tableBody = document.querySelector("#gradesTable tbody");
  var thead = document.querySelector("#gradesTable thead");
  var emptyState = document.getElementById("emptyState");
  var finishBar = document.querySelector(".finish");
  var gradeError = document.getElementById("gradeError");
  var weightError = document.getElementById("weightError");

  // Implement standard weighting of one, which is usual
  weightInput.value = 1;

  // Numbers only for both fields (blocks letters/exponent chars + invalid pastes)
  attachNumericOnly(gradeInput);
  attachNumericOnly(weightInput);

  // Live pass/fail colouring of the grade field
  attachGradeColour(gradeInput);

  // Clear an inline error as soon as the user edits the field again
  gradeInput.addEventListener("input", function () {
    clearFieldError(gradeInput, gradeError);
  });
  weightInput.addEventListener("input", function () {
    clearFieldError(weightInput, weightError);
  });

  refreshChrome();

  // Add the grade when Enter is pressed inside one of the two fields
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Enter") return;
    var active = document.activeElement;
    if (active !== gradeInput && active !== weightInput) return;
    event.preventDefault();
    addGrade();
  });

  function addGrade() {
    var markStr = gradeInput.value.trim();
    var weightStr = weightInput.value.trim();

    clearFieldError(gradeInput, gradeError);
    clearFieldError(weightInput, weightError);

    var mark = parseFloat(markStr);
    var weight = parseFloat(weightStr);
    var ok = true;

    if (markStr === "") {
      showFieldError(gradeInput, gradeError, "Enter a grade.");
      ok = false;
    } else if (isNaN(mark) || mark < 1 || mark > 6) {
      // Swiss format: 1 worst; 6 best
      showFieldError(gradeInput, gradeError, "Enter a valid grade (1–6, Swiss scale).");
      ok = false;
    }

    if (weightStr === "") {
      showFieldError(weightInput, weightError, "Enter a weight.");
      ok = false;
    } else if (isNaN(weight)) {
      showFieldError(weightInput, weightError, "Enter a valid number.");
      ok = false;
    }

    if (!ok) return;

    insertRow(markStr, weightStr);
    refreshChrome();

    // Ready the field for the next entry
    gradeInput.value = "";
    colourGrade(gradeInput);
    gradeInput.select();
    gradeInput.focus();

    // Scroll to the newest row
    var container = document.getElementById("gradesTable-container");
    container.scrollTop = container.scrollHeight;
  }

  function insertRow(mark, weight) {
    var row = tableBody.insertRow();
    row.className = "border-t border-white/5 [&:nth-child(even)]:bg-white/[0.03]";

    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    cell1.className = "px-4 py-2 text-center align-middle";
    cell2.className = "px-4 py-2 text-center align-middle";
    cell3.className = "px-4 py-2 text-center align-middle";

    var rowFieldClass =
      "w-24 rounded-lg border border-white/10 bg-ink-950/60 px-2 py-1.5 text-center font-display tabular-nums text-slate-100 focus:border-brand-cyan focus:outline-none focus:ring-2 focus:ring-brand-cyan/25";

    // Grade input (kept type=number so PDF/Excel/needed-grade selectors still match)
    var gradeCell = document.createElement("input");
    gradeCell.type = "number";
    gradeCell.step = "0.1";
    gradeCell.value = mark || "";
    gradeCell.className = rowFieldClass;
    attachNumericOnly(gradeCell);
    attachGradeColour(gradeCell);
    cell1.appendChild(gradeCell);

    // Weight input
    var weightCell = document.createElement("input");
    weightCell.type = "number";
    weightCell.step = "0.1";
    weightCell.value = weight || "";
    weightCell.className = rowFieldClass;
    attachNumericOnly(weightCell);
    cell2.appendChild(weightCell);

    // Delete button — clean Tailwind icon button (no stray offset circle)
    var deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.title = "Delete line";
    deleteBtn.setAttribute("aria-label", "Delete line");
    deleteBtn.className =
      "icon-btn h-9 w-9 text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 focus-visible:ring-rose-500/40";
    deleteBtn.innerHTML =
      '<svg class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />' +
      '<line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>';
    deleteBtn.addEventListener("click", function () {
      row.remove();
      refreshChrome();
    });
    cell3.appendChild(deleteBtn);
  }

  // Show/hide the header, empty state and action bar depending on whether we have rows
  function refreshChrome() {
    var hasRows = tableBody.children.length > 0;
    thead.classList.toggle("hidden", !hasRows);
    emptyState.classList.toggle("hidden", hasRows);
    finishBar.classList.toggle("hidden", !hasRows);
    finishBar.classList.toggle("flex", hasRows);
  }
});

// --- helpers (module scope) ---

function attachNumericOnly(input) {
  input.addEventListener("keydown", function (e) {
    if (["e", "E", "+", "-"].indexOf(e.key) !== -1) e.preventDefault();
  });
  input.addEventListener("paste", function (e) {
    var text = (e.clipboardData || window.clipboardData).getData("text");
    if (/[^0-9.]/.test(text)) e.preventDefault();
  });
}

function colourGrade(input) {
  input.classList.remove("text-emerald-400", "text-rose-400", "text-slate-100");
  var v = parseFloat(input.value);
  if (input.value.trim() === "" || isNaN(v)) {
    input.classList.add("text-slate-100");
  } else if (v < 4) {
    input.classList.add("text-rose-400");
  } else {
    input.classList.add("text-emerald-400");
  }
}

function attachGradeColour(input) {
  colourGrade(input);
  input.addEventListener("input", function () {
    colourGrade(input);
  });
}

function showFieldError(input, errorEl, message) {
  input.classList.add("border-rose-500", "ring-2", "ring-rose-500/30");
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

function clearFieldError(input, errorEl) {
  input.classList.remove("border-rose-500", "ring-2", "ring-rose-500/30");
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
}
