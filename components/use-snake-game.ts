"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export const GRID_SIZE = 20

export type Point = { x: number; y: number }
export type Direction = "up" | "down" | "left" | "right"
export type GameStatus = "idle" | "running" | "paused" | "over"

export type Difficulty = {
  label: string
  /** ms per step at this level */
  speed: number
}

// Levels get faster as the score climbs.
export const DIFFICULTIES: Difficulty[] = [
  { label: "Sprout", speed: 180 },
  { label: "Vine", speed: 150 },
  { label: "Garden", speed: 125 },
  { label: "Jungle", speed: 102 },
  { label: "Wild", speed: 82 },
  { label: "Venom", speed: 66 },
]

// Score needed to reach each level (index matches DIFFICULTIES).
const LEVEL_THRESHOLDS = [0, 4, 9, 15, 22, 30]

const DIR_VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
}

const INITIAL_SNAKE: Point[] = [
  { x: 8, y: 10 },
  { x: 7, y: 10 },
  { x: 6, y: 10 },
]

function randomFood(snake: Point[]): Point {
  while (true) {
    const food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    }
    if (!snake.some((s) => s.x === food.x && s.y === food.y)) return food
  }
}

function levelForScore(score: number): number {
  let level = 0
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (score >= LEVEL_THRESHOLDS[i]) level = i
  }
  return level
}

const HIGH_SCORE_KEY = "snake-high-score"

function colorFromSeed(seed: number): string {
  return `oklch(0.55 0.14 ${(seed * 47) % 360})`
}

function foodColorFromSeed(seed: number): string {
  return `oklch(0.7 0.2 ${(seed * 47 + 150) % 360})`
}

const INITIAL_COLORS = [0, 1, 2].map(colorFromSeed)

export function useSnakeGame() {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE)
  const [food, setFood] = useState<Point>(() => randomFood(INITIAL_SNAKE))
  const [direction, setDirection] = useState<Direction>("right")
  const [status, setStatus] = useState<GameStatus>("idle")
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [segmentColors, setSegmentColors] = useState<string[]>(INITIAL_COLORS)
  const [foodColor, setFoodColor] = useState<string>(() => foodColorFromSeed(3))

  // Refs mirror state so the game loop reads fresh values without re-subscribing.
  const directionRef = useRef<Direction>("right")
  const queuedRef = useRef<Direction | null>(null)
  const statusRef = useRef<GameStatus>("idle")
  const lastStepRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)
  const colorSeedRef = useRef<number>(3)
  const foodColorRef = useRef<string>(foodColorFromSeed(3))
  const snakeRef = useRef<Point[]>(INITIAL_SNAKE)

  useEffect(() => { snakeRef.current = snake }, [snake])

  useEffect(() => { foodColorRef.current = foodColor }, [foodColor])

  const level = levelForScore(score)

  useEffect(() => {
    const stored = Number(localStorage.getItem(HIGH_SCORE_KEY) || 0)
    if (!Number.isNaN(stored)) setHighScore(stored)
  }, [])

  const reset = useCallback(() => {
    setSnake(INITIAL_SNAKE)
    setFood(randomFood(INITIAL_SNAKE))
    setDirection("right")
    directionRef.current = "right"
    queuedRef.current = null
    setScore(0)
    setStatus("running")
    statusRef.current = "running"
    lastStepRef.current = 0
    colorSeedRef.current = 3
    setSegmentColors(INITIAL_COLORS)
    setFoodColor(foodColorFromSeed(3))
  }, [])

  const togglePause = useCallback(() => {
    setStatus((prev) => {
      if (prev === "running") {
        statusRef.current = "paused"
        return "paused"
      }
      if (prev === "paused") {
        statusRef.current = "running"
        return "running"
      }
      return prev
    })
  }, [])

  const changeDirection = useCallback((next: Direction) => {
    // Can't reverse directly into yourself; queue so quick double-taps are honored.
    const current = directionRef.current
    if (next === OPPOSITE[current] || next === current) return
    queuedRef.current = next
  }, [])

  const step = useCallback(() => {
    const queued = queuedRef.current
    if (queued && queued !== OPPOSITE[directionRef.current]) {
      directionRef.current = queued
      setDirection(queued)
    }
    queuedRef.current = null

    const vec = DIR_VECTORS[directionRef.current]
    const prevSnake = snakeRef.current
    const head = prevSnake[0]
    const newHead = { x: head.x + vec.x, y: head.y + vec.y }

    // Wall collision.
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      statusRef.current = "over"
      setStatus("over")
      return
    }

    const ate = newHead.x === food.x && newHead.y === food.y
    const body = ate ? prevSnake : prevSnake.slice(0, -1)

    // Self collision.
    if (body.some((s) => s.x === newHead.x && s.y === newHead.y)) {
      statusRef.current = "over"
      setStatus("over")
      return
    }

    const newSnake = [newHead, ...body]

    if (ate) {
      setScore((s) => s + 1)
      setSegmentColors((prev) => [foodColorRef.current, ...prev])
      const nextSeed = colorSeedRef.current + 1
      colorSeedRef.current = nextSeed
      setFoodColor(foodColorFromSeed(nextSeed))
      setFood(randomFood(newSnake))
    }

    setSnake(newSnake)
    snakeRef.current = newSnake
  }, [food])

  // Persist high score when the game ends.
  useEffect(() => {
    if (status === "over") {
      setHighScore((prev) => {
        if (score > prev) {
          localStorage.setItem(HIGH_SCORE_KEY, String(score))
          return score
        }
        return prev
      })
    }
  }, [status, score])

  // Main loop — fixed timestep based on current difficulty speed.
  useEffect(() => {
    const speed = DIFFICULTIES[level].speed

    const loop = (time: number) => {
      if (statusRef.current === "running") {
        if (time - lastStepRef.current >= speed) {
          lastStepRef.current = time
          step()
        }
      } else {
        lastStepRef.current = time
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [level, step])

  // Keyboard controls.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
      }
      const dir = map[e.key]
      if (dir) {
        e.preventDefault()
        if (statusRef.current === "running") changeDirection(dir)
        return
      }
      if (e.key === " ") {
        e.preventDefault()
        if (statusRef.current === "idle" || statusRef.current === "over") reset()
        else togglePause()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [changeDirection, reset, togglePause])

  return {
    snake,
    food,
    segmentColors,
    foodColor,
    direction,
    status,
    score,
    highScore,
    level,
    difficulty: DIFFICULTIES[level],
    nextThreshold: LEVEL_THRESHOLDS[level + 1] ?? null,
    start: reset,
    reset,
    togglePause,
    changeDirection,
  }
}
