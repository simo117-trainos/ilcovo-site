(() => {
  const box = document.querySelector(".cr-share");
  if (!box) return;
  const url = box.dataset.shareUrl;
  const title = box.dataset.shareTitle;

  const native = box.querySelector("[data-share-native]");
  if (native && navigator.share) {
    native.hidden = false;
    native.addEventListener("click", () => {
      navigator.share({ title, url }).catch(() => {});
    });
  }

  const copy = box.querySelector("[data-share-copy]");
  if (copy) {
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(url);
        copy.textContent = "Link copiato";
      } catch (e) {
        window.prompt("Copia il link:", url);
      }
      setTimeout(() => { copy.textContent = "Copia link"; }, 2000);
    });
  }
})();
