"use client"

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Flashlight, FlashlightOff, Pause, Play, RotateCcw, Settings, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GameBoard } from "./game-board"
import { type Direction, useSnakeGame } from "./use-snake-game"
import { useSoundEffects } from "./use-sound-effects"
import { useCallback, useEffect, useState } from "react"

type ArrowSize = "sm" | "md" | "lg"

const ARROW_SIZE_KEY = "snake-arrow-size"

const ARROW_SIZES: Record<ArrowSize, { btn: string; icon: string }> = {
  sm: { btn: "h-12 w-12 sm:h-11 sm:w-11", icon: "h-5 w-5" },
  md: { btn: "h-16 w-16 sm:h-14 sm:w-14", icon: "h-7 w-7 sm:h-6 sm:w-6" },
  lg: { btn: "h-20 w-20 sm:h-18 sm:w-18", icon: "h-8 w-8 sm:h-7 sm:w-7" },
}

const ARROW_SIZE_LABELS: Record<ArrowSize, string> = { sm: "S", md: "M", lg: "L" }

export function SnakeGame() {
  const game = useSnakeGame()
  const { status, score, highScore, level, difficulty, nextThreshold, segmentColors, foodColor, torchEnabled } = game

  const [arrowSize, setArrowSize] = useState<ArrowSize>("md")
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(ARROW_SIZE_KEY) as ArrowSize | null
    if (stored && ARROW_SIZES[stored]) setArrowSize(stored)
  }, [])

  const changeArrowSize = useCallback((size: ArrowSize) => {
    setArrowSize(size)
    localStorage.setItem(ARROW_SIZE_KEY, size)
  }, [])

  useSoundEffects(status, score, level)

  return (
    <main className="flex min-h-dvh flex-col items-center justify-between gap-3 p-3 sm:gap-6 sm:p-4">
      <header className="text-center">
        <h1 className="text-balance font-mono text-2xl font-bold tracking-tight text-primary sm:text-4xl">
          Snake
        </h1>
        <p className="mt-1 text-pretty text-xs text-muted-foreground sm:text-sm">
          Eat the glowing food, grow longer, and don&apos;t bite yourself.
        </p>
      </header>

      {/* Stat row */}
      <div className="grid w-full max-w-md grid-cols-3 gap-2 sm:gap-3">
        <Stat label="Score" value={score} />
        <Stat label="Level" value={`${level + 1} · ${difficulty.label}`} />
        <Stat
          label="Best"
          value={
            <span className="inline-flex items-center gap-1">
              <Trophy className="h-4 w-4 text-accent" aria-hidden />
              {highScore}
            </span>
          }
        />
      </div>

      {/* Board + overlays */}
      <div className="relative w-full max-w-md">
        <GameBoard snake={game.snake} food={game.food} segmentColors={segmentColors} foodColor={foodColor} speed={difficulty.speed} paused={status === "paused"} torchEnabled={torchEnabled} />

        {status !== "running" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl bg-background/80 backdrop-blur-sm">
            {status === "idle" && (
              <Overlay
                title="Ready to slither?"
                subtitle="Tap the arrow buttons to move. Tap Pause to pause."
                action={<PrimaryAction onClick={game.start} icon={<Play className="h-4 w-4" />} label="Start game" />}
              />
            )}
            {status === "paused" && (
              <Overlay
                title="Paused"
                subtitle="Take a breath."
                action={
                  <PrimaryAction onClick={game.togglePause} icon={<Play className="h-4 w-4" />} label="Resume" />
                }
              />
            )}
            {status === "over" && (
              <Overlay
                title="Game Over"
                subtitle={
                  score >= highScore && score > 0
                    ? `New best score: ${score}!`
                    : `You scored ${score}. Best is ${highScore}.`
                }
                action={
                  <PrimaryAction onClick={game.reset} icon={<RotateCcw className="h-4 w-4" />} label="Play again" />
                }
              />
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex w-full max-w-md flex-col items-center gap-3 sm:gap-4">
        {/* Progress to next level */}
        {status === "running" && nextThreshold !== null && (
          <p className="text-[11px] text-muted-foreground sm:text-xs" aria-live="polite">
            {nextThreshold - score} more to reach level {level + 2}
          </p>
        )}

        {status === "running" && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={game.togglePause} className="gap-2">
              <Pause className="h-4 w-4" /> Pause
            </Button>
            <Button variant="secondary" size="sm" onClick={game.toggleTorch} className="gap-2">
              {torchEnabled ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
              {torchEnabled ? "Torch Off" : "Torch"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setSettingsOpen((p) => !p)} className="gap-2">
              <Settings className="h-4 w-4" /> Settings
            </Button>
          </div>
        )}

        {settingsOpen && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <span className="text-xs text-muted-foreground">Arrows</span>
            <div className="flex gap-1">
              {(["sm", "md", "lg"] as ArrowSize[]).map((s) => (
                <Button
                  key={s}
                  variant={arrowSize === s ? "default" : "secondary"}
                  size="sm"
                  className="h-7 w-7 p-0 text-xs"
                  onClick={() => changeArrowSize(s)}
                >
                  {ARROW_SIZE_LABELS[s]}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* On-screen D-pad */}
        <div className="grid grid-cols-3 grid-rows-3 gap-1.5 sm:gap-2" aria-label="Direction controls">
          <span />
          <DirButton dir="up" onPress={game.changeDirection} size={arrowSize}>
            <ArrowUp />
          </DirButton>
          <span />
          <DirButton dir="left" onPress={game.changeDirection} size={arrowSize}>
            <ArrowLeft />
          </DirButton>
          <span />
          <DirButton dir="right" onPress={game.changeDirection} size={arrowSize}>
            <ArrowRight />
          </DirButton>
          <span />
          <DirButton dir="down" onPress={game.changeDirection} size={arrowSize}>
            <ArrowDown />
          </DirButton>
          <span />
        </div>
      </div>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-card px-3 py-2">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="mt-0.5 font-mono text-base font-semibold text-card-foreground">{value}</span>
    </div>
  )
}

function Overlay({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle: string
  action: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 text-center">
      <h2 className="text-balance text-2xl font-bold text-foreground">{title}</h2>
      <p className="max-w-xs text-pretty text-sm text-muted-foreground">{subtitle}</p>
      {action}
    </div>
  )
}

function PrimaryAction({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <Button onClick={onClick} size="lg" className="mt-1 gap-2">
      {icon}
      {label}
    </Button>
  )
}

function DirButton({
  dir,
  onPress,
  size,
  children,
}: {
  dir: Direction
  onPress: (d: Direction) => void
  size: ArrowSize
  children: React.ReactNode
}) {
  const dims = ARROW_SIZES[size]
  return (
    <Button
      variant="secondary"
      size="icon"
      className={`${dims.btn} active:scale-90 touch-manipulation`}
      aria-label={`Move ${dir}`}
      onPointerDown={(e) => {
        e.preventDefault()
        onPress(dir)
      }}
    >
      <span className={dims.icon}>{children}</span>
    </Button>
  )
}
