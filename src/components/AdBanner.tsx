import React, { useEffect } from 'react';

interface AdBannerProps {
  slotId?: string;
  format?: 'horizontal' | 'vertical' | 'square';
  className?: string;
}

/**
 * AdBanner Component
 * 
 * Displays Google AdSense ads. To enable:
 * 1. Sign up at https://www.google.com/adsense
 * 2. Get your Publisher ID (ca-pub-xxxxxxxxxx)
 * 3. Create ad slots in AdSense dashboard
 * 4. Add Publisher ID to index.html <head>
 * 5. Pass slotId prop to this component
 * 
 * For now, this component displays a placeholder.
 */
export default function AdBanner({ 
  slotId = '0000000000', 
  format = 'horizontal',
  className = ''
}: AdBannerProps) {
  useEffect(() => {
    // When AdSense is properly configured, this will load ads
    if ((window as any).adsbygoogle && slotId !== '0000000000') {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, [slotId]);

  // Determine dimensions based on format
  const getDimensions = () => {
    switch (format) {
      case 'vertical':
        return 'w-full max-w-xs h-96';
      case 'square':
        return 'w-72 h-72';
      case 'horizontal':
      default:
        return 'w-full h-24';
    }
  };

  // Show placeholder if no publisher ID is set (dev environment)
  if (slotId === '0000000000') {
    return (
      <div className={`${getDimensions()} ${className} bg-white/5 border border-white/10 rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-white/50 text-xs font-mono">
            AdSense Placeholder
          </div>
          <div className="text-white/40 text-[10px] mt-1">
            Configure in Settings
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} flex justify-center`}>
      <ins
        className={`adsbygoogle ${getDimensions()}`}
        style={{ display: 'block' }}
        data-ad-client="ca-pub-xxxxxxxxxx"
        data-ad-slot={slotId}
        data-ad-format={format === 'horizontal' ? 'auto' : 'auto'}
        data-full-width-responsive="true"
      />
    </div>
  );
}
