/* ============================================================
   Shared showcase home — renderer
   Reads window.SITE (config/site.js) and window.PROJECTS
   (config/projects.js) and builds the page. Adding a project
   requires only a new entry in config/projects.js — never a
   change to this file.
   ============================================================ */
(function () {
  var SITE = window.SITE || {};
  var PROJECTS = window.PROJECTS || [];

  /* ---- Document head: title, description, favicon, accent ---- */
  if (SITE.name) document.title = SITE.name;
  if (SITE.tagline) {
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', SITE.tagline);
  }
  if (SITE.emoji) {
    var icon = document.querySelector('link[rel="icon"]');
    if (icon) {
      icon.setAttribute('href',
        "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
        "<text y='.9em' font-size='90'>" + SITE.emoji + "</text></svg>");
    }
  }
  if (SITE.accent) document.documentElement.style.setProperty('--accent', SITE.accent);

  /* ---- Header ---- */
  var head = document.getElementById('siteHead');
  if (head) {
    if (SITE.emoji) {
      var logo = document.createElement('div');
      logo.className = 'logo';
      logo.textContent = SITE.emoji;
      head.appendChild(logo);
    }
    var h1 = document.createElement('h1');
    h1.textContent = SITE.name || 'Showcase';
    head.appendChild(h1);

    if (SITE.tagline) {
      var p = document.createElement('p');
      p.textContent = SITE.tagline;
      head.appendChild(p);
    }
    var count = document.createElement('span');
    count.className = 'count';
    count.textContent = PROJECTS.length + (PROJECTS.length === 1 ? ' project' : ' projects');
    head.appendChild(count);
  }

  /* ---- Card grid ---- */
  var grid = document.getElementById('grid');
  if (grid) {
    if (!PROJECTS.length) {
      var empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'No projects configured yet. Add one in config/projects.js.';
      grid.appendChild(empty);
    }
    PROJECTS.forEach(function (proj) {
      var card = document.createElement('a');
      card.className = 'card';
      // Trailing slash → Vercel serves <slug>/index.html natively (deep links + refresh work).
      card.setAttribute('href', proj.slug + '/');

      var top = document.createElement('div');
      top.className = 'card-top';

      var title = document.createElement('h2');
      title.textContent = proj.title || proj.slug;
      top.appendChild(title);

      var arrow = document.createElement('span');
      arrow.className = 'arrow';
      arrow.innerHTML = "<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><line x1='7' y1='17' x2='17' y2='7'/><polyline points='7 7 17 7 17 17'/></svg>";
      top.appendChild(arrow);
      card.appendChild(top);

      if (proj.tagline) {
        var desc = document.createElement('p');
        desc.textContent = proj.tagline;
        card.appendChild(desc);
      }

      if (proj.tags && proj.tags.length) {
        var chips = document.createElement('div');
        chips.className = 'chips';
        proj.tags.forEach(function (t) {
          var chip = document.createElement('span');
          chip.className = 'chip';
          chip.textContent = t;
          chips.appendChild(chip);
        });
        card.appendChild(chips);
      }

      grid.appendChild(card);
    });
  }

  /* ---- Footer ---- */
  var foot = document.getElementById('siteFoot');
  if (foot && SITE.footer) foot.textContent = SITE.footer;
})();
