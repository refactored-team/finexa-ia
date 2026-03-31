import { useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

/**
 * Desactiva el scroll del ScrollView cuando el contenido cabe en la vista (sin rebote vacío).
 */
export function useScrollOnlyIfOverflow() {
  const [viewportH, setViewportH] = useState(0);
  const [contentH, setContentH] = useState(0);

  const onScrollViewLayout = useCallback((e: LayoutChangeEvent) => {
    setViewportH(e.nativeEvent.layout.height);
  }, []);

  const onContentSizeChange = useCallback((_w: number, h: number) => {
    setContentH(h);
  }, []);

  const scrollEnabled = viewportH === 0 || contentH > viewportH + 6;

  return { scrollEnabled, onScrollViewLayout, onContentSizeChange };
}
