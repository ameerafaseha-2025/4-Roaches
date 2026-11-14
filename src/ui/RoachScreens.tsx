import { useEffect, useState } from 'react';
import { useGame } from '../game/store';
import { sound } from '../game/sound';
import { COSMETIC_SLOTS, COSMETICS, SLOT_LABEL, cosmeticsBySlot, type CosmeticSlot } from '../progression/CosmeticsConfig';
import { canBuyMutation, unlockHint } from '../progression/MutationManager';
import { MUTATIONS, type MutationId } from '../progression/MutationConfig';
import { SKILLS, SKILL_BRANCH_NAME, nextSkillCost } from '../progression/SkillManager';
import { AbilityCard, MutationRail, PreviewSpacer, ProsCons, StatBlock } from './MutationPanel';
import { Btn, Coin, Coins, Confirm, ScreenFrame, useBackKey, useToast } from './kit';

function useSelected() {
  const preview = useGame((s) => s.previewMutation);
  const setPreview = useGame((s) => s.setPreview);
  useEffect(() => () => { useGame.getState().setPreviewCosmetics(null); }, []);
  return [preview, setPreview] as const;
}

function ActionBar({ id, toast }: { id: MutationId; toast: ReturnType<typeof useToast> }) {
  const s = useGame();
  const [ask, setAsk] = useState(false);
  const def = MUTATIONS[id];
  const owned = s.owned.includes(id);
  const equipped = s.equipped === id;
  const check = canBuyMutation(def, s);

  const buy = () => {
    setAsk(false);
    const r = s.buyMutation(id);
    if (r.ok) { sound('win'); toast.show(`${def.name} unlocked`, 'good'); s.equipMutation(id); }
    else toast.show(r.reason ?? 'Cannot buy', 'bad');
  };

  return (
    <div className="action-bar">
      {equipped ? <span className="state-tag equipped">Currently equipped</span>
        : owned ? <Btn primary onClick={() => { s.equipMutation(id); sound('eat'); toast.show(`${def.name} equipped`, 'good'); }}>Equip</Btn>
          : (
            <>
              <span className="price"><Coin />{def.price}</span>
              <Btn primary onClick={() => (check.ok ? setAsk(true) : toast.show(check.reason ?? 'Locked', 'bad'))}>{s.coins >= def.price && check.ok ? 'Purchase' : check.reason?.startsWith('Reach') ? 'Locked' : 'Not enough coins'}</Btn>
              {def.earnedBy !== null && <span className="dim" style={{ fontSize: 12 }}>{unlockHint(def)}</span>}
            </>
          )}
      {ask && <Confirm eyebrow="Confirm purchase" title={def.name} body={def.tagline} cost={def.price} balance={s.coins} confirmLabel="Buy" onConfirm={buy} onCancel={() => setAsk(false)} />}
    </div>
  );
}

function Detail({ id, toast }: { id: MutationId; toast: ReturnType<typeof useToast> }) {
  const s = useGame();
  const def = MUTATIONS[id];
  return (
    <div className="preview-col" style={{ overflow: 'hidden' }}>
      <span className={`rarity-tag r-${def.rarity}`} style={{ alignSelf: 'flex-start', marginBottom: 12 }}>{def.rarity}</span>
      <h3 className="pv-name">{def.name}</h3>
      <p className="pv-line">{def.desc}</p>
      <StatBlock id={id} skills={s.skills} compareTo={s.equipped} />
      <AbilityCard def={def} />
      <ProsCons def={def} />
      <ActionBar id={id} toast={toast} />
    </div>
  );
}

export function CollectionScreen() {
  const s = useGame();
  const [sel, setSel] = useSelected();
  const toast = useToast();
  useBackKey(true, s.back);
  return (
    <ScreenFrame eyebrow="Know your forms" title="Roach Collection" mode="stage" onBack={s.back} tools={<Coins value={s.coins} />}>
      <Detail id={sel} toast={toast} />
      <PreviewSpacer />
      <MutationRail selected={sel} onSelect={(id) => { setSel(id); sound(); }} owned={s.owned} equipped={s.equipped} reached={s.reached} />
      {toast.node}
    </ScreenFrame>
  );
}

function SkillTree({ toast }: { toast: ReturnType<typeof useToast> }) {
  const s = useGame();
  const [ask, setAsk] = useState<string | null>(null);
  const branches = ['body', 'flight', 'cunning'] as const;
  const target = SKILLS.find((k) => k.id === ask);
  const cost = target ? nextSkillCost(target.id, s.skills[target.id] ?? 0) : null;
  return (
    <div className="skills scroll">
      {branches.map((b) => (
        <div className="branch" key={b}>
          <h3>{SKILL_BRANCH_NAME[b]}</h3>
          <p>{b === 'body' ? 'Endure, hit harder, last longer.' : b === 'flight' ? 'Move faster and farther on less.' : 'Hide, plan, and use abilities better.'}</p>
          <div className="nodes">
            {SKILLS.filter((k) => k.branch === b).map((k) => {
              const lvl = s.skills[k.id] ?? 0;
              const next = nextSkillCost(k.id, lvl);
              const afford = next !== null && s.coins >= next;
              return (
                <div key={k.id} className={`node ${lvl > 0 ? 'has' : ''}`}>
                  <h4><span>{k.name}</span><span className="num dim">{lvl}/{k.costs.length}</span></h4>
                  <p>{k.desc(lvl)}</p>
                  <div className="foot">
                    <div className="pips">{k.costs.map((_, i) => <i key={i} className={i < lvl ? 'on' : ''} />)}</div>
                    {next === null ? <span className="state-tag equipped">Maxed</span>
                      : <Btn small primary={afford} onClick={() => (afford ? setAsk(k.id) : toast.show(`Need ${next - s.coins} more Crumb Coins`, 'bad'))}><Coin />{next}</Btn>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {target && cost !== null && (
        <Confirm eyebrow="Confirm upgrade" title={`${target.name} ${(s.skills[target.id] ?? 0) + 1}`} body={target.desc((s.skills[target.id] ?? 0) + 1)} cost={cost} balance={s.coins} confirmLabel="Upgrade"
          onConfirm={() => { const r = s.buySkill(target.id); setAsk(null); if (r.ok) { sound('win'); toast.show(`${target.name} upgraded`, 'good'); } else toast.show(r.reason ?? 'Failed', 'bad'); }}
          onCancel={() => setAsk(null)} />
      )}
    </div>
  );
}

export function EvolutionScreen() {
  const s = useGame();
  const [tab, setTab] = useState<'mutations' | 'skills'>('mutations');
  const [sel, setSel] = useSelected();
  const toast = useToast();
  useBackKey(true, s.back);
  const tabs = (
    <div className="tabs" role="tablist">
      {(['mutations', 'skills'] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} className={`tab ${tab === t ? 'on' : ''}`} onClick={() => { sound(); setTab(t); }}>{t}</button>)}
    </div>
  );
  return (
    <ScreenFrame eyebrow="Become stronger" title="Mutations & Skills" mode={tab === 'mutations' ? 'stage' : 'plain'} tabs={tabs} onBack={s.back} tools={<Coins value={s.coins} />}>
      {tab === 'mutations' ? (
        <>
          <Detail id={sel} toast={toast} />
          <PreviewSpacer />
          <MutationRail selected={sel} onSelect={(id) => { setSel(id); sound(); }} owned={s.owned} equipped={s.equipped} reached={s.reached} />
        </>
      ) : <SkillTree toast={toast} />}
      {toast.node}
    </ScreenFrame>
  );
}

export function ShopScreen() {
  const s = useGame();
  const [tab, setTab] = useState<'mutations' | 'skills' | 'cosmetics'>('mutations');
  const [slot, setSlot] = useState<CosmeticSlot>('wing');
  const [sel, setSel] = useSelected();
  const [pick, setPick] = useState<string | null>(null);
  const [ask, setAsk] = useState(false);
  const toast = useToast();
  useBackKey(true, s.back);
  const setPreviewCosmetics = useGame((x) => x.setPreviewCosmetics);

  useEffect(() => {
    if (tab !== 'cosmetics' || !pick) { setPreviewCosmetics(null); return; }
    const c = COSMETICS.find((x) => x.id === pick);
    if (c) setPreviewCosmetics({ ...s.cosmeticsEquipped, [c.slot]: c.id });
  }, [pick, tab, s.cosmeticsEquipped, setPreviewCosmetics]);

  const tabs = (
    <div className="tabs" role="tablist">
      {(['mutations', 'skills', 'cosmetics'] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} className={`tab ${tab === t ? 'on' : ''}`} onClick={() => { sound(); setTab(t); setPick(null); }}>{t}</button>)}
    </div>
  );
  const chosen = COSMETICS.find((c) => c.id === pick) ?? null;
  const chosenOwned = chosen ? s.cosmeticsOwned.includes(chosen.id) : false;
  const chosenWorn = chosen ? s.cosmeticsEquipped[chosen.slot] === chosen.id : false;

  return (
    <ScreenFrame eyebrow="Spend your crumbs" title="Roach Shop" mode={tab === 'skills' ? 'plain' : 'stage'} tabs={tabs} onBack={s.back} tools={<Coins value={s.coins} />}>
      {tab === 'mutations' && (
        <>
          <Detail id={sel} toast={toast} />
          <PreviewSpacer />
          <MutationRail selected={sel} onSelect={(id) => { setSel(id); sound(); }} owned={s.owned} equipped={s.equipped} reached={s.reached} />
        </>
      )}
      {tab === 'skills' && <SkillTree toast={toast} />}
      {tab === 'cosmetics' && (
        <>
          <div className="preview-col">
            <div className="slotbar" role="tablist">
              {COSMETIC_SLOTS.map((k) => <button key={k} className={slot === k ? 'on' : ''} onClick={() => { sound(); setSlot(k); setPick(null); }}>{SLOT_LABEL[k]}</button>)}
            </div>
            <div className="shop-grid scroll">
              {cosmeticsBySlot(slot).map((c) => {
                const own = s.cosmeticsOwned.includes(c.id);
                const worn = s.cosmeticsEquipped[c.slot] === c.id;
                return (
                  <button key={c.id} className={`item ${pick === c.id ? 'sel' : ''}`} onClick={() => { sound(); setPick(c.id); }}>
                    <div className="sw" style={{ background: c.value && c.value.startsWith('#') ? c.value : 'repeating-linear-gradient(45deg, #2a2019, #2a2019 6px, #1d1612 6px, #1d1612 12px)' }} />
                    <h4>{c.name}</h4>
                    <div className={`foot ${own ? 'own' : ''}`}>{worn ? 'Worn' : own ? 'Owned' : <span className="coins"><Coin />{c.price}</span>}</div>
                  </button>
                );
              })}
            </div>
            <div className="action-bar">
              {!chosen ? <span className="dim" style={{ fontSize: 12 }}>Select an item to preview it on your roach.</span>
                : chosenWorn ? <span className="state-tag equipped">Currently worn</span>
                  : chosenOwned ? <Btn primary onClick={() => { s.equipCosmetic(chosen.id); sound('eat'); toast.show(`${chosen.name} equipped`, 'good'); }}>Equip</Btn>
                    : <><span className="price"><Coin />{chosen.price}</span><Btn primary onClick={() => (s.coins >= chosen.price ? setAsk(true) : toast.show(`Need ${chosen.price - s.coins} more Crumb Coins`, 'bad'))}>{s.coins >= chosen.price ? 'Purchase' : 'Not enough coins'}</Btn></>}
            </div>
          </div>
          <PreviewSpacer />
          <div className="rail" style={{ flexBasis: 0, borderLeft: 0 }} />
          {ask && chosen && <Confirm eyebrow="Confirm purchase" title={chosen.name} body={`${SLOT_LABEL[chosen.slot]} cosmetic.`} cost={chosen.price} balance={s.coins} confirmLabel="Buy"
            onConfirm={() => { setAsk(false); const r = s.buyCosmetic(chosen.id); if (r.ok) { s.equipCosmetic(chosen.id); sound('win'); toast.show(`${chosen.name} unlocked`, 'good'); } else toast.show(r.reason ?? 'Failed', 'bad'); }}
            onCancel={() => setAsk(false)} />}
        </>
      )}
      {toast.node}
    </ScreenFrame>
  );
}
