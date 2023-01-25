function calculateGrade(){
    /* Calculate grade */
    let earnedPoints = parseInt(document.getElementById("earnedPoints").value);
    let maxPoints = parseInt(document.getElementById("maxPoints").value);

    let grade = (earnedPoints * 5) / maxPoints + 1

    document.getElementById("showGrade").innerHTML = "Your grade is a: " + grade;
}