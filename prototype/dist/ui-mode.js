// Presentation preference only: deliberately independent of engine and saves.
export const UI_MODE_KEY='scarab-ra-ui-mode-v1';
export const normalizeMode=value=>value==='original'?'original':'modern';
export function isModeShortcut(e){
 return e.key?.toLowerCase()==='o'&&!e.repeat&&!e.isComposing&&!e.ctrlKey&&!e.metaKey&&!e.altKey
  &&!e.target?.isContentEditable&&!e.target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])');
}
export function createModeController({root,button,hintButton,storage,onChange=()=>{}}){
 let mode='modern';try{mode=normalizeMode(storage?.getItem(UI_MODE_KEY));}catch{}
 const apply=()=>{
  root.dataset.uiMode=mode;
  button.textContent=`O · ${mode==='original'?'Modern':'Original'}`;
  if(hintButton)hintButton.textContent=button.textContent;
  button.setAttribute('aria-label',`Modern interface (O); current mode: ${mode==='original'?'Original':'Modern'}`);
  button.setAttribute('aria-pressed',String(mode==='modern'));
 };
 const setMode=value=>{const next=normalizeMode(value);if(next===mode)return;mode=next;apply();try{storage?.setItem(UI_MODE_KEY,mode);}catch{}onChange(mode);};
 apply();
 return {get mode(){return mode;},setMode,toggle(){setMode(mode==='original'?'modern':'original');}};
}
