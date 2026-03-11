import { ImageResponse } from 'next/og';

export const size = { width: 48, height: 48 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(74,222,128,0.15) 0%, rgba(34,211,238,0.15) 100%)',
          border: '2px solid #4ade80',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            background: 'linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1,
          }}
        >
          B
        </div>
      </div>
    ),
    { ...size }
  );
}
