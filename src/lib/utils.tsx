import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ReactNode } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MC_COLORS: Record<string, string> = {
  "0": "#000000",
  "1": "#0000AA",
  "2": "#00AA00",
  "3": "#00AAAA",
  "4": "#AA0000",
  "5": "#AA00AA",
  "6": "#FFAA00",
  "7": "#AAAAAA",
  "8": "#555555",
  "9": "#5555FF",
  a: "#55FF55",
  b: "#55FFFF",
  c: "#FF5555",
  d: "#FF55FF",
  e: "#FFFF55",
  f: "#FFFFFF",
}

function getMcStyle(code: string): React.CSSProperties {
  const style: React.CSSProperties = {}
  switch (code) {
    case "l":
      style.fontWeight = 700
      break
    case "m":
      style.textDecoration = "line-through"
      break
    case "n":
      style.textDecoration = "underline"
      break
    case "o":
      style.fontStyle = "italic"
      break
  }
  const color = MC_COLORS[code]
  if (color) style.color = color
  return style
}

export function parseMcColors(text: string): ReactNode {
  const parts = text.split(/(§[0-9a-fk-or])/gi)
  const nodes: ReactNode[] = []
  let currentStyle: React.CSSProperties = {}

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (!part) continue

    const match = part.match(/^§([0-9a-fk-or])$/i)
    if (match) {
      const code = match[1].toLowerCase()
      if (code === "r") {
        currentStyle = {}
      } else {
        currentStyle = { ...currentStyle, ...getMcStyle(code) }
      }
    } else {
      nodes.push(
        <span key={i} style={Object.keys(currentStyle).length ? currentStyle : undefined}>
          {part}
        </span>
      )
    }
  }

  return nodes.length > 0 ? nodes : text
}
