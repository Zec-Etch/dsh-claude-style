/**
 * @capability composer-viewport
 * @features composer
 * @risk A mobile keyboard hides the composer, leaves an extra gap, or moves it during pinch zoom and on desktop.
 */
import { expect, test } from 'vitest'
import { composerSeatOffset, composerViewportGap } from '@dsh-claude-style/client/pure'

const viewport = { layoutHeight: 797, height: 464, offsetTop: 0, scale: 1, narrow: true, previousGap: 0 }
const seat = { occlusion: 333, seatBottom: 552, appliedOffset: 0, viewportBottom: 464 }

test('calculates the keyboard occlusion in layout coordinates', () => {
  expect(composerViewportGap(viewport)).toBe(333)
  expect(composerViewportGap({ ...viewport, offsetTop: 40 })).toBe(293)
})

test('accepts rounding around scale one without following pinch zoom', () => {
  expect(composerViewportGap({ ...viewport, scale: 0.99999 })).toBe(333)
  expect(composerViewportGap({ ...viewport, scale: 1.0000001 })).toBe(333)
  expect(composerViewportGap({ ...viewport, scale: 1.25, previousGap: 333 })).toBe(0)
})

test('ignores toolbar movement and follows the keyboard through its closing animation', () => {
  expect(composerViewportGap({ ...viewport, height: 767 })).toBe(0)
  expect(composerViewportGap({ ...viewport, height: 737 })).toBe(0)
  expect(composerViewportGap({ ...viewport, height: 737, previousGap: 333 })).toBe(60)
  expect(composerViewportGap({ ...viewport, height: 767, previousGap: 60 })).toBe(0)
})

test('does not follow on desktop or when the viewport is unobstructed', () => {
  expect(composerViewportGap({ ...viewport, narrow: false, previousGap: 333 })).toBe(0)
  expect(composerViewportGap({ ...viewport, height: 797, previousGap: 333 })).toBe(0)
})

test('moves the seat only as far as the keyboard top', () => {
  expect(composerSeatOffset(seat)).toBe(88)
  expect(composerSeatOffset({ ...seat, seatBottom: 797 })).toBe(333)
  expect(composerSeatOffset({ ...seat, seatBottom: 464 })).toBe(0)
})

test('keeps a settled offset and corrects a stale offset after the scroller changes', () => {
  expect(composerSeatOffset({ ...seat, seatBottom: 465, appliedOffset: 88 })).toBe(88)
  expect(composerSeatOffset({ ...seat, seatBottom: 250, appliedOffset: 333 })).toBe(119)
})

test('bounds the offset by the occlusion and releases it when the keyboard closes', () => {
  expect(composerSeatOffset({ ...seat, seatBottom: 900 })).toBe(333)
  expect(composerSeatOffset({ ...seat, occlusion: 40, appliedOffset: 41 })).toBe(40)
  expect(composerSeatOffset({ ...seat, occlusion: 0, appliedOffset: 88 })).toBe(0)
})
