// src/utils/textUtils.ts
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };
  
  export const stripHtmlTags = (html: string): string => {
    return html.replace(/<[^>]*>/g, '');
  };
  
  export const extractFirstParagraph = (text: string): string => {
    const paragraphs = text.split('\n\n');
    return paragraphs[0] || text.substring(0, 200);
  };
  
  export const highlightSearchTerm = (text: string, searchTerm: string): string => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };
  
  export const generateExcerpt = (content: string, length: number = 150): string => {
    const cleanText = stripHtmlTags(content);
    return truncateText(cleanText, length);
  };
  
  export const wordCount = (text: string): number => {
    return text.trim().split(/\s+/).length;
  };
  
  export const readingTime = (text: string, wordsPerMinute: number = 200): number => {
    const words = wordCount(text);
    return Math.ceil(words / wordsPerMinute);
  };
  