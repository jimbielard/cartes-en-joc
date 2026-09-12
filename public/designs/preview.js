const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
document.querySelectorAll('.search').forEach(form => form.addEventListener('submit', event => {
  event.preventDefault();
  const query = normalize(form.querySelector('input').value.trim());
  let count = 0;
  document.querySelectorAll('[data-restaurant]').forEach(item => { item.hidden = !normalize(item.textContent).includes(query); if (!item.hidden) count++; });
  const empty = document.getElementById('empty');
  if (empty) empty.hidden = count !== 0;
  document.getElementById('restaurants').scrollIntoView({ behavior: 'smooth', block: 'start' });
}));
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  let count = 0;
  document.querySelectorAll('[data-restaurant]').forEach(item => { item.hidden = button.dataset.filter !== 'all' && !normalize(item.textContent).includes(button.dataset.filter); if (!item.hidden) count++; });
  document.getElementById('empty').hidden = count !== 0;
}));
document.querySelectorAll('[data-select]').forEach(button => button.addEventListener('click', () => {
  document.getElementById('choice-message').textContent = `Has escollit ${button.dataset.select}. Digues-me aquest nom al xat i aplicaré el disseny a l’app.`;
}));
