import { useCallback, useEffect, useRef } from "react";

interface KeyboardNavigationOptions {
  onSelect?: (index: number) => void;
  onDelete?: () => void;
  onFavorite?: () => void;
  onEscape?: () => void;
  onEnter?: () => void;
  onSelectAll?: () => void;
  onSelectMultiple?: () => void;
  itemCount: number;
  isSelectMode?: boolean;
  selectedItems?: Set<string>;
  onToggleSelection?: (id: string) => void;
}

export function useKeyboardNavigation({
  onSelect,
  onDelete,
  onFavorite,
  onEscape,
  onEnter,
  onSelectAll,
  onSelectMultiple,
  itemCount,
  isSelectMode = false,
  selectedItems = new Set(),
  onToggleSelection,
}: KeyboardNavigationOptions) {
  const currentIndex = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Prevent default behavior for navigation keys
      const preventDefault = () => {
        event.preventDefault();
        event.stopPropagation();
      };

      switch (event.key) {
        case "ArrowDown":
          preventDefault();
          currentIndex.current = Math.min(
            currentIndex.current + 1,
            itemCount - 1,
          );
          onSelect?.(currentIndex.current);
          break;

        case "ArrowUp":
          preventDefault();
          currentIndex.current = Math.max(currentIndex.current - 1, 0);
          onSelect?.(currentIndex.current);
          break;

        case "ArrowRight": {
          preventDefault();
          // Move to next item in grid (assuming 4 columns)
          const nextIndex = Math.min(currentIndex.current + 4, itemCount - 1);
          currentIndex.current = nextIndex;
          onSelect?.(currentIndex.current);
          break;
        }

        case "ArrowLeft": {
          preventDefault();
          // Move to previous item in grid (assuming 4 columns)
          const prevIndex = Math.max(currentIndex.current - 4, 0);
          currentIndex.current = prevIndex;
          onSelect?.(currentIndex.current);
          break;
        }

        case "Enter":
          preventDefault();
          onEnter?.();
          break;

        case "Escape":
          preventDefault();
          onEscape?.();
          break;

        case "Delete":
        case "Backspace":
          if (isSelectMode && selectedItems.size > 0) {
            preventDefault();
            onDelete?.();
          }
          break;

        case "f":
        case "F":
          if (!event.ctrlKey && !event.metaKey) {
            preventDefault();
            onFavorite?.();
          }
          break;

        case "a":
        case "A":
          if (event.ctrlKey || event.metaKey) {
            preventDefault();
            onSelectAll?.();
          }
          break;

        case "m":
        case "M":
          if (event.ctrlKey || event.metaKey) {
            preventDefault();
            onSelectMultiple?.();
          }
          break;

        case " ":
          // Space bar for selection in select mode
          if (isSelectMode && onToggleSelection) {
            preventDefault();
            // This would need the current item ID to toggle selection
            // You might need to pass this as a parameter or get it from context
          }
          break;
      }
    },
    [
      itemCount,
      onSelect,
      onDelete,
      onFavorite,
      onEscape,
      onEnter,
      onSelectAll,
      onSelectMultiple,
      isSelectMode,
      selectedItems.size,
      onToggleSelection,
    ],
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    element.addEventListener("keydown", handleKeyDown);
    return () => {
      element.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const focusItem = useCallback((index: number) => {
    currentIndex.current = index;
    const element = containerRef.current;
    if (element) {
      const focusableElement = element.querySelector(
        `[data-index="${index}"]`,
      ) as HTMLElement;
      if (focusableElement) {
        focusableElement.focus();
      }
    }
  }, []);

  const resetFocus = useCallback(() => {
    currentIndex.current = 0;
    const element = containerRef.current;
    if (element) {
      element.focus();
    }
  }, []);

  return {
    containerRef,
    focusItem,
    resetFocus,
    currentIndex: currentIndex.current,
  };
}
