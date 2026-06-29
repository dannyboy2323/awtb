/**
 * DeskHero — above-the-fold landing page hero.
 *
 * Renders the photorealistic desk background using art-directed
 * Blob-hosted images selected via CSS media queries, with the
 * featured story's postcard centered on top.
 *
 * Background images are served from Vercel Blob (edge CDN).
 * The correct image per device is selected via CSS — the browser
 * only downloads the matching variant, never all 37.
 */

import Link from 'next/link'
import Image from 'next/image'
import deskUrls from '@/public/desk-image-urls.json'

interface DeskHeroProps {
  /** The featured story's postcard image URL (from Sanity CDN) */
  postcardUrl: string
  /** Alt text for the postcard */
  postcardAlt: string
  /** The slug of the featured story — used for the link */
  storySlug: string
  /** The story title — used for accessibility */
  storyTitle: string
}

/**
 * Builds the CSS custom property block that assigns the correct
 * Blob URL to --desk-bg across all 37 breakpoints, matching the
 * original static prototype's media query logic exactly.
 */
function buildBackgroundCSS(): string {
  const b = deskUrls as Record<string, string>
  return `
    .desk-hero { --desk-bg: url('${b['landing-pt-720x1280']}'); }

    @media (max-width: 320px) and (orientation: portrait) {
      .desk-hero { --desk-bg: url('${b['landing-pt-720x1280']}'); }
    }
    @media (max-width: 360px) and (orientation: portrait) {
      .desk-hero { --desk-bg: url('${b['landing-pt-768x1366']}'); }
    }
    @media (max-width: 414px) and (orientation: portrait) {
      .desk-hero { --desk-bg: url('${b['landing-pt-800x1280']}'); }
    }
    @media (max-width: 480px) and (orientation: portrait) {
      .desk-hero { --desk-bg: url('${b['landing-pt-1080x1920']}'); }
    }
    @media (max-width: 540px) and (orientation: portrait) {
      .desk-hero { --desk-bg: url('${b['landing-pt-1080x2340']}'); }
    }
    @media (max-width: 600px) and (orientation: portrait) {
      .desk-hero { --desk-bg: url('${b['landing-pt-1200x1920']}'); }
    }
    @media (max-width: 720px) and (orientation: portrait) {
      .desk-hero { --desk-bg: url('${b['landing-pt-1409x2752']}'); }
    }
    @media (max-width: 768px) and (orientation: portrait) {
      .desk-hero { --desk-bg: url('${b['landing-pt-1440x2560']}'); }
    }
    @media (max-width: 800px) and (orientation: portrait) {
      .desk-hero { --desk-bg: url('${b['landing-pt-1440x3440']}'); }
    }
    @media (max-width: 828px) and (orientation: portrait) {
      .desk-hero { --desk-bg: url('${b['landing-pt-1600x2560']}'); }
    }
    @media (max-width: 1080px) and (orientation: portrait) {
      .desk-hero { --desk-bg: url('${b['landing-pt-1668x2388']}'); }
    }
    @media (max-width: 1440px) and (orientation: portrait) {
      .desk-hero { --desk-bg: url('${b['landing-pt-1992x3891']}'); }
    }
    @media (max-width: 2048px) and (orientation: portrait) {
      .desk-hero { --desk-bg: url('${b['landing-pt-2048x2732']}'); }
    }
    @media (max-width: 2160px) and (orientation: portrait) {
      .desk-hero { --desk-bg: url('${b['landing-pt-2160x3840']}'); }
    }
    @media (max-width: 3440px) and (orientation: portrait) {
      .desk-hero { --desk-bg: url('${b['landing-pt-3450x6739']}'); }
    }
    @media (max-width: 4320px) and (orientation: portrait) {
      .desk-hero { --desk-bg: url('${b['landing-pt-4320x7680']}'); }
    }

    @media (max-width: 360px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-640x360']}'); }
    }
    @media (max-width: 414px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-854x480']}'); }
    }
    @media (max-width: 768px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-1280x720']}'); }
    }
    @media (max-width: 800px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-1280x720']}'); }
    }
    @media (max-width: 828px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-1334x750']}'); }
    }
    @media (max-width: 1024px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-1366x768']}'); }
    }
    @media (max-width: 1080px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-1440x900']}'); }
    }
    @media (max-width: 1200px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-1600x900']}'); }
    }
    @media (max-width: 1440px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-1920x1080']}'); }
    }
    @media (max-width: 1536px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-1920x1080']}'); }
    }
    @media (max-width: 1620px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-2048x1536']}'); }
    }
    @media (max-width: 1668px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-2160x1620']}'); }
    }
    @media (max-width: 1680px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-2224x1668']}'); }
    }
    @media (max-width: 1920px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-2340x1080']}'); }
    }
    @media (max-width: 2048px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-2388x1668']}'); }
    }
    @media (max-width: 2520px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-2520x1080']}'); }
    }
    @media (max-width: 2560px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-2560x1440']}'); }
    }
    @media (max-width: 2732px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-2560x1440']}'); }
    }
    @media (max-width: 2880px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-2732x2048']}'); }
    }
    @media (max-width: 3440px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-3440x1440']}'); }
    }
    @media (max-width: 3840px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-3840x2160']}'); }
    }
    @media (max-width: 4032px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-4032x1685']}'); }
    }
    @media (max-width: 5120px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-5120x1440']}'); }
    }
    @media (max-width: 7680px) and (orientation: landscape) {
      .desk-hero { --desk-bg: url('${b['landing-ls-7680x4320']}'); }
    }

    .desk-hero {
      background-image: var(--desk-bg);
    }
  `
}

export default function DeskHero({
  postcardUrl,
  postcardAlt,
  storySlug,
  storyTitle,
}: DeskHeroProps) {
  return (
    <>
      {/* Inject scoped background CSS — only affects .desk-hero, never <body> */}
      <style>{buildBackgroundCSS()}</style>

      <section
        className="desk-hero flex items-center justify-center"
        aria-label={`Featured story: ${storyTitle}`}
      >
        {/* Featured postcard — centered, links to the story */}
        <Link
          href={`/stories/${storySlug}`}
          className="postcard-container block"
          aria-label={`Read "${storyTitle}"`}
        >
          <div className="postcard-wrapper">
            <Image
              src={postcardUrl}
              alt={postcardAlt}
              width={1200}
              height={2133}
              className="postcard-image"
              priority
              style={{ width: '100%', height: 'auto' }}
              sizes="(max-width: 480px) 88vw, (max-width: 768px) 80vw, (max-width: 1024px) 75vw, (max-width: 1400px) 70vw, 65vw"
            />
          </div>
        </Link>
      </section>
    </>
  )
}
