# Mobile composer screenshot evidence

Before: upstream master `b5f474b`, build `b20dbaf3a1d0`. After: the keyboard-follow patch on the same base, build `05df7e53d571`.

All originals are actual DSH Web 0.2.2-rc.5 pages in isolated profiles. Each capture passed the repository privacy sweep and visible-text leak scan. The session content is from the repository’s local scripted model.

Mobile: Playwright WebKit, iPhone 14 context, 390 × 797 CSS px. The OS software keyboard is simulated: the browser visual viewport reports height 464 px and scale 0.99999; a labeled overlay marks the occluded area. No physical iPhone or native keyboard was used.

| Theme | Before input bottom | After input bottom | Keyboard top |
| --- | ---: | ---: | ---: |
| light | 751 px | 418 px | 464 px |
| dark | 751 px | 418 px | 464 px |

Desktop: Chrome, 1280 × 900 CSS px, identical interactions and UI preferences. The conversation editor’s rectangle, font size, draft and inline bottom offset are identical before and after in both themes. Injecting a 333 px visual-viewport reduction on desktop changed neither the input position nor the draft.

| Theme | Scene | Changed pixels |
| --- | --- | ---: |
| light | home | 0 / 1,152,000 |
| light | chat | 0 / 1,152,000 |
| light | settings | 0 / 1,152,000 |
| dark | home | 0 / 1,152,000 |
| dark | chat | 58 / 1,152,000 |
| dark | settings | 0 / 1,152,000 |

Raw screenshots are kept unaltered, including the host’s live turn timestamp. `comparison.json` records any nonzero diff bounds. The desktop result applies to the tested scenes, not to the full repository CI matrix.
