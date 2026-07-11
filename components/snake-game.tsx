"use client"

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Flashlight, FlashlightOff, Pause, Play, RotateCcw, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GameBoard } from "./game-board"
import { type Direction, useSnakeGame } from "./use-snake-game"
import { useSoundEffects } from "./use-sound-effects"

export function SnakeGame() {
  const game = useSnakeGame()
  const { status, score, highScore, level, difficulty, nextThreshold, segmentColors, foodColor, torchEnabled } = game

  useSoundEffects(status, score, level)

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
      <header className="text-center">
        <h1 className="text-balance font-mono text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          Snake
        </h1>
        <p className="mt-1 text-pretty text-sm text-muted-foreground">
          Eat the glowing food, grow longer, and don&apos;t bite yourself.
        </p>
      </header>

      {/* Stat row */}
      <div className="grid w-full max-w-md grid-cols-3 gap-3">
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
                subtitle="Use arrow keys or WASD to move. Press space to pause."
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

      {/* Progress to next level */}
      {status === "running" && nextThreshold !== null && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {nextThreshold - score} more to reach level {level + 2}
        </p>
      )}

      {/* Controls */}
      <div className="flex w-full max-w-md flex-col items-center gap-4">
        {status === "running" && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={game.togglePause} className="gap-2">
              <Pause className="h-4 w-4" /> Pause
            </Button>
            <Button variant="secondary" size="sm" onClick={game.toggleTorch} className="gap-2">
              {torchEnabled ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
              {torchEnabled ? "Torch Off" : "Torch"}
            </Button>
          </div>
        )}

        {/* On-screen D-pad for touch devices */}
        <div className="grid grid-cols-3 grid-rows-3 gap-2" aria-label="Direction controls">
          <span />
          <DirButton dir="up" onPress={game.changeDirection}>
            <ArrowUp className="h-5 w-5" />
          </DirButton>
          <span />
          <DirButton dir="left" onPress={game.changeDirection}>
            <ArrowLeft className="h-5 w-5" />
          </DirButton>
          <span />
          <DirButton dir="right" onPress={game.changeDirection}>
            <ArrowRight className="h-5 w-5" />
          </DirButton>
          <span />
          <DirButton dir="down" onPress={game.changeDirection}>
            <ArrowDown className="h-5 w-5" />
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
  children,
}: {
  dir: Direction
  onPress: (d: Direction) => void
  children: React.ReactNode
}) {
  return (
    <Button
      variant="secondary"
      size="icon"
      className="h-14 w-14 active:scale-95"
      aria-label={`Move ${dir}`}
      onClick={() => onPress(dir)}
    >
      {children}
    </Button>
  )
}
