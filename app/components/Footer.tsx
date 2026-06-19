export default function Footer() {
  return (
    <footer className="relative bg-gray-50">
      <div className="absolute inset-0 bg-[url(/images/tile-grid-black.png)] bg-size-[17px] bg-position-[0_1] opacity-20" />
      <div className="relative container">
        <div className="flex flex-col items-center py-28 lg:flex-row">
          <h3 className="mb-10 text-center font-mono text-4xl leading-tight tracking-tighter lg:mb-0 lg:w-1/2 lg:pr-4 lg:text-left lg:text-2xl">
            Built with Sanity + Next.js.
          </h3>
          <div className="flex flex-col items-center justify-center gap-3 lg:w-1/2 lg:flex-row lg:pl-4">
            <a
              href="https://github.com/sanity-io/sanity-template-nextjs-clean"
              className="hover:bg-blue focus:bg-blue flex items-center gap-2 rounded-full bg-black px-6 py-3 font-mono whitespace-nowrap text-white transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
            <a href="https://nextjs.org/docs" className="mx-3 font-mono hover:underline">
              Read Next.js Documentation
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
