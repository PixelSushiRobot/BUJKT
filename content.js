(() => {
  "use strict";
  const BTN_ID = "bujkt-sort-price-btn";
  let direction = "asc"; // 'asc' = low→high, 'desc' = high→low

  function runSort(dir) {
    const modal = document.querySelector("o-profile-hub-modal");
    if (!modal) return { ok: false, msg: "hub closed" };

    // Grid = <div class="list"> of <o-card-list-item>, inside the modal.
    const lists = Array.from(modal.querySelectorAll("div.list")).filter((l) =>
      l.querySelector("o-card-list-item"),
    );
    if (!lists.length) return { ok: false, msg: "no cards" };
    const grid = lists.sort(
      (a, b) =>
        b.querySelectorAll("o-card-list-item").length -
        a.querySelectorAll("o-card-list-item").length,
    )[0];

    const items = Array.from(
      grid.querySelectorAll(":scope > o-card-list-item"),
    );

    // Price = the "Buy N ꜩ" amount in the highlight button; null => "Make offer".
    const buyPriceOf = (item) => {
      const hl = item.querySelector("o-token-card-highlight");
      if (!hl) return null;
      const m = Array.from((hl.textContent || "").matchAll(/([\d.,]+)\s*ꜩ/g));
      if (!m.length) return null;
      return parseFloat(m[m.length - 1][1].replace(/,/g, ""));
    };

    let hidden = 0;
    const priced = [];
    for (const item of items) {
      const price = buyPriceOf(item);
      if (price === null) {
        item.style.display = "none";
        hidden++;
      } else {
        item.style.display = "";
        priced.push([item, price]);
      }
    }

    priced.sort((a, b) => (dir === "asc" ? a[1] - b[1] : b[1] - a[1]));
    for (const [item] of priced) grid.appendChild(item);

    return { ok: true, shown: priced.length, hidden };
  }

  function setIcon(btn, dir) {
    const icon = btn.querySelector("i");
    if (icon)
      icon.className =
        dir === "asc"
          ? "ph ph-sort-ascending text-lg"
          : "ph ph-sort-descending text-lg";
  }

  function onClick(btn) {
    const applied = direction; // the sort we're about to run
    const res = runSort(applied);
    if (!res.ok) {
      btn.dataset.tip = res.msg;
      setTimeout(() => (btn.dataset.tip = "Sort by price"), 1500);
      return;
    }
    setIcon(btn, applied); // icon reflects the sort just applied
    direction = applied === "asc" ? "desc" : "asc"; // queue the opposite for next click
    btn.dataset.tip = `${res.shown} shown · ${res.hidden} hidden`;
    setTimeout(() => (btn.dataset.tip = "Sort by price"), 1800);
  }

  function makeButton() {
    const btn = document.createElement("button");
    btn.id = BTN_ID;
    btn.type = "button";
    btn.className = "btn btn-sm btn-circle tooltip tooltip-left"; // match native
    btn.dataset.tip = "Sort by price";
    const icon = document.createElement("i");
    icon.className = "ph ph-sort-ascending text-lg";
    btn.appendChild(icon);
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick(btn);
    });
    return btn;
  }

  // Insert into the Profile hub's Select/Customize toolbar only.
  function injectButton() {
    const modal = document.querySelector("o-profile-hub-modal");
    if (!modal) return; // hub not open
    if (!modal.querySelector("o-profile-bookmarks")) {
      // not on Bookmarks tab
      const stale = modal.querySelector("#" + BTN_ID);
      if (stale) stale.remove();
      return;
    }
    if (modal.querySelector("#" + BTN_ID)) return; // already present

    // The Select/Customize buttons share a <div class="flex shrink-0 gap-2">.
    const anchor =
      modal.querySelector('[data-tip="Customize"]') ||
      modal.querySelector('[data-tip="Select"]');
    if (!anchor) return;
    const toolbar = anchor.parentElement; // flex shrink-0 gap-2
    toolbar.insertBefore(makeButton(), toolbar.firstChild); // place before Select
  }

  const mo = new MutationObserver(() => injectButton());
  mo.observe(document.documentElement, { childList: true, subtree: true });
  injectButton();
})();
