import Image from 'next/image';

/** Обмеження на кількість — сторінка категорії лишається компактною, навіть коли фото десятки. */
const MAX_SHOWN = 24;

export function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  if (photos.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-xl">{title}</h2>
      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
        {photos.slice(0, MAX_SHOWN).map((src) => (
          <div key={src} className="aspect-square overflow-hidden rounded-md border border-border bg-surface">
            <Image
              src={src}
              alt=""
              width={200}
              height={200}
              className="h-full w-full object-contain p-1.5"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
