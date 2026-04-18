import { useEffect } from 'react';

export function useProjectPaginationSync({ categoryFilter, statusFilter, searchQuery, showSelectedOnly, currentPage, totalPages, setCurrentPage }) {
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages, setCurrentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, statusFilter, searchQuery, showSelectedOnly, setCurrentPage]);
}
