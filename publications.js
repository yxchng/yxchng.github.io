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
  filters.hidden = false;
  revealLinkedPaper();
})();
