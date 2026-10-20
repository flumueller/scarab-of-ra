// Explicit keyboard routing also works when macOS browser preferences exclude
// buttons from native Tab navigation. Never let focus escape an open dialog.
export function handleDialogKey(event,dialog,active){
 if(!dialog.open||event.defaultPrevented||event.isComposing||event.ctrlKey||event.metaKey||event.altKey)return;
 if(event.key==='Tab'){
  const controls=[...dialog.querySelectorAll('button,input,select,textarea,a[href],[tabindex]')].filter(el=>!el.disabled&&el.tabIndex>=0&&el.getClientRects().length);
  event.preventDefault();
  const index=controls.indexOf(active),next=index<0?(event.shiftKey?controls.length-1:0):(index+(event.shiftKey?-1:1)+controls.length)%controls.length;
  (controls[next]||dialog).focus();return;
 }
 if(event.key!=='Enter'||active?.tagName==='TEXTAREA'||active?.tagName==='SELECT')return;
 const focused=dialog.contains(active)&&active?.tagName==='BUTTON'?active:null;
 const button=focused||dialog.querySelector('#dialog-actions .primary:not(:disabled)');
 if(button&&!button.disabled){event.preventDefault();if(!event.repeat)button.click();}
}
export function installDialogKeyboard(dialog){
 const doc=dialog.ownerDocument;
 doc.addEventListener('keydown',event=>handleDialogKey(event,dialog,doc.activeElement));
}
