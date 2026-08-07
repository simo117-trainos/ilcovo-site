(() => {
  const mount = document.querySelector("[data-site-footer]");
  if (!mount) return;

  const footerUrl = new URL("components/footer.html?v=1", document.baseURI);

  fetch(footerUrl)
    .then(response => {
      if (!response.ok) throw new Error(`Footer request failed: ${response.status}`);
      return response.text();
    })
    .then(html => {
      mount.innerHTML = html;

      const footer = mount.querySelector(".site-footer");
      const floatingActions = document.querySelectorAll(".intro-bottom-pill, #wa");
      if (!footer || !floatingActions.length) return;

      const footerObserver = new IntersectionObserver(([entry]) => {
        floatingActions.forEach(action => {
          action.classList.toggle("is-footer-hidden", entry.isIntersecting);
        });
      }, { threshold:.05 });

      footerObserver.observe(footer);
    })
    .catch(error => console.error("Unable to load shared footer.", error));
})();
