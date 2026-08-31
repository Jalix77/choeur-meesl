import type { ServiceProgramItem } from '@/lib/database.types'
import { programAssigneeName } from '@/lib/service-program'

interface Props {
  items: ServiceProgramItem[]
  profileNameById: Record<string, string>
}

export default function ServiceProgramList({ items, profileNameById }: Props) {
  if (items.length === 0) return null
  const sorted = [...items].sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="border-t border-[#E2B36A]/30 px-4 sm:px-5 py-3">
      <p className="text-xs font-semibold text-[#B87333] uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <span>🗓</span> Programmation du culte
      </p>
      <ol className="space-y-1.5">
        {sorted.map((item, i) => {
          const name = programAssigneeName(item, profileNameById)
          return (
            <li key={item.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm text-[#5A3318]">
              <span className="text-[#B87333]/60 font-mono text-xs w-5 flex-shrink-0 text-right">{i + 1}.</span>
              <span className="font-medium break-words">{item.label}</span>
              <span className="text-[#B87333]/40">—</span>
              <span className={name ? 'break-words' : 'italic text-[#B87333]/50'}>{name ?? 'Non assigné'}</span>
              {item.note && (
                <span className="text-xs text-[#7A4A20] italic w-full pl-7 break-words">{item.note}</span>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
