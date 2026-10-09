/**
 * Vitest setup file — runs before each test suite.
 * Configures jsdom environment globals needed by React and Leaflet.
 */

// Silence Leaflet's missing SVG icon warning in test environment
if (typeof window !== 'undefined') {
  // Leaflet looks for these on the window object
  (window as unknown as Record<string, unknown>).ResizeObserver =
    (window as unknown as Record<string, unknown>).ResizeObserver ??
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
}
