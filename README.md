<p align="center">
  <a href="https://github.com/olivierluethy/IntelliGrade">
    <img src="images/favicon.ico" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Welcome to IntelliGrade!</h3>
  <p align="center">An app that calculates a lot of important things with grades!</p>
</p>

## Features

- **Grade Calculation:** Easily calculate your grade based on points.
- **Calculate the grade you need:** Have a bad average and want to improve it? Calculate the next grade you need, along with the specific weight. Our new modal window is designed to calculate the grade you need as easily as possible.
- **Grade increase or decrease:** Often the teacher raises the grades. You can use this function to calculate the raise.
- **Older grade calculation by increased percentage:** Sometimes your teacher will tell you that grades have been raised by 0.5 or even a full grade. These functions allow you to calculate your original grade based on this information.

## Getting Started

1. Clone this repository.
2. Run `npm install`.
3. Run `npm run dev` and open the printed local URL.

## Tech Stack

Vite · React · TypeScript · Tailwind CSS · Zustand · Lucide · Vitest

## Architecture

- `src/domain/` — pure, framework-free grade logic behind a `GradeScale` interface (unit-tested with Vitest).
- `src/store/` — Zustand state with versioned localStorage persistence.
- `src/components/` — reusable dark-theme UI primitives.
- `src/features/` — app screens (semester switcher, subject list, subject detail, calculators).

Data model: **Semester → Subject → Grade**, all saved locally in the browser.

## How to Contribute

We welcome contributions to make IntelliGrade even better! Feel free to fork the repository, make your improvements, and submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

If you have any questions or feedback, please contact us at [spamemailadresseol221@gmail.com].

Enhance your school and academic journey with IntelliGrade - Your Smart Academic Companion!

## Links that were very useful during this trip

Implement input field in JavaScript Alert Box

- https://stackoverflow.com/questions/51578629/how-can-i-put-an-input-in-the-alert-box <br>

How to exit early from a function using "return"

- https://stackoverflow.com/questions/3330193/early-exit-from-function <br>

To check if it's a number or not

- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/isNaN?retiredLocale=de <br>

JavaScript convert to float

- https://www.google.com/search?q=javascript+convert+to+float&oq=javascript+convert+to+float&aqs=chrome..69i57.9452j0j1&sourceid=chrome&ie=UTF-8 <br>

Formula used to calculate grades according to their weights

- https://calculatodo.com/de/gewichteter-durchschnitt-der-noten-berechnen#:~:text=Mit%20anderen%20Worten%2C%20es%20handelt,54)%20%2F%204%20%3D%2058.<br>

Close icon

- https://www.w3schools.com/icons/tryit.asp?filename=tryicons_fa-close<br>

How to create complete circles with CSS

- https://www.w3schools.com/howto/howto_css_circles.asp<br>

Tables with HTML & CSS

- https://www.w3schools.com/html/html_tables.asp<br>

Custom scroll bar

- https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_custom_scrollbar2<br>

Box shadow presets

- https://getcssscan.com/css-box-shadow-examples<br>

Create a custom Box Shadow CSS Generator

- https://cssgenerator.org/box-shadow-css-generator.html<br>

How to create an animated modal

- https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_modal2<br>

How to create an overflow inside of a box

- https://www.w3schools.com/cssref/tryit.php?filename=trycss_overflow<br>

Link to use the font-awesome icons

- https://www.w3schools.com/icons/tryit.asp?filename=tryicons_awesome

An icon to indicate that something is finished

- https://www.w3schools.com/icons/tryit.asp?filename=tryicons_fa-flag-checkered

How to show a website in a website

- https://www.w3schools.com/tags/tryit.asp?filename=tryhtml_iframe

Links for jsPDF:

- https://stackoverflow.com/questions/56754310/how-to-change-the-text-color-of-the-cell-on-condition-in-autotable-jspdf-in-angu
- https://stackoverflow.com/questions/28025308/how-to-highlight-fill-a-specific-cell-with-colour-in-jspdf-setfillcolor-not-wo
- https://stackoverflow.com/questions/28025308/how-to-highlight-fill-a-specific-cell-with-colour-in-jspdf-setfillcolor-not-wo
- https://stackoverflow.com/questions/63359871/how-to-set-opacity-for-text-color-in-jspdf
- https://stackoverflow.com/questions/44781137/how-to-change-line-color-in-jspdf
- https://jsfiddle.net/sp5qr4fd/4/
