(() => {
  const filters = document.querySelector('.filters');
  const buttons = [...filters.querySelectorAll('button')];
  const papers = [...document.querySelectorAll('.paper')];
  const status = document.querySelector('#filter-status');

  function showPapers(filter, announce = true) {
    let visible = 0;
    for (const paper of papers) {
      paper.hidden = filter === 'selected' && !paper.classList.contains('hl');
      if (!paper.hidden) visible++;
    }
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
    }
    if (announce) status.textContent = `Showing ${visible} ${filter === 'selected' ? 'selected' : 'total'} publications.`;
  }

  for (const button of buttons) {
    const count = button.dataset.filter === 'selected'
      ? papers.filter(paper => paper.classList.contains('hl')).length
      : papers.length;
    button.querySelector('.count').textContent = count;
    button.addEventListener('click', () => showPapers(button.dataset.filter));
  }

  // Keep direct links to individual papers usable after filtering.
  function revealLinkedPaper() {
    const target = document.getElementById(location.hash.slice(1));
    const paper = target?.closest('.paper');
    if (paper?.hidden) {
      showPapers('all');
      target.scrollIntoView();
    }
  }

  window.addEventListener('hashchange', revealLinkedPaper);
  showPapers('selected', false);
  filters.hidden = false;
  revealLinkedPaper();
})();

// Selected papers play an animation of their figure while the row is hovered or
// keyboard-focused; on touch screens, while the thumbnail is on screen.
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const canHover = matchMedia('(hover: hover)').matches;
  const release = url => { if (url?.startsWith('blob:')) URL.revokeObjectURL(url); };

  for (const thumb of document.querySelectorAll('.thumb[data-anim]')) {
    const paper = thumb.closest('.paper');
    const still = thumb.querySelector('img');
    const anim = new Image(still.width, still.height);
    anim.className = 'anim';
    anim.alt = '';
    thumb.append(anim);

    let gif, url = null, loading = false;
    const reasons = new Set();

    async function play() {
      if (loading || reduceMotion.matches) return;
      loading = true;
      gif ??= fetch(thumb.dataset.anim).then(r => (r.ok ? r.blob() : Promise.reject(r)));
      let src;
      try {
        // A fresh object URL makes the GIF start again from its first frame.
        src = URL.createObjectURL(await gif);
      } catch {
        src = thumb.dataset.anim;
      }
      loading = false;
      if (!reasons.size) return release(src);
      release(url);
      url = anim.src = src;
      await anim.decode().catch(() => {});
      if (url === src && reasons.size) anim.classList.add('playing');
    }

    function stop() {
      anim.classList.remove('playing');
      const src = url;
      // Drop the GIF once it has faded out, unless it started playing again.
      setTimeout(() => {
        if (reasons.size || url !== src) return;
        anim.removeAttribute('src');
        release(src);
        url = null;
      }, 250);
    }

    // Play while any reason holds, so moving between the row's links does not restart it.
    function want(reason, on) {
      const was = reasons.size > 0;
      if (on) reasons.add(reason); else reasons.delete(reason);
      if (!was && reasons.size) play();
      else if (was && !reasons.size) stop();
    }

    paper.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') want('hover', true); });
    paper.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') want('hover', false); });
    paper.addEventListener('focusin', e => want('focus', e.target.matches(':focus-visible')));
    paper.addEventListener('focusout', e => { if (!paper.contains(e.relatedTarget)) want('focus', false); });
    if (!canHover && 'IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => want('visible', entry.intersectionRatio >= 0.6), { threshold: [0, 0.6] }).observe(thumb);
    }
  }
})();
