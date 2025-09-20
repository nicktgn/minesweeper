import { useCallback } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { DifficultyMap } from '../model/config'
import {
    difficultyLevelAtom,
} from '../atoms/globalAtom'
import type { Vector2 } from '../model'

export function useGame() {
    const difficultyLevel = useAtomValue(difficultyLevelAtom)
    const difficultyConfig = DifficultyMap[difficultyLevel].config

}
