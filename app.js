// «تکمیل سفارش»: red border on the empty name + both cheque rows, then the error dialog
const rows = [...document.querySelectorAll(".cheque-btn")];
const name = document.querySelector(".content input");
const toName = () => { scrollTo({ top: name.getBoundingClientRect().top + scrollY - 60, behavior: "smooth" }); name.focus({ preventScroll: true }); }; // field at the top, 60px below the edge, ready to type
document.querySelector(".paybar button").onclick = () => {
  name.classList.toggle("xt-error", !name.value.trim());
  rows.forEach(r => r.classList.add("xt-error"));
  payBox.classList.toggle("xt-error", !radios.some(r => r.checked));
  dlg.showModal();
};
// payment method: picking one clears the red on the options box
const payBox = document.querySelector(".pay-opts");
const radios = [...payBox.querySelectorAll("input")];
radios.forEach(r => r.onchange = () => payBox.classList.remove("xt-error"));
name.oninput = () => name.classList.remove("xt-error"); // red goes away as soon as the user types
const dlg = document.querySelector(".err-dlg");
dlg.onclick = e => (e.target === dlg || e.target.closest(".ok")) && dlg.close(); // تایید or the backdrop close it
dlg.onclose = () => { const first = document.querySelector(".xt-error"); first === name ? toName() : first?.scrollIntoView({ behavior: "smooth", block: "center" }); }; // then show the first red item
// pre-invoice: only the name is required; the cheque/address rows are not checked (and lose any old red)
document.querySelector(".paybar .pre").onclick = () => {
  [...rows, payBox].forEach(r => r.classList.remove("xt-error"));
  const bad = !name.value.trim();
  name.classList.toggle("xt-error", bad);
  if (bad) warn.showModal(); // warning, then straight to the name field
};
const warn = document.querySelector(".err-dlg.warn");
warn.onclick = e => (e.target === warn || e.target.closest(".ok")) && warn.close();
warn.onclose = toName;
// «واریز به حساب»: opens the account modal; saved info shows inside the bank option box
const bank = payBox.querySelector("input[value=account]");
const pm = document.querySelector(".pay-modal"), sum = document.querySelector(".pay-sum");
const fish = pm.querySelector(".fish"), code = pm.querySelector(".track");
const bankTabs = [...pm.querySelectorAll(".bank-tabs button")]; // Sina / Mellat: show the matching card
bankTabs.forEach(t => t.onclick = () => { bankTabs.forEach(x => x.classList.toggle("active", x === t)); pm.querySelectorAll(".bank-card").forEach(c => c.hidden = c.dataset.bank !== t.dataset.bank); });
const dayBtns = [...pm.querySelectorAll(".pay-date button")], past = pm.querySelector(".past-date");
const [ySel, mSel, dSel] = past.querySelectorAll("select");
const fa = (n, w = 1) => String(n).padStart(w, "0").replace(/\d/g, c => "۰۱۲۳۴۵۶۷۸۹"[c]);
const year = +new Intl.DateTimeFormat("en-u-ca-persian", { year: "numeric" }).format(new Date()).replace(/\D/g, "");
[year, year - 1].forEach(y => ySel.add(new Option(fa(y), y)));
"فروردین اردیبهشت خرداد تیر مرداد شهریور مهر آبان آذر دی بهمن اسفند".split(" ").forEach((m, i) => mSel.add(new Option(m, i + 1)));
for (let d = 1; d <= 31; d++) dSel.add(new Option(fa(d), d));
let saved = false;
bank.addEventListener("change", () => saved || openPm());
sum.querySelector(".pay-edit").onclick = e => { e.preventDefault(); openPm(); };
pm.querySelectorAll(".copy-btn").forEach(b => { b.lastElementChild.innerHTML = 'کپی شد<i class="ph ph-check" aria-hidden="true"></i>'; /* filled up front so the open animation has its real width */ b.onmousedown = e => e.preventDefault(); /* tap must not move focus or scroll */ b.onclick = async () => {
  // badge grows right from the icon; pulled left only by what would spill past its box (or the row label beside it)
  const box = b.closest(".bc-num, .bc-row"), lbl = box.querySelector(":scope > small"), br = b.getBoundingClientRect(), l = lbl?.getBoundingClientRect();
  const edge = l && l.bottom > br.top && l.top < br.bottom ? l.left - 8 : box.getBoundingClientRect().right - 6;
  b.style.setProperty("--s", Math.max(0, b.lastElementChild.offsetWidth - (edge - br.left)) + "px");
  b.classList.remove("done"); void b.offsetWidth; b.classList.add("done"); // feedback right away (replays on repeat taps), not after the clipboard promise
  clearTimeout(b.timer); b.timer = setTimeout(() => b.classList.remove("done"), 1500); // badge fades out
  try { await navigator.clipboard.writeText(b.dataset.copy); } catch { // old Safari: off-screen read-only field, 16px + preventScroll so iOS doesn't zoom/scroll or move the address bar
    const f = Object.assign(document.createElement("textarea"), { value: b.dataset.copy, readOnly: true });
    f.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px";
    pm.append(f); f.focus({ preventScroll: true }); f.setSelectionRange(0, f.value.length); document.execCommand("copy"); f.remove();
  }
}; });
// tap or long-press on the number itself copies too (no text selection / iOS callout)
pm.querySelectorAll(".has-copy").forEach(n => { const b = n.querySelector(".copy-btn"); let hold;
  n.onpointerdown = e => { n.held = false; if (!e.target.closest(".copy-btn")) hold = setTimeout(() => { n.held = true; b.click(); }, 450); };
  n.onpointerup = n.onpointercancel = n.onpointerleave = () => clearTimeout(hold);
  n.onclick = e => { if (!e.target.closest(".copy-btn") && !n.held) b.click(); };
  n.oncontextmenu = e => e.preventDefault();
});
pm.querySelector(".back-btn").onclick = () => pm.close();
// iOS: the keyboard doesn't shrink 100dvh, so size the modal to the visible area; the save button then sits right above the keyboard
const vv = window.visualViewport;
const fit = () => { const kb = vv.height < innerHeight - 100; pm.style.setProperty("--vvh", kb ? vv.height + "px" : ""); pm.style.setProperty("--vvt", kb ? vv.offsetTop + "px" : ""); }; // only while the keyboard is up, so normal scrolling stays inside the modal // offsetTop undoes Safari's page scroll
if (vv) { vv.addEventListener("resize", fit); vv.addEventListener("scroll", fit); }
pm.addEventListener("focusin", e => e.target.matches("input:not([readonly])") && setTimeout(() => e.target.scrollIntoView({ block: "center" }), 300)); // after the keyboard settles
code.onkeydown = e => e.key === "Enter" && pm.querySelector(".pay-save").click(); // keyboard «done» saves
pm.onclose = () => { clearTimeout(hint.t0); hint.classList.remove("on"); if (!saved) bank.checked = false; }; // closed without saving: the choice is not complete
// mock: no real upload, a click just fills in a sample receipt
fish.onclick = pm.querySelector(".question-box").onclick = () => { fish.value = "receipt-1405.jpg"; fish.classList.remove("xt-error"); };
dayBtns.forEach(b => b.onclick = () => {
  dayBtns.forEach(x => { x.classList.toggle("active", x === b); x.classList.toggle("blue-lb", x === b); x.classList.remove("xt-error"); });
  past.hidden = b.dataset.d !== "past";
});
dayBtns.find(b => b.dataset.d === "today").click(); // most people register the receipt the day they pay: one less tap
pm.querySelectorAll("input, select").forEach(el => el.addEventListener("input", () => el.classList.remove("xt-error")));
pm.querySelector(".pay-save").onclick = () => {
  const d = pm.querySelector(".pay-date .active")?.dataset.d;
  dayBtns.forEach(b => b.classList.toggle("xt-error", !d));
  [ySel, mSel, dSel].forEach(x => x.classList.toggle("xt-error", d === "past" && !x.value));
  code.classList.toggle("xt-error", !code.value.trim());
  const bad = pm.querySelector(".xt-error");
  if (bad) {
    const body = pm.querySelector(".menu-fixed-body"), below = bad.getBoundingClientRect().top > body.getBoundingClientRect().bottom - 40;
    bad.scrollIntoView({ block: "center", behavior: "smooth" });
    if (below) flashHint();
    return;
  }
  sum.querySelector(".s-date").textContent = d === "today"
    ? new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" })
    : `${fa(ySel.value)}/${fa(mSel.value, 2)}/${fa(dSel.value, 2)}`;
  sum.querySelector(".s-code").textContent = code.value.trim();
  sum.classList.add("filled"); saved = true; payBox.classList.remove("xt-error");
  pm.close();
};

// «scroll down» cue: white arrow over a dark fade, shown 2s when the missing field is below the fold
const hint = document.createElement("div"); hint.className = "scroll-hint"; hint.setAttribute("aria-hidden", "true"); hint.innerHTML = '<i class="ph ph-arrow-down"></i>';
pm.querySelector(".menu-fixed-design").append(hint);
const flashHint = () => { hint.classList.add("on"); clearTimeout(hint.t); hint.t = setTimeout(() => hint.classList.remove("on"), 2000); };
const openPm = () => { pm.showModal(); clearTimeout(hint.t0); hint.t0 = setTimeout(flashHint, 200); }; // cue comes in after the modal has settled
