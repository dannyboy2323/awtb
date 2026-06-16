/**
 * Public route group layout.
 * No header or footer — pages in this group are full-viewport experiences.
 * The landing page hero and story reader manage their own chrome.
 */

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
