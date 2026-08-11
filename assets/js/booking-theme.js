(() => {
  const body = document.body;
  if (!body.classList.contains("booking-page")) return;

  const trialTypeInputs = Array.from(
    document.querySelectorAll('#booking-form-prova input[name="tipo-prova"]')
  );

  const applyTrialTheme = () => {
    const selected = trialTypeInputs.find(input => input.checked)?.value || "";

    body.classList.remove(
      "booking-trial-crossfit",
      "booking-trial-hyrox",
      "booking-trial-neutral"
    );

    if (selected === "CrossFit") {
      body.classList.add("booking-trial-crossfit");
    } else if (selected === "HYROX") {
      body.classList.add("booking-trial-hyrox");
    } else {
      body.classList.add("booking-trial-neutral");
    }
  };

  trialTypeInputs.forEach(input => input.addEventListener("change", applyTrialTheme));
  applyTrialTheme();
})();
