const PLATFORMS = [
  { name: "GitHub",      url: "https://github.com/" },
  { name: "GitLab",      url: "https://gitlab.com/" },
  { name: "Reddit",      url: "https://reddit.com/user/" },
  { name: "Twitter/X",   url: "https://twitter.com/" },
  { name: "Instagram",   url: "https://instagram.com/" },
  { name: "TikTok",      url: "https://tiktok.com/@" },
  { name: "YouTube",     url: "https://youtube.com/@" },
  { name: "Twitch",      url: "https://twitch.tv/" },
  { name: "LinkedIn",    url: "https://linkedin.com/in/" },
  { name: "Pinterest",   url: "https://pinterest.com/" },
  { name: "Steam",       url: "https://steamcommunity.com/id/" },
  { name: "Spotify",     url: "https://open.spotify.com/user/" },
  { name: "Medium",      url: "https://medium.com/@" },
  { name: "Dev.to",      url: "https://dev.to/" },
  { name: "HackerNews",  url: "https://news.ycombinator.com/user?id=" },
  { name: "Keybase",     url: "https://keybase.io/" },
  { name: "Mastodon",    url: "https://mastodon.social/@" },
  { name: "SoundCloud",  url: "https://soundcloud.com/" },
  { name: "Behance",     url: "https://behance.net/" },
  { name: "Dribbble",    url: "https://dribbble.com/" },
  { name: "Flickr",      url: "https://flickr.com/people/" },
  { name: "Vimeo",       url: "https://vimeo.com/" },
  { name: "Patreon",     url: "https://patreon.com/" },
  { name: "HackTheBox",  url: "https://app.hackthebox.com/users/" },
  { name: "TryHackMe",   url: "https://tryhackme.com/p/" },
];

// CORS proxy — see worker.js for the deployed Cloudflare Worker source.
const PROXY_BASE = 'https://usertrace-proxy.morning-boat-f3d0.workers.dev';

function tick() {
  const el = document.getElementById('clock');
  if (el) el.textContent = new Date().toTimeString().slice(0, 8);
}
tick();
setInterval(tick, 1000);

async function checkPlatform(url) {
  try {
    const r = await fetch(`${PROXY_BASE}/?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (r.status === 200 || r.status === 301 || r.status === 302) return true;
    if (r.status === 404 || r.status === 410) return false;
    return null; // proxy error, timeout, or other ambiguous response
  } catch {
    return null;
  }
}

async function runScan() {
  const username = document.getElementById('usrInp').value.trim();
  if (!username) { document.getElementById('usrInp').focus(); return; }

  const btn = document.getElementById('runBtn');
  btn.disabled = true;
  document.getElementById('summary').className = 'summary';
  document.getElementById('platformTable').innerHTML = '';

  const pw      = document.getElementById('progressWrap');
  const pLabel  = document.getElementById('progressLabel');
  const pPct    = document.getElementById('progressPct');
  const pFill   = document.getElementById('progressFill');
  pw.className  = 'progress-wrap show';
  pFill.style.width = '0%';

  const table   = document.getElementById('platformTable');
  const results = new Array(PLATFORMS.length);

  const CONCURRENCY = 6;
  let nextIndex = 0;
  let completed = 0;

  async function worker() {
    while (nextIndex < PLATFORMS.length) {
      const i = nextIndex++;
      const p = PLATFORMS[i];
      const fullUrl = p.url + username;
      const found   = await checkPlatform(fullUrl);
      results[i]    = { ...p, found, url: fullUrl };

      completed++;
      const pct = Math.round((completed / PLATFORMS.length) * 100);
      pLabel.textContent = `checked ${completed}/${PLATFORMS.length} platforms...`;
      pPct.textContent   = pct + '%';
      pFill.style.width  = pct + '%';
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  for (const r of results) {
    const tr = document.createElement('tr');
    if (r.found === true) {
      tr.innerHTML = `<td class="pt-status found">+</td><td class="pt-name found">${r.name}</td><td class="pt-link"><a href="${r.url}" target="_blank" rel="noopener">${r.url}</a></td>`;
    } else if (r.found === false) {
      tr.innerHTML = `<td class="pt-status none">—</td><td class="pt-name">${r.name}</td><td class="pt-link none">not found</td>`;
    } else {
      tr.innerHTML = `<td class="pt-status unknown">?</td><td class="pt-name">${r.name}</td><td class="pt-link none" style="color:#333">unreachable</td>`;
    }
    table.appendChild(tr);
  }

  pw.className = 'progress-wrap';

  const foundList = results.filter(r => r.found === true);
  const notFound  = results.filter(r => r.found === false);
  const exposure  = Math.min(100, Math.round((foundList.length / PLATFORMS.length) * 100 * 2.2));

  document.getElementById('summaryName').textContent  = username;
  document.getElementById('summaryTime').textContent  = new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC';
  document.getElementById('mFound').textContent       = foundList.length;
  document.getElementById('mNot').textContent         = notFound.length;
  document.getElementById('mExposure').textContent    = exposure + '%';
  document.getElementById('summary').className        = 'summary show';

  btn.disabled = false;
}

document.getElementById('runBtn').addEventListener('click', runScan);
document.getElementById('usrInp').addEventListener('keydown', e => {
  if (e.key === 'Enter') runScan();
});
