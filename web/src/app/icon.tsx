import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

/** Фавікон: монограма на крафтовому тлі, у тон палітри сайту. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0E7A4B',
          color: '#F2E8D8',
          fontSize: 38,
          fontWeight: 700,
          letterSpacing: -1,
          borderRadius: 12,
        }}
      >
        SP
      </div>
    ),
    size,
  );
}
