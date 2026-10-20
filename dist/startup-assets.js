function decodeImage(src){
 const image=new Image();image.src=src;
 return image.decode();
}
// Include the active CSS backgrounds (including pseudo-elements), so the first
// revealed game frame already contains the illustrated HUD. Skip hidden trees.
export async function loadPresentationAssets(root=document.querySelector('.desktop')){
 const urls=new Set(['assets/menu-desert.png','assets/menu-logo.png']);
 const visit=element=>{
  const style=getComputedStyle(element);if(style.display==='none')return;
  for(const computed of [style,getComputedStyle(element,'::before'),getComputedStyle(element,'::after')]){
   for(const match of computed.backgroundImage.matchAll(/url\(["']?(.*?)["']?\)/g))urls.add(match[1]);
  }
  if(element.tagName==='IMG'&&element.getAttribute('src'))urls.add(element.src);
  for(const child of element.children)visit(child);
 };
 if(root)visit(root);
 await Promise.all([...urls].map(decodeImage));
 await document.fonts.ready;
}
