// Doulie landing — hand-written behaviors replacing the former Next.js
// bundle. Three jobs: waitlist submits (Supabase REST), the stages
// carousel (native scroll-snap + arrows/status), and nothing else — the
// FAQ uses native <details>.
(function () {
  "use strict";

  var SUPABASE_URL = "https://dsfdidqavhpnkssswpbr.supabase.co";
  var SUPABASE_KEY = "sb_publishable_uH2DWPqVgKx9UCKJq8ESOw_x5ObbeMy";
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ---- Waitlist -----------------------------------------------------------

  function submitWaitlist(email, stage) {
    var row = { email: email, source: "landing" };
    if (stage) row.stage = stage;
    return fetch(SUPABASE_URL + "/rest/v1/waitlist_signups", {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(row)
    }).then(function (res) {
      if (res.ok) return { ok: true };
      return res.text().then(function (text) {
        var msg = (text || "").toLowerCase();
        // Duplicate signup reads as success — they're already on the list.
        if (res.status === 409 || msg.indexOf("duplicate") >= 0 || msg.indexOf("unique") >= 0) {
          return { ok: true };
        }
        return {
          ok: false,
          message: "We couldn't reach the waitlist just now. Please try again, or email hello@douliesleep.com."
        };
      });
    }).catch(function () {
      return {
        ok: false,
        message: "Could not reach the Doulie servers. Please check your connection and try again."
      };
    });
  }

  function wireForm(prefix) {
    var form = document.querySelector('[data-testid="' + prefix + '-form"]');
    if (!form) return;
    var input = document.getElementById(prefix + "-email");
    var select = document.getElementById(prefix + "-stage");
    var message = form.querySelector('[data-testid="' + prefix + '-message"]');
    var submit = form.querySelector('[data-testid="' + prefix + '-submit"]');
    var idleText = message ? message.textContent : "";

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var email = (input.value || "").trim().toLowerCase();
      if (!EMAIL_RE.test(email)) {
        input.setAttribute("aria-invalid", "true");
        if (message) {
          message.textContent = "Please enter a valid email address.";
          message.classList.add("waitlist-message--error");
        }
        return;
      }
      input.setAttribute("aria-invalid", "false");
      if (message) {
        message.textContent = idleText;
        message.classList.remove("waitlist-message--error");
      }
      submit.disabled = true;
      submit.textContent = "Adding you…";

      submitWaitlist(email, select && select.value ? select.value : null).then(function (result) {
        if (result.ok) {
          var success = document.createElement("div");
          success.className = "waitlist-success";
          success.setAttribute("role", "status");
          success.innerHTML =
            '<span class="waitlist-success-icon" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></span>' +
            '<p class="waitlist-success-text">You’re on the list. We’ll email you the moment Doulie lands on the App Store.</p>';
          form.replaceWith(success);
        } else {
          submit.disabled = false;
          submit.textContent = "Notify me at launch";
          if (message) {
            message.textContent = result.message;
            message.classList.add("waitlist-message--error");
          }
        }
      });
    });
  }

  wireForm("hero");
  wireForm("footer");

  // ---- Stages carousel ----------------------------------------------------

  var track = document.querySelector(".stages-track");
  var status = document.querySelector(".stages-status");
  var prev = document.querySelector('[data-testid="stages-prev"]');
  var next = document.querySelector('[data-testid="stages-next"]');

  if (track && status && prev && next) {
    var cards = Array.prototype.slice.call(track.querySelectorAll(".stage-card"));

    var currentIndex = function () {
      var mid = track.scrollLeft + track.clientWidth / 2;
      var best = 0, bestDist = Infinity;
      cards.forEach(function (card, i) {
        var center = card.offsetLeft + card.offsetWidth / 2;
        var dist = Math.abs(center - mid);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      return best;
    };

    var render = function () {
      var i = currentIndex();
      var title = cards[i].querySelector(".stage-title");
      status.textContent = "Showing " + (i + 1) + " of " + cards.length + ": " + (title ? title.textContent : "");
      prev.disabled = i === 0;
      next.disabled = i === cards.length - 1;
      cards.forEach(function (card, j) {
        card.setAttribute("aria-hidden", j === i ? "false" : "true");
      });
    };

    var scrollToCard = function (i) {
      i = Math.max(0, Math.min(cards.length - 1, i));
      cards[i].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    };

    prev.addEventListener("click", function () { scrollToCard(currentIndex() - 1); });
    next.addEventListener("click", function () { scrollToCard(currentIndex() + 1); });

    var pending = null;
    track.addEventListener("scroll", function () {
      if (pending) cancelAnimationFrame(pending);
      pending = requestAnimationFrame(render);
    }, { passive: true });

    render();
  }
})();
