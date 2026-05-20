export const INICIS_PROD_SCRIPT = 'https://stdpay.inicis.com/stdjs/INIStdPay.js';

/** @param {string} [scriptUrl] */
export function loadIniStdPayScript(scriptUrl = INICIS_PROD_SCRIPT) {
  const src = scriptUrl || INICIS_PROD_SCRIPT;
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-inicis-stdpay="1"]');
    if (existing?.src === src && window.INIStdPay) {
      resolve();
      return;
    }
    if (existing) {
      existing.remove();
      try {
        delete window.INIStdPay;
      } catch {
        /* ignore */
      }
    }
    const script = document.createElement('script');
    script.src = src;
    script.charset = 'UTF-8';
    script.dataset.inicisStdpay = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('이니시스 결제 스크립트를 불러오지 못했습니다.'));
    document.body.appendChild(script);
  });
}
