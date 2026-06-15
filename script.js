const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('active');
  });
}, { threshold: 0.12 });
reveals.forEach(el => observer.observe(el));

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  document.querySelectorAll('.parallax-img').forEach(img => {
    img.style.transform = `translateY(${Math.min(y * 0.025, 24)}px)`;
  });
});
