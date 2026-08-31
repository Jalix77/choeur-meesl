'use client'

export type AssigneeMode = 'none' | 'member' | 'external'

export interface ProgramItemDraft {
  key: string            // clé locale stable (id existant ou généré) — pour React uniquement
  item_type: string
  label: string
  assignee_mode: AssigneeMode
  profile_id: string | null
  external_name: string
  external_email: string
  external_phone: string
  note: string
}

interface ChoristerOption { id: string; full_name: string }

interface Props {
  items: ProgramItemDraft[]
  onChange: (items: ProgramItemDraft[]) => void
  choristers: ChoristerOption[]
}

const EXTERNAL = '__external__'
const NONE = ''

let keyCounter = 0
function nextKey(): string {
  keyCounter += 1
  return `new-${Date.now()}-${keyCounter}`
}

export default function ServiceProgramEditor({ items, onChange, choristers }: Props) {
  const inputCls = "w-full border border-[#E2B36A]/50 rounded-lg px-2.5 py-1.5 bg-[#FBF6EC] text-[#5A3318] text-sm focus:outline-none focus:ring-2 focus:ring-[#B87333]/40"
  const selectCls = inputCls

  function update(i: number, patch: Partial<ProgramItemDraft>) {
    onChange(items.map((it, idx) => idx === i ? { ...it, ...patch } : it))
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i))
  }

  function addItem() {
    onChange([...items, {
      key: nextKey(), item_type: 'custom', label: '', assignee_mode: 'none',
      profile_id: null, external_name: '', external_email: '', external_phone: '', note: '',
    }])
  }

  return (
    <div className="border border-[#E2B36A]/50 rounded-xl overflow-hidden">
      <div className="bg-[#5A3318] px-4 py-2.5">
        <h4 className="font-cinzel text-white text-sm tracking-wide">Programmation du culte</h4>
        <p className="text-[#E2B36A]/80 text-xs mt-0.5">
          Ordre du service — assignez un responsable (membre ou invité) pour chaque élément.
        </p>
      </div>

      <div className="p-3 bg-[#FBF6EC]/40 space-y-2">
        {items.length === 0 && (
          <p className="text-xs text-[#B87333]/60 italic px-1">Aucun élément — utilisez « + Ajouter un élément » ci-dessous.</p>
        )}

        {items.map((item, i) => {
          const isExternal = item.assignee_mode === 'external'
          const selectValue = item.profile_id ? item.profile_id : (isExternal ? EXTERNAL : NONE)

          return (
            <div key={item.key} className="rounded-lg border border-[#E2B36A]/30 bg-white/60 p-2.5 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-xs font-mono text-[#B87333]/70 pt-2 w-5 flex-shrink-0 text-right">{i + 1}.</span>
                <input
                  className={inputCls}
                  value={item.label}
                  onChange={e => update(i, { label: e.target.value })}
                  placeholder="Intitulé de l'élément"
                />
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                    className="text-xs text-[#B87333] hover:text-[#5A3318] disabled:opacity-30 disabled:cursor-not-allowed px-1.5 leading-none" title="Monter">
                    ↑
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1}
                    className="text-xs text-[#B87333] hover:text-[#5A3318] disabled:opacity-30 disabled:cursor-not-allowed px-1.5 leading-none" title="Descendre">
                    ↓
                  </button>
                </div>
                <button type="button" onClick={() => remove(i)}
                  className="text-red-400 hover:text-red-600 flex-shrink-0 text-sm px-1" title="Supprimer cet élément">
                  ✕
                </button>
              </div>

              <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  className={selectCls}
                  value={selectValue}
                  onChange={e => {
                    const v = e.target.value
                    if (v === NONE) {
                      update(i, { profile_id: null, assignee_mode: 'none', external_name: '', external_email: '', external_phone: '' })
                    } else if (v === EXTERNAL) {
                      update(i, { profile_id: null, assignee_mode: 'external' })
                    } else {
                      update(i, { profile_id: v, assignee_mode: 'member', external_name: '', external_email: '', external_phone: '' })
                    }
                  }}
                >
                  <option value={NONE}>— Non assigné —</option>
                  <option value={EXTERNAL}>✎ Externe / invité…</option>
                  {choristers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>

                {!isExternal && (
                  <input
                    className={inputCls}
                    value={item.note}
                    onChange={e => update(i, { note: e.target.value })}
                    placeholder="Note (optionnel)"
                  />
                )}
              </div>

              {isExternal && (
                <div className="pl-7 space-y-2 border-l-2 border-[#B87333]/20 ml-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5A3318] mb-0.5">Nom complet *</label>
                    <input
                      className={inputCls}
                      value={item.external_name}
                      onChange={e => update(i, { external_name: e.target.value })}
                      placeholder="ex: Pasteur Lissot Saint-Fleur"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#5A3318] mb-0.5">Email</label>
                      <input
                        type="email"
                        className={inputCls}
                        value={item.external_email}
                        onChange={e => update(i, { external_email: e.target.value })}
                        placeholder="pasteur@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#5A3318] mb-0.5">Téléphone / WhatsApp</label>
                      <input
                        type="tel"
                        className={inputCls}
                        value={item.external_phone}
                        onChange={e => update(i, { external_phone: e.target.value })}
                        placeholder="+509..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5A3318] mb-0.5">Note (optionnel)</label>
                    <input
                      className={inputCls}
                      value={item.note}
                      onChange={e => update(i, { note: e.target.value })}
                      placeholder="Note (optionnel)"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <button
          type="button"
          onClick={addItem}
          className="w-full text-xs text-[#B87333] border border-dashed border-[#B87333]/50 rounded-lg py-2 hover:bg-[#B87333]/10 transition-colors"
        >
          + Ajouter un élément
        </button>
      </div>
    </div>
  )
}
