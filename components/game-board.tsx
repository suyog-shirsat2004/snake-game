"use client"

import { useEffect, useRef } from "react"
import { GRID_SIZE, type Point } from "./use-snake-game"

type GameBoardProps = {
  snake: Point[]
  food: Point
  segmentColors: string[]
  foodColor: string
  /** ms per step — used to time the smooth interpolation between cells */
  speed: number
  paused: boolean
  torchEnabled: boolean
}

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export function GameBoard({ snake, food, segmentColors, foodColor, speed, paused, torchEnabled }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const snakeRef = useRef<Point[]>(snake)
  const prevSnakeRef = useRef<Point[]>(snake)
  const stepTimeRef = useRef<number>(performance.now())
  const foodRef = useRef<Point>(food)
  const speedRef = useRef<number>(speed)
  const pausedRef = useRef<boolean>(paused)
  const segmentColorsRef = useRef<string[]>(segmentColors)
  const foodColorRef = useRef<string>(foodColor)
  const torchRef = useRef<boolean>(torchEnabled)

  useEffect(() => { segmentColorsRef.current = segmentColors }, [segmentColors])
  useEffect(() => { foodColorRef.current = foodColor }, [foodColor])
  useEffect(() => { torchRef.current = torchEnabled }, [torchEnabled])

  // Capture the moment the snake advances so we can interpolate from old → new.
  useEffect(() => {
    prevSnakeRef.current = snakeRef.current
    snakeRef.current = snake
    stepTimeRef.current = performance.now()
  }, [snake])

  useEffect(() => {
    foodRef.current = food
  }, [food])
  useEffect(() => {
    speedRef.current = speed
  }, [speed])
  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const size = canvas.clientWidth
      canvas.width = size * dpr
      canvas.height = size * dpr
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const draw = (now: number) => {
      const colors = {
        grid: cssVar("--border"),
        bg: cssVar("--card"),
      }

      const sizePx = canvas.width
      const cell = sizePx / GRID_SIZE
      ctx.clearRect(0, 0, sizePx, sizePx)

      // Background + subtle grid.
      ctx.fillStyle = colors.bg
      ctx.fillRect(0, 0, sizePx, sizePx)
      ctx.strokeStyle = colors.grid
      ctx.globalAlpha = 0.4
      ctx.lineWidth = 1
      for (let i = 1; i < GRID_SIZE; i++) {
        ctx.beginPath()
        ctx.moveTo(i * cell, 0)
        ctx.lineTo(i * cell, sizePx)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, i * cell)
        ctx.lineTo(sizePx, i * cell)
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      // Pulsing food.
      const f = foodRef.current
      const pulse = 0.5 + 0.5 * Math.sin(now / 220)
      const pad = cell * (0.16 + 0.06 * pulse)
      ctx.fillStyle = foodColorRef.current
      ctx.shadowColor = foodColorRef.current
      ctx.shadowBlur = cell * 0.5
      roundRect(ctx, f.x * cell + pad, f.y * cell + pad, cell - pad * 2, cell - pad * 2, cell * 0.3)
      ctx.fill()
      ctx.shadowBlur = 0

      // Interpolation factor between previous and current snake positions.
      const elapsed = now - stepTimeRef.current
      const t = pausedRef.current ? 0 : Math.min(elapsed / speedRef.current, 1)
      const curr = snakeRef.current
      const prev = prevSnakeRef.current

      const gap = cell * 0.12
      for (let i = curr.length - 1; i >= 0; i--) {
        const c = curr[i]
        const p = prev[i] ?? c
        // Avoid lerping across the board when the snake wraps visually (it doesn't wrap, but guard big jumps).
        const dx = Math.abs(c.x - p.x) > 1 ? c.x : p.x + (c.x - p.x) * t
        const dy = Math.abs(c.y - p.y) > 1 ? c.y : p.y + (c.y - p.y) * t
        const isHead = i === 0

        const segColors = segmentColorsRef.current
        ctx.fillStyle = segColors[i] ?? segColors[segColors.length - 1]
        if (isHead) {
          ctx.shadowColor = ctx.fillStyle
          ctx.shadowBlur = cell * 0.6
        }
        const segPad = isHead ? gap * 0.5 : gap
        const shrink = 1 - (i / curr.length) * 0.18
        const extra = (cell - cell * shrink) / 2
        roundRect(
          ctx,
          dx * cell + segPad + extra,
          dy * cell + segPad + extra,
          cell - segPad * 2 - extra * 2,
          cell - segPad * 2 - extra * 2,
          cell * 0.32,
        )
        ctx.fill()
        ctx.shadowBlur = 0

        // Eyes on the head.
        if (isHead) {
          ctx.fillStyle = colors.bg
          const cx = dx * cell + cell / 2
          const cy = dy * cell + cell / 2
          const r = cell * 0.08
          const o = cell * 0.16
          ctx.beginPath()
          ctx.arc(cx - o, cy - o, r, 0, Math.PI * 2)
          ctx.arc(cx + o, cy - o, r, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Torch: dark overlay with radial gradient around snake's head.
      if (torchRef.current) {
        const head = snakeRef.current[0]
        const hx = head.x * cell + cell / 2
        const hy = head.y * cell + cell / 2
        const gradient = ctx.createRadialGradient(hx, hy, cell * 0.5, hx, hy, cell * 5)
        gradient.addColorStop(0, "transparent")
        gradient.addColorStop(1, "rgba(0,0,0,0.85)")
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, sizePx, sizePx)
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="aspect-square max-h-full max-w-full rounded-xl border border-border bg-card shadow-2xl"
      role="img"
      aria-label="Snake game board"
    />
  )
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}
