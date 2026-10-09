import type { ReactNode, SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 18): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
});
const make = (d: ReactNode) =>
  function Icon({ size, ...rest }: P) {
    return (
      <svg {...base(size)} {...rest}>
        {d}
      </svg>
    );
  };

export const IconCheck = make(<path d="M5 12.5l4.2 4.2L19 7" />);
export const IconX = make(<path d="M6 6l12 12M18 6L6 18" />);
export const IconLock = make(
  <>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </>,
);
export const IconSearch = make(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </>,
);
export const IconSun = make(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </>,
);
export const IconMoon = make(<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />);
export const IconMenu = make(<path d="M4 7h16M4 12h16M4 17h16" />);
export const IconChevronRight = make(<path d="M9 6l6 6-6 6" />);
export const IconChevronLeft = make(<path d="M15 6l-6 6 6 6" />);
export const IconClock = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>,
);
export const IconAward = make(
  <>
    <circle cx="12" cy="9" r="6" />
    <path d="M8.5 14L7 22l5-3 5 3-1.5-8" />
  </>,
);
export const IconDownload = make(<path d="M12 4v11M7 10l5 5 5-5M5 20h14" />);
export const IconUpload = make(<path d="M12 20V9M7 14l5-5 5 5M5 4h14" />);
export const IconPrint = make(
  <>
    <path d="M7 9V3h10v6" />
    <rect x="4" y="9" width="16" height="8" rx="2" />
    <path d="M7 14h10v7H7z" />
  </>,
);
export const IconRefresh = make(<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />);
export const IconPlay = make(<path d="M7 5l12 7-12 7z" />);
export const IconCode = make(<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />);
export const IconBook = make(
  <>
    <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
    <path d="M4 19V5M8 7h7" />
  </>,
);
export const IconSpark = make(<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />);
export const IconFlame = make(<path d="M12 22c4 0 7-2.7 7-6.5 0-3.6-2.6-5.4-4-8.5-1 2.5-2.5 3.5-3.5 3.5C11.5 7 10 4 9.5 2 7 5 5 8.5 5 15.5 5 19.3 8 22 12 22z" />);
export const IconTarget = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" />
  </>,
);
export const IconList = make(<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />);
export const IconArrowUp = make(<path d="M12 19V5M6 11l6-6 6 6" />);
export const IconTrash = make(<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />);
export const IconShuffle = make(<path d="M4 7h3l10 10h3M4 17h3l3-3M14 10l3-3h3M18 4l2 3-2 3M18 14l2 3-2 3" />);
export const IconExternal = make(<path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5" />);
export const IconUser = make(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </>,
);
export const IconUsers = make(
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
  </>,
);
export const IconLogOut = make(<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11" />);
export const IconLogIn = make(<path d="M15 4h4v16h-4M10 8l4 4-4 4M3 12h11" />);
export const IconShield = make(
  <>
    <path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z" />
    <path d="M8.5 12l2.5 2.5 4.5-5" />
  </>,
);
export const IconCloud = make(<path d="M7 18a5 5 0 1 1 1.1-9.9A6 6 0 0 1 19.6 11 3.5 3.5 0 0 1 18 18z" />);
export const IconCloudCheck = make(
  <>
    <path d="M7 18a5 5 0 1 1 1.1-9.9A6 6 0 0 1 19.6 11 3.5 3.5 0 0 1 18 18z" />
    <path d="M9.5 13.2l2 2 3.5-3.7" />
  </>,
);
export const IconCloudOff = make(<path d="M3 3l18 18M8.1 8.1A5 5 0 0 0 7 18h11M19.6 11A3.5 3.5 0 0 1 21 16.8M10.6 6.3A6 6 0 0 1 19.6 11" />);
export const IconMail = make(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
  </>,
);
export const IconKey = make(
  <>
    <circle cx="8" cy="15" r="4" />
    <path d="M11 12l9-9M17 6l3 3M14.5 8.5l2 2" />
  </>,
);
export const IconEye = make(
  <>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </>,
);
export const IconEyeOff = make(<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7a9.5 9.5 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2" />);
export const IconChart = make(<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />);
export const IconArrowLeft = make(<path d="M19 12H5M11 6l-6 6 6 6" />);
