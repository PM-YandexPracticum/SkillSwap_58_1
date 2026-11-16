import { useState, useEffect, useMemo } from 'react'
import { fetchSkills } from '@/api/skills'
import type { Skill } from '@/shared/types'

export const useSimilarSkills = (currentSkill: Skill | null | undefined) => {
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSkills = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await fetchSkills()
        setAllSkills(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке')
      } finally {
        setIsLoading(false)
      }
    }

    loadSkills()
  }, [])

  const filteredSkills = useMemo(() => {
    if (!currentSkill) return []

    return allSkills.filter((skill) => {
      if (skill.id === currentSkill.id) return false

      const sameCategory = skill.category === currentSkill.category

      const sameTags = skill.tags?.some((tag) => currentSkill.tags?.includes(tag)) ?? false

      return sameCategory || sameTags
    })
  }, [allSkills, currentSkill])

  return {
    data: filteredSkills,
    isLoading,
    error,
  }
}
