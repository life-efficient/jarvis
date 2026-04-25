import { useEffect } from "react"

function getPrimaryColor(): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--primary")
    .trim()
  // CSS var is "H S% L%", convert to hsl()
  return `hsl(${raw})`
}

function buildFaviconSvg(color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
  <path d="M20 3v4"/><path d="M22 5h-4"/>
  <path d="M4 17v2"/><path d="M5 18H3"/>
</svg>`
}

function applyFavicon(color: string) {
  const svg = buildFaviconSvg(color)
  const url = `data:image/svg+xml,${encodeURIComponent(svg)}`
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
  if (!link) {
    link = document.createElement("link")
    link.rel = "icon"
    document.head.appendChild(link)
  }
  link.href = url
}

export function useDynamicFavicon() {
  useEffect(() => {
    applyFavicon(getPrimaryColor())

    // Re-apply when the dark class toggles on <html>
    const observer = new MutationObserver(() => {
      applyFavicon(getPrimaryColor())
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    })
    return () => observer.disconnect()
  }, [])
}
