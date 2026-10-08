import type { ExerciseTimeline, FretboardPath, PracticeRound, RoundGenerationContext, ScaleCombination, TimelineEvent } from '../types'
import { enumeratePositions } from '../fretboard/positionGenerator'
import { generateAllLinkedDiagonals } from '../fretboard/linkedDiagonal'
import { generateContinuousCandidates } from '../fretboard/continuous/candidate'
import { selectDistinctContinuousPaths } from '../fretboard/continuous/search'
import { buildSequentialScaleCycle, buildWeightedScaleBag, preventBoundaryDuplicate, shuffleScaleBag } from './weightedBag'
import { createPositionBag, createPositionBagKey, drawPosition, refillPositionBag } from './positionBag'
import { planPracticePath } from './ascent'
import { buildExerciseTimeline } from '../timeline/timeline'
import { BAR_4_4, QUARTER } from '../timeline/constants'

const PATH_GAP_TICKS = BAR_4_4 * 2
const CLICK_TICKS = 120

function previousCombination(context: RoundGenerationContext): ScaleCombination | null {
  return context.state?.previousCombination ?? context.previousCombination ?? null
}

function createScaleBag(context: RoundGenerationContext): ScaleCombination[] {
  const { root, scaleType } = context.settings

  if (root !== 'auto') {
    if (scaleType !== 'random') return [{ root, scaleType }]
    const fixedRootBag = buildWeightedScaleBag('random').filter(item => item.root === root)
    return preventBoundaryDuplicate(previousCombination(context), shuffleScaleBag(fixedRootBag, context.rng))
  }

  if (scaleType !== 'random') return [...buildSequentialScaleCycle(scaleType)]

  return preventBoundaryDuplicate(
    previousCombination(context),
    shuffleScaleBag(buildWeightedScaleBag('random'), context.rng),
  )
}

function combinations(context: RoundGenerationContext): ScaleCombination[] {
  if (context.state) {
    if (!context.state.scaleBag.length) context.state.scaleBag.push(...createScaleBag(context))
    return context.state.scaleBag
  }
  return createScaleBag(context)
}

function compareEvents(a: TimelineEvent, b: TimelineEvent): number {
  return a.tick - b.tick || (a.type === 'metronome' ? -1 : 1)
}

function buildPresentedRound(
  context: RoundGenerationContext,
  combination: ScaleCombination,
  paths: readonly FretboardPath[],
): { paths: FretboardPath[]; timeline: ExerciseTimeline } {
  const planned = paths.map(path => ({
    path,
    run: planPracticePath({
      notes: path.notes,
      scaleType: combination.scaleType,
      tuning: context.settings.tuning,
      root: combination.root,
      exerciseType: context.settings.exerciseType,
    }),
  }))
  let offset = 0
  const events: TimelineEvent[] = []
  let ascendingEndTick = 0
  let descendingStartTick = 0
  for (let index = 0; index < planned.length; index += 1) {
    const item = planned[index]
    if (!item) continue
    const part = buildExerciseTimeline({
      ascending: item.run.ascending,
      descending: item.run.descending,
      exerciseType: context.settings.exerciseType,
      previewBars: index === 0 ? 1 : 0,
    })
    events.push(...part.events.map(event => ({ ...event, tick: event.tick + offset })))
    if (index === 0) {
      ascendingEndTick = part.ascendingEndTick
      descendingStartTick = part.descendingStartTick
    }
    offset += part.totalTicks
    if (index < planned.length - 1) {
      for (let beat = 0; beat < PATH_GAP_TICKS; beat += QUARTER) {
        events.push({
          tick: offset + beat,
          durationTicks: CLICK_TICKS,
          type: 'metronome',
          accent: beat % BAR_4_4 === 0,
        })
      }
      offset += PATH_GAP_TICKS
    }
  }
  return {
    paths: planned.map(({ path, run }) => ({ ...path, notes: run.displayNotes })),
    timeline: {
      events: events.sort(compareEvents),
      totalTicks: offset,
      ascendingEndTick,
      descendingStartTick,
    },
  }
}

function round(
  context: RoundGenerationContext,
  combination: ScaleCombination,
  paths: readonly FretboardPath[],
  debugEvents: readonly string[],
): PracticeRound {
  const first = paths[0]
  if (!first) throw new RangeError('A round requires at least one path')
  const presented = buildPresentedRound(context, combination, paths)
  return {
    id: `${context.settings.seed}-${combination.root}-${combination.scaleType}-${first.id}`,
    combination,
    paths: presented.paths,
    timeline: presented.timeline,
    debugEvents,
  }
}

export function generateRandomPositionRound(context: RoundGenerationContext): PracticeRound {
  const debug: string[] = []
  const bag = combinations(context)
  while (bag.length) {
    const combination = bag.shift()
    if (!combination) break
    const positions = enumeratePositions({ tuning: context.settings.tuning, ...combination })
    if (!positions.length) {
      debug.push(`Skipped ${combination.root}/${combination.scaleType}: no valid position`)
      continue
    }
    const key = createPositionBagKey({ tuning: context.settings.tuning, ...combination })
    const existing = context.state?.positionBags.get(key)
    const previousPositionId = existing?.previousPositionId
    const positionBag = existing?.remaining.length
      ? existing
      : existing
        ? refillPositionBag(positions, context.rng, ...(previousPositionId ? [previousPositionId] as const : []))
        : createPositionBag(positions, context.rng)
    const draw = drawPosition(positionBag)
    if (context.state) {
      context.state.positionBags.set(key, draw.bag)
      context.state.previousCombination = combination
    }
    if (draw.position) {
      return round(context, combination, [{ id: draw.position.id, notes: draw.position.ascendingPath }], debug)
    }
  }
  throw new RangeError('No valid scale position for the selected settings')
}

export function generateFullNeckRound(context: RoundGenerationContext): PracticeRound {
  const combination = combinations(context).shift()
  if (!combination) throw new RangeError('Scale bag is empty')
  if (context.state) context.state.previousCombination = combination
  const base = { tuning: context.settings.tuning, ...combination }
  const positions = enumeratePositions(base).map(position => ({ id: position.id, notes: position.ascendingPath }))
  const linked = generateAllLinkedDiagonals(base)
  const candidates = generateContinuousCandidates({ ...base, seed: context.settings.seed })
  const continuous = selectDistinctContinuousPaths(candidates, [...positions, ...linked, ...(context.excludedPaths ?? [])])
  const paths = [...positions, ...linked, ...continuous]
  if (!paths.length) throw new RangeError('No full-neck paths available')
  return round(context, combination, paths, [])
}

export function generateNextRound(context: RoundGenerationContext): PracticeRound {
  return context.settings.mode === 'fullNeck' ? generateFullNeckRound(context) : generateRandomPositionRound(context)
}
