import { useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_PREFS, prefs, savePrefs, type Prefs, type Quality } from '../game/prefs';
import { refreshVolume, sound, startMusic, stopMusic } from '../game/sound';
import { useGame } from '../game/store';
import { Btn, Confirm, Mouse, ScreenFrame, Segmented, Slider, Toggle, useBackKey, useToast } from './kit';

type Tab = 'graphics' | 'audio' | 'controls' | 'gameplay';
const TABS: Tab[] = ['graphics', 'audio', 'controls', 'gameplay'];

function Row({ label, hint, children, value }: { label: string; hint?: string; children: ReactNode; value?: string }) {
  return (
    <div className="set-row">
      <span>{label}{hint && <small>{hint}</small>}</span>
      <div>{children}</div>
      <output>{value ?? ''}</output>
    </div>
  );
}

export function SettingsScreen() {
  const s = useGame();
  const [tab, setTab] = useState<Tab>('graphics');
  const [draft, setDraft] = useState<Prefs>({ ...prefs });
  const [eraseAsk, setEraseAsk] = useState(false);
  const toast = useToast();
  const dirty = JSON.stringify(draft) !== JSON.stringify(prefs);
  const set = <K extends keyof Prefs>(k: K, v: Prefs[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const live = (next: Prefs) => { Object.assign(prefs, { master: next.master, music: next.music, sfx: next.sfx, musicOn: next.musicOn, sfxOn: next.sfxOn }); refreshVolume(); };
  useEffect(() => { live(draft); if (draft.musicOn) startMusic(); else stopMusic(); }, [draft.master, draft.music, draft.sfx, draft.musicOn, draft.sfxOn]);

  const leave = () => { live(prefs); if (!prefs.musicOn) stopMusic(); s.back(); };
  useBackKey(!eraseAsk, leave);

  const apply = () => { savePrefs(draft); toast.show('Settings applied', 'good'); };
  const reset = () => { setDraft({ ...DEFAULT_PREFS }); toast.show('Defaults loaded. Press Apply to keep them'); };

  const tabs = (
    <div className="tabs" role="tablist">
      {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} className={`tab ${tab === t ? 'on' : ''}`} onClick={() => { sound(); setTab(t); }}>{t}</button>)}
    </div>
  );

  return (
    <ScreenFrame eyebrow="Make it yours" title="Settings" tabs={tabs} mode={s.inGame ? 'over-game' : 'plain'}>
      <div className="set-pane">
        <div className="scroll" style={{ flex: 1, paddingRight: 10 }}>
          {tab === 'graphics' && (
            <>
              <Row label="Quality" hint="Resolution scale and anti-aliasing"><Segmented<Quality> label="Quality" value={draft.quality} options={['High', 'Balanced', 'Low']} onChange={(v) => set('quality', v)} /></Row>
              <Row label="Shadows" hint="Soft shadows. Disabled on Low."><Toggle label="Shadows" on={draft.shadows} onChange={(v) => set('shadows', v)} /></Row>
              <Row label="Field of view" hint="Wider shows more of the room" value={`${draft.fov}`}><Slider label="Field of view" min={45} max={80} value={draft.fov} onChange={(v) => set('fov', v)} /></Row>
              <Row label="Camera shake" hint="Impacts, attacks, abilities" value={`${draft.shake}%`}><Slider label="Camera shake" min={0} max={100} value={draft.shake} onChange={(v) => set('shake', v)} /></Row>
              <Row label="Show FPS"><Toggle label="Show FPS" on={draft.showFps} onChange={(v) => set('showFps', v)} /></Row>
            </>
          )}
          {tab === 'audio' && (
            <>
              <Row label="Master volume" value={`${draft.master}%`}><Slider label="Master volume" min={0} max={100} value={draft.master} onChange={(v) => set('master', v)} /></Row>
              <Row label="Music volume" value={`${draft.music}%`}><Slider label="Music volume" min={0} max={100} value={draft.music} onChange={(v) => set('music', v)} /></Row>
              <Row label="Effects volume" value={`${draft.sfx}%`}><Slider label="Effects volume" min={0} max={100} value={draft.sfx} onChange={(v) => set('sfx', v)} /></Row>
              <Row label="Music"><Toggle label="Music" on={draft.musicOn} onChange={(v) => set('musicOn', v)} /></Row>
              <Row label="Sound effects"><Toggle label="Sound effects" on={draft.sfxOn} onChange={(v) => set('sfxOn', v)} /></Row>
            </>
          )}
          {tab === 'controls' && (
            <>
              <Row label="Mouse sensitivity" value={`${draft.sensitivity}%`}><Slider label="Mouse sensitivity" min={30} max={200} value={draft.sensitivity} onChange={(v) => set('sensitivity', v)} /></Row>
              <Row label="Invert vertical look"><Toggle label="Invert vertical look" on={draft.invertY} onChange={(v) => set('invertY', v)} /></Row>
              <div className="keys" style={{ marginTop: 20 }}>
                <h3>Movement</h3>
                <div className="row"><kbd>W A S D</kbd>Move, relative to the camera</div>
                <div className="row"><Mouse />Rotate the camera</div>
                <div className="row"><kbd>Space</kbd>Jump</div>
                <div className="row"><kbd>Shift</kbd>Sprint</div>
                <h3>Abilities</h3>
                <div className="row"><kbd>F</kbd>Toggle flight</div>
                <div className="row"><kbd>E</kbd>Hide under cover</div>
                <div className="row"><kbd>Q</kbd>Mutation special ability</div>
                <div className="row"><kbd>Space / C</kbd>Climb / descend in flight</div>
                <h3>Combat</h3>
                <div className="row"><Mouse button="left" />Face attack</div>
                <div className="row"><Mouse button="right" />Hold to aim and lock on</div>
                <div className="row"><kbd>Esc</kbd>Pause</div>
              </div>
            </>
          )}
          {tab === 'gameplay' && (
            <>
              <Row label="Tutorial prompts" hint="Hints at the start of Level 1"><Toggle label="Tutorial prompts" on={draft.tutorial} onChange={(v) => set('tutorial', v)} /></Row>
              <Row label="Cinematic subtitles"><Toggle label="Cinematic subtitles" on={draft.subtitles} onChange={(v) => set('subtitles', v)} /></Row>
              <Row label="Save data" hint="Erases coins, mutations, skills and progress"><Btn small danger onClick={() => setEraseAsk(true)}>Erase save</Btn></Row>
            </>
          )}
        </div>
        <div className="set-actions">
          <Btn ghost onClick={reset}>Reset to defaults</Btn>
          <span className="grow" />
          <Btn onClick={leave}>Back</Btn>
          <Btn primary disabled={!dirty} onClick={apply}>Apply</Btn>
        </div>
      </div>
      {eraseAsk && <Confirm eyebrow="This cannot be undone" title="Erase all progress?" body="Your Crumb Coins, mutations, skills, cosmetics and level progress will be deleted." confirmLabel="Erase" onConfirm={() => s.resetSave()} onCancel={() => setEraseAsk(false)} />}
      {toast.node}
    </ScreenFrame>
  );
}
