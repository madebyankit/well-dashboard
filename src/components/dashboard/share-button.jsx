'use client';

/**
 * Copies the current URL — filters and all — to the clipboard.
 *
 * Because every filter lives in the query string (src/hooks/use-filters.js),
 * the copied link reproduces the exact view the sender is looking at.
 */
import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFilters } from '@/hooks/use-filters';

export function ShareButton({ size = 'default', variant = 'outline' }) {
  const { shareUrl } = useFilters();
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API needs a secure context; fall back to a prompt so the
      // link is still obtainable over plain http (e.g. a LAN demo).
      window.prompt('Copy this link', url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant={variant} size={size} onClick={copy} title="Copy a link to this exact view">
      {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      <span className="hidden sm:inline">{copied ? 'Link copied' : 'Share view'}</span>
    </Button>
  );
}
