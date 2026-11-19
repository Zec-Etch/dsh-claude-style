import { COMPOSER_SELECTOR } from '@dsh-claude-style/contracts/dom'
import { observeMatches } from '@dsh-claude-style/engine/bus'
import { requestFrame } from '@dsh-claude-style/engine/frame'
import { PAGE_UNDER_480_ATTR } from '../../constants'

const KEYBOARD_ENTER_GAP = 120
const KEYBOARD_EXIT_GAP = 40
const UNZOOMED_SCALE_TOLERANCE = 0.02
const SEAT_SETTLED_TOLERANCE = 2
const MAX_CORRECTION_PASSES = 6

/** Ignore toolbar movement and pinch zoom, but keep following an animating keyboard until it is nearly closed. */
export function composerViewportGap(reading: { layoutHeight: number, height: number, offsetTop: number, scale: number, narrow: boolean, previousGap: number }) {
  if (!reading.narrow || Math.abs(reading.scale - 1) > UNZOOMED_SCALE_TOLERANCE) return 0
  const occlusion = Math.max(0, reading.layoutHeight - reading.height - reading.offsetTop)
  return occlusion >= (reading.previousGap > 0 ? KEYBOARD_EXIT_GAP : KEYBOARD_ENTER_GAP) ? occlusion : 0
}

/** The host scroller may already have shrunk independently of the layout viewport. */
export function composerSeatOffset(reading: { occlusion: number, seatBottom: number, appliedOffset: number, viewportBottom: number }) {
  const wanted = Math.round(reading.appliedOffset + reading.seatBottom - reading.viewportBottom)
  const bounded = Math.max(0, Math.min(reading.occlusion, wanted))
  return reading.appliedOffset <= reading.occlusion && Math.abs(bounded - reading.appliedOffset) < SEAT_SETTLED_TOLERANCE
    ? reading.appliedOffset
    : bounded
}

/** Follow the visible viewport while a mobile keyboard opens, moves or closes. */
export function createComposerViewportFollow() {
  const seats = observeMatches<HTMLElement>(COMPOSER_SELECTOR, () => trigger())
  // 按行：座位脱离文档或键盘收起时清除该座位的偏移。
  const applied = new Map<HTMLElement, number>()
  let cancel: (() => void) | null = null
  let stopped = false
  let gap = 0
  let passes = 0

  function trigger() {
    passes = 0
    schedule()
  }

  function schedule() {
    if (stopped || cancel !== null) return
    const changes: { seat: HTMLElement, offset: number }[] = []
    cancel = requestFrame({
      read() {
        const viewport = window.visualViewport
        const height = viewport?.height ?? window.innerHeight
        const offsetTop = viewport?.offsetTop ?? 0
        gap = composerViewportGap({
          layoutHeight: window.innerHeight,
          height,
          offsetTop,
          scale: viewport?.scale ?? 1,
          narrow: document.body.hasAttribute(PAGE_UNDER_480_ATTR),
          previousGap: gap,
        })
        const current = seats.all()
        for (const seat of applied.keys()) {
          if (!current.includes(seat)) changes.push({ seat, offset: 0 })
        }
        for (const seat of current) {
          const appliedOffset = applied.get(seat) ?? 0
          const sticky = gap > 0 && seat.getClientRects().length > 0 && getComputedStyle(seat).position === 'sticky'
          const offset = sticky ? composerSeatOffset({
            occlusion: gap,
            seatBottom: seat.getBoundingClientRect().bottom,
            appliedOffset,
            viewportBottom: height + offsetTop,
          }) : 0
          if (offset !== appliedOffset) changes.push({ seat, offset })
        }
      },
      write() {
        cancel = null
        let moved = false
        for (const { seat, offset } of changes) {
          if (offset === 0) {
            seat.style.removeProperty('bottom')
            applied.delete(seat)
          } else {
            seat.style.bottom = `${offset}px`
            applied.set(seat, offset)
            moved = true
          }
        }
        // Sticky positions can be constrained by their scroll container; bound the correction loop.
        if (moved && ++passes < MAX_CORRECTION_PASSES) schedule()
      },
    })
  }

  const viewport = window.visualViewport
  viewport?.addEventListener('resize', trigger)
  viewport?.addEventListener('scroll', trigger)
  window.addEventListener('resize', trigger)
  trigger()

  return () => {
    stopped = true
    cancel?.()
    cancel = null
    viewport?.removeEventListener('resize', trigger)
    viewport?.removeEventListener('scroll', trigger)
    window.removeEventListener('resize', trigger)
    for (const seat of applied.keys()) seat.style.removeProperty('bottom')
    applied.clear()
    seats.release()
  }
}
