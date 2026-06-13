export function printElement(element: HTMLElement): void {
  element.classList.add('invoice-printing');
  const cleanup = () => element.classList.remove('invoice-printing');
  window.addEventListener('afterprint', cleanup, { once: true });
  window.print();
  setTimeout(cleanup, 1000);
}
