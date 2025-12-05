import { dom } from './dom.js';

export const initScreenshot = () => {
  dom.postcardBtn.addEventListener('click', async () => {
    const canvas = await html2canvas(document.body, { ignoreElements: (el) => el.id === 'postcardBtn' });
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tacky-christmas-postcard.png';
      a.click();
      URL.revokeObjectURL(url);
    });
  });
};
