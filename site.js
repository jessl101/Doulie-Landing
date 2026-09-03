// Doulie landing — hand-written behaviors, no framework. Three jobs:
// waitlist submits (Supabase REST), the night sky (a 3D star field on
// Canvas plus the scroll-driven sky and bedside clock), and the props'
// tilt. The FAQ uses native <details>. See concept/direction.html.
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
            '<p class="waitlist-success-text">You’re on the list. One email the day Doulie lands on the App Store, then we’ll let you sleep.</p>';
          form.replaceWith(success);
        } else {
          submit.disabled = false;
          submit.textContent = "Save my spot";
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

  // ---- Night sky --------------------------------------------------------
  // A 3D star field: perspective projection, depth of field, a scroll dolly,
  // a few units of cursor pan, and one shooting star. Night scenes only for
  // the meteor; everything renders one still frame under reduced motion.

  document.documentElement.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cv = document.getElementById("stars");
  var ctx = cv && cv.getContext ? cv.getContext("2d") : null;
  var sceneMix = 0;     // 0 night → 1 dawn (stars fade)
  var scrollP = 0;

  if (ctx) {
    var W, H, DPR, stars = [], sparks = [];
    var FOCAL = 720, NEAR = 120, FAR = 2600, FOCUS = 900;
    var camZ = -520, camX = 0, camY = 0, mx = 0, my = 0;
    var meteor = null, nextMeteor = 2.6;
    var tints = [[242, 239, 232, 0.58], [160, 154, 202, 0.27], [170, 191, 170, 0.15]];

    var pick = function () {
      var r = Math.random(), a = 0;
      for (var i = 0; i < tints.length; i++) { a += tints[i][3]; if (r <= a) return tints[i]; }
      return tints[0];
    };
    var seed = function (z) {
      return { x: (Math.random() - 0.5) * 3400, y: (Math.random() - 0.5) * 2200, z: z,
               r: 0.7 + Math.random() * 1.9, c: pick(), ph: Math.random() * 6.28, sp: 0.4 + Math.random() * 1.2 };
    };
    var resize = function () {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.width = Math.floor(window.innerWidth * DPR);
      H = cv.height = Math.floor(window.innerHeight * DPR);
      var n = Math.min(1100, Math.floor(window.innerWidth * window.innerHeight / 1400));
      stars = [];
      for (var i = 0; i < n; i++) stars.push(seed(NEAR + Math.random() * (FAR - NEAR)));
      sparks = [];
      for (var j = 0; j < 9; j++) {
        var s = seed(500 + Math.random() * 1500);
        s.r = 6 + Math.random() * 7; s.rot = Math.random() * 6.28; sparks.push(s);
      }
    };
    window.addEventListener("resize", resize, { passive: true });
    resize();
    window.addEventListener("pointermove", function (e) {
      mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });

    var dot = function (sx, sy, rad, col, a, blur) {
      if (blur < 0.06) {
        ctx.fillStyle = "rgba(" + col[0] + "," + col[1] + "," + col[2] + "," + a + ")";
        ctx.beginPath(); ctx.arc(sx, sy, rad, 0, 6.283); ctx.fill(); return;
      }
      var R = Math.min(rad * (1 + blur * 6), 22 * DPR);
      var g = ctx.createRadialGradient(sx, sy, 0, sx, sy, R);
      g.addColorStop(0, "rgba(" + col[0] + "," + col[1] + "," + col[2] + "," + (a * (1 - blur * 0.55)) + ")");
      g.addColorStop(1, "rgba(" + col[0] + "," + col[1] + "," + col[2] + ",0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, R, 0, 6.283); ctx.fill();
    };
    var fourPoint = function (sx, sy, r, rot, a) {
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(rot);
      ctx.fillStyle = "rgba(245,162,93," + a + ")";
      ctx.beginPath();
      for (var k = 0; k < 4; k++) { ctx.lineTo(0, -r); ctx.lineTo(r * 0.22, -r * 0.22); ctx.rotate(Math.PI / 2); }
      ctx.closePath(); ctx.fill();
      var g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.8);
      g.addColorStop(0, "rgba(245,162,93," + (a * 0.45) + ")"); g.addColorStop(1, "rgba(245,162,93,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 1.8, 0, 6.283); ctx.fill();
      ctx.restore();
    };

    var t0 = performance.now(), running = false;
    var frame = function (now) {
      running = !reduce && document.visibilityState === "visible";
      var t = (now - t0) / 1000;
      camZ += (scrollP * 1500 - camZ) * (reduce ? 1 : 0.045);
      camX += (mx * -90 - camX) * 0.06; camY += (my * -60 - camY) * 0.06;
      var drift = reduce ? 0 : Math.sin(t * 0.11) * 18;
      ctx.clearRect(0, 0, W, H);
      var cx = W / 2, cy = H / 2, f = FOCAL * DPR, starA = 1 - sceneMix * 0.82;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i], dz = s.z - camZ;
        if (dz < NEAR) { s.z += FAR - NEAR; dz = s.z - camZ; }
        if (dz > FAR) { s.z -= FAR - NEAR; dz = s.z - camZ; }
        var k = f / dz, sx = cx + (s.x + camX + drift) * k, sy = cy + (s.y + camY) * k;
        if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue;
        var rad = s.r * k * 1.35 * DPR, tw = reduce ? 1 : (0.72 + 0.28 * Math.sin(t * s.sp + s.ph));
        var blur = Math.min(1, Math.abs(dz - FOCUS) / FOCUS);
        var a = Math.min(1, 1.15 - dz / FAR) * tw * starA * 0.95;
        if (a <= 0.01) continue;
        dot(sx, sy, Math.max(0.6, rad), s.c, a, blur);
      }
      // shooting star: the path is chosen in screen space so it crosses the open
      // sky at any viewport size, then lifted into the volume at a real depth so
      // it parallaxes like everything else. Night scenes only.
      if (!reduce && !meteor && t > nextMeteor && sceneMix < 0.5 && running) {
        var zc = 900 + Math.random() * 600, kz = f / zc;
        var x0 = W * (0.62 + Math.random() * 0.33), y0 = -H * 0.06;
        var x1 = W * (0.28 + Math.random() * 0.27), y1 = H * (0.26 + Math.random() * 0.22);
        meteor = { x: (x0 - cx) / kz - camX - drift, y: (y0 - cy) / kz - camY, z: zc + camZ,
                   dx: (x1 - x0) / kz, dy: (y1 - y0) / kz, dz: -180,
                   dur: 1.3 + Math.random() * 0.4, born: t };
      }
      if (meteor) {
        var m = meteor, u = (t - m.born) / m.dur;
        if (u >= 1) { meteor = null; nextMeteor = t + 7 + Math.random() * 6; }
        else {
          var e = 1 - Math.pow(1 - u, 2.2);
          var hx = m.x + m.dx * e, hy = m.y + m.dy * e, hz = m.z + m.dz * e - camZ;
          var tl = Math.max(0, e - 0.2), tx = m.x + m.dx * tl, ty = m.y + m.dy * tl, tz = m.z + m.dz * tl - camZ;
          var kh = f / hz, kt = f / tz;
          var hX = cx + (hx + camX + drift) * kh, hY = cy + (hy + camY) * kh;
          var tX = cx + (tx + camX + drift) * kt, tY = cy + (ty + camY) * kt;
          var ma = (u < 0.15 ? u / 0.15 : (u > 0.7 ? (1 - u) / 0.3 : 1)) * starA;
          var lg = ctx.createLinearGradient(tX, tY, hX, hY);
          lg.addColorStop(0, "rgba(160,154,202,0)");
          lg.addColorStop(0.55, "rgba(160,154,202," + (ma * 0.55) + ")");
          lg.addColorStop(1, "rgba(242,239,232," + ma + ")");
          ctx.strokeStyle = lg; ctx.lineCap = "round"; ctx.lineWidth = Math.max(1.6, 3.4 * kh * DPR);
          ctx.beginPath(); ctx.moveTo(tX, tY); ctx.lineTo(hX, hY); ctx.stroke();
          var hr = 16 * DPR * kh + 4, hg = ctx.createRadialGradient(hX, hY, 0, hX, hY, hr);
          hg.addColorStop(0, "rgba(242,239,232," + ma + ")");
          hg.addColorStop(0.3, "rgba(245,162,93," + (ma * 0.5) + ")");
          hg.addColorStop(1, "rgba(160,154,202,0)");
          ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(hX, hY, hr, 0, 6.283); ctx.fill();
        }
      }
      for (var j = 0; j < sparks.length; j++) {
        var q = sparks[j], qz = q.z - camZ;
        if (qz < NEAR) { q.z += FAR - NEAR; qz = q.z - camZ; }
        var kk = f / qz, qx = cx + (q.x + camX + drift) * kk, qy = cy + (q.y + camY) * kk;
        if (qx < -40 || qx > W + 40 || qy < -40 || qy > H + 40) continue;
        var qa = Math.min(1, 1.2 - qz / FAR) * (reduce ? 1 : (0.55 + 0.45 * Math.sin(t * 0.9 + q.ph))) * starA;
        fourPoint(qx, qy, q.r * kk * DPR, q.rot + (reduce ? 0 : t * 0.08), qa);
      }
      if (running) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible" && !running && !reduce) requestAnimationFrame(frame);
    });
  }

  // ---- Which hour is it -----------------------------------------------------

  var beats = Array.prototype.slice.call(document.querySelectorAll(".beat"));
  var clockEl = document.getElementById("clock");
  var dawn = document.getElementById("skyDawn");
  var dawnGlow = document.getElementById("skyDawnGlow");
  var nightlight = document.getElementById("nightlight");
  var scenes = {
    night: { dawn: 0, glow: 0, nl: 0.35, mix: 0 },
    deep:  { dawn: 0, glow: 0, nl: 0.95, mix: 0 },
    dawn:  { dawn: 1, glow: 0.9, nl: 0, mix: 1 }
  };
  var currentBeat = null;

  var setScene = function (beat) {
    if (beat === currentBeat) return;
    currentBeat = beat;
    var sc = scenes[beat.getAttribute("data-scene")] || scenes.night;
    if (dawn) dawn.style.opacity = sc.dawn;
    if (dawnGlow) dawnGlow.style.opacity = sc.glow;
    if (nightlight) nightlight.style.opacity = sc.nl;
    sceneMix = sc.mix;
    var time = beat.getAttribute("data-time");
    if (clockEl && time && clockEl.textContent !== time) {
      clockEl.style.opacity = 0;
      setTimeout(function () { clockEl.textContent = time; clockEl.style.opacity = 1; }, 180);
    }
  };

  if (beats.length) {
    if ("IntersectionObserver" in window && !reduce) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { if (entry.isIntersecting) entry.target.classList.add("is-in"); });
      }, { threshold: 0.22 });
      beats.forEach(function (b) { io.observe(b); });
    } else {
      beats.forEach(function (b) { b.classList.add("is-in"); });
    }

    var onScroll = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      scrollP = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      var mid = window.scrollY + window.innerHeight * 0.5, best = beats[0];
      for (var i = 0; i < beats.length; i++) {
        if (beats[i].getBoundingClientRect().top + window.scrollY <= mid) best = beats[i];
      }
      setScene(best);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ---- Props: a few degrees of tilt toward the cursor ----------------------

  if (!reduce && window.matchMedia("(pointer: fine)").matches) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-tilt]"), function (el) {
      var host = el.parentElement;
      host.addEventListener("pointermove", function (e) {
        var r = host.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--tx", (x * 7).toFixed(2));
        el.style.setProperty("--ty", (-y * 6).toFixed(2));
      });
      host.addEventListener("pointerleave", function () {
        el.style.setProperty("--tx", 0); el.style.setProperty("--ty", 0);
      });
    });
  }
})();
