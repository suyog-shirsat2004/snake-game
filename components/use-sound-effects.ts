"use client"

import { useEffect, useRef } from "react"
import { playEat, playGameOver, playLevelUp, playStart, playPause, playResume } from "@/lib/sounds"
import type { GameStatus } from "./use-snake-game"

export function useSoundEffects(status: GameStatus, score: number, level: number) {
  const prevStatus = useRef<GameStatus>(status)
  const prevScore = useRef<number>(score)
  const prevLevel = useRef<number>(level)

  useEffect(() => {
    const changedStatus = status !== prevStatus.current

    if (changedStatus && status === "running" && prevStatus.current === "idle") playStart()
    if (changedStatus && status === "over") playGameOver()
    if (changedStatus && status === "paused") playPause()
    if (changedStatus && status === "running" && prevStatus.current === "paused") playResume()

    if (score > prevScore.current) playEat()
    if (level > prevLevel.current) playLevelUp()

    prevStatus.current = status
    prevScore.current = score
    prevLevel.current = level
  }, [status, score, level])
}
