import './globals.css';
import { Providers } from '@/components/shell/providers';
import { AppShell } from '@/components/shell/app-shell';

export const metadata = {
  title: 'Well Production Monitoring Dashboard',
  description: 'Production trends, target attainment and well performance for an oil & gas field.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  // Tokens are HSL variables, so both schemes are supported natively.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1117' },
  ],
};

/**
 * Applied before first paint so a user who chose dark mode never sees a white
 * flash. It mirrors what AppearanceProvider does, just early enough to matter.
 */
const themeBootstrap = `
(function () {
  try {
    var saved = JSON.parse(localStorage.getItem('wpm.appearance') || '{}');
    var theme = saved.theme || 'system';
    if (theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    var root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.font = saved.font || 'sans';
    root.dataset.scale = saved.scale || 'md';
    root.style.colorScheme = theme === 'light' ? 'light' : 'dark';
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" data-font="sans" data-scale="md" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
