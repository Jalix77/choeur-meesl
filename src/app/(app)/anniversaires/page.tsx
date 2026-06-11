import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/database.types'
import {
  isBirthdayToday, isBirthdayThisWeek, isBirthdayThisMonth,
  daysUntilBirthday,
} from '@/lib/database.types'
import AnniversairesList from './AnniversairesList'

export const dynamic = 'force-dynamic'

export default async function AnniversairesPage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, date_naissance, photo_url')
    .eq('active', true)
    .not('date_naissance', 'is', null)
    .order('full_name')

  const withBirthday = (profiles ?? []) as Pick<Profile, 'id' | 'full_name' | 'date_naissance' | 'photo_url'>[]

  const todayList  = withBirthday.filter(p => isBirthdayToday(p.date_naissance!))
  const weekList   = withBirthday.filter(p => isBirthdayThisWeek(p.date_naissance!) && !isBirthdayToday(p.date_naissance!))
  const monthList  = withBirthday.filter(p => isBirthdayThisMonth(p.date_naissance!) && !isBirthdayThisWeek(p.date_naissance!))

  weekList.sort((a, b)  => daysUntilBirthday(a.date_naissance!) - daysUntilBirthday(b.date_naissance!))
  monthList.sort((a, b) => {
    const dayA = parseInt(a.date_naissance!.split('-')[2])
    const dayB = parseInt(b.date_naissance!.split('-')[2])
    return dayA - dayB
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-cinzel text-2xl font-bold text-[#5A3318]">🎂 Anniversaires</h1>
        <p className="text-[#B87333] text-sm mt-1">Célébrons ensemble les membres du Chœur de Louange</p>
      </div>

      <AnniversairesList
        todayList={todayList}
        weekList={weekList}
        monthList={monthList}
      />
    </div>
  )
}
