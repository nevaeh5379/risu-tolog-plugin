
export const getNameFromNode = (node: Element, defaultName: string): string => {
  // This is an assumption based on the original code's context.
  // You might need to adjust the selector to fit your actual HTML structure.
  const nameElement = node.querySelector('strong'); // Or the correct selector
  if (nameElement && nameElement.textContent) {
    return nameElement.textContent.trim();
  }
  
  // Fallback logic from original function if name is not found
  const isUser = node.classList.contains('justify-end');
  return isUser ? defaultName : 'Character'; // A sensible default
};
