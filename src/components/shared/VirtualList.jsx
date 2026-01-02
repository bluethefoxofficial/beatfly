import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Lightweight virtualization to avoid rendering large lists at once.
 * Assumes a reasonably consistent itemHeight to keep calculations simple.
 */
const VirtualList = ({
  items = [],
  itemHeight = 72,
  height = 480,
  overscan = 6,
  renderItem,
  className = '',
  innerClassName = '',
}) => {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const rafRef = useRef(null);

  const onScroll = useCallback(() => {
    if (!containerRef.current) return;
    const nextTop = containerRef.current.scrollTop;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => setScrollTop(nextTop));
  }, []);

  useEffect(() => () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  }, []);

  const { startIndex, endIndex, offset } = useMemo(() => {
    const visibleCount = Math.ceil(height / itemHeight);
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);
    return {
      startIndex: start,
      endIndex: end,
      offset: start * itemHeight,
    };
  }, [height, itemHeight, items.length, overscan, scrollTop]);

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [endIndex, items, startIndex]
  );

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      style={{ height }}
      className={`relative overflow-y-auto ${className}`}
      role="list"
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div
          className={innerClassName}
          style={{
            transform: `translateY(${offset}px)`,
            willChange: 'transform',
          }}
        >
          {visibleItems.map((item, index) => renderItem(item, startIndex + index))}
        </div>
      </div>
    </div>
  );
};

export default VirtualList;
