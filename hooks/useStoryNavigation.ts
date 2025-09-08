import { useState, useCallback } from 'react';

export const useStoryNavigation = (totalPages: number) => {
  const [currentPage, setCurrentPage] = useState(-1); // -1 for title page

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => (prev < totalPages - 1 ? prev + 1 : prev));
  }, [totalPages]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage(prev => (prev > -1 ? prev - 1 : prev));
  }, []);

  return { currentPage, setCurrentPage, goToNextPage, goToPrevPage };
};
