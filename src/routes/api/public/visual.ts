import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const querySchema = z.object({ source: z.string().min(1).max(4096) });
const allowedHost = 'kpplssyiehosifuejobr.supabase.co';
const allowedPath = '/storage/v1/object/public/';

function decodeSource(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export const Route = createFileRoute('/api/public/visual')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const parsed = querySchema.safeParse(
          Object.fromEntries(new URL(request.url).searchParams.entries()),
        );
        if (!parsed.success) return new Response('Invalid request', { status: 400 });

        let source: URL;
        try {
          source = new URL(decodeSource(parsed.data.source));
        } catch {
          return new Response('Invalid source', { status: 400 });
        }
        if (source.protocol !== 'https:' || source.hostname !== allowedHost || !source.pathname.includes(allowedPath)) {
          return new Response('Source not allowed', { status: 403 });
        }

        const upstream = await fetch(source.toString());
        if (!upstream.ok || !upstream.body) return new Response('Not found', { status: 404 });
        return new Response(upstream.body, {
          headers: {
            'content-type': upstream.headers.get('content-type') ?? 'application/octet-stream',
            'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
            'x-content-type-options': 'nosniff',
          },
        });
      },
    },
  },
});