'use client';

/**
 * Липка панель контактів: праворуч на десктопі, знизу на мобільному.
 * Аудиторія — B2B, значна частина замовлень починається з дзвінка або
 * повідомлення в месенджер, а не з кошика.
 */
export function FloatingContacts({
  phone,
  telegram,
  viber,
}: {
  phone: string;
  telegram: string;
  viber: string;
}) {
  const items = [
    {
      href: `tel:${phone}`,
      label: 'Телефон',
      icon: <path d="M6.6 3h3l1.5 4-2 1.4a12 12 0 0 0 5.5 5.5l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5.2 2 2 0 0 1 6.6 3z" />,
    },
    {
      href: telegram,
      label: 'Telegram',
      icon: <path d="M21 4L3 11l5 2 2 6 3-4 5 4z" />,
    },
    {
      href: viber,
      label: 'Viber',
      icon: <path d="M12 3a8 8 0 0 0-8 8 8 8 0 0 0 1.4 4.5L4 21l5.6-1.4A8 8 0 1 0 12 3z" />,
    },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface md:inset-x-auto md:bottom-1/3 md:right-3 md:border-0 md:bg-transparent">
      <div className="flex justify-around gap-1 p-2 md:flex-col md:gap-2 md:p-0">
        {items.map((i) => (
          <a
            key={i.label}
            href={i.href}
            aria-label={i.label}
            className="flex h-11 w-full items-center justify-center rounded-md border border-border bg-surface text-primary transition hover:border-primary md:h-11 md:w-11 md:shadow-sm"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {i.icon}
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
