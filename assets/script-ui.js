
const range = document.querySelector("#rayon");
const bubble = document.querySelector("#bubble");

range.addEventListener("input", () => {
    bubble.innerHTML = range.value+"m";
  });

range.value = 500;
bubble.innerHTML = range.value+"m";
