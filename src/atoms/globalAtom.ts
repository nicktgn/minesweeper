import { atom } from 'jotai'
import { DifficultyLevel } from '../model'

export const difficultyLevelAtom = atom(DifficultyLevel.BEGINNER)

export const screenAtom = atom('main')
