import { renderRss } from '@/views/rss';

export const dynamic = 'force-static';

export function GET() {
  return renderRss('ru');
}
