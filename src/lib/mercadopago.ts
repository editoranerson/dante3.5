// Public Key do Mercado Pago — chave publicável, pode ficar no front.
export const MP_PUBLIC_KEY = 'APP_USR-b68ed6ad-7d6a-4e1e-be2a-95ee22a9ae4b';

interface CardTokenData {
  cardNumber: string;
  cardholderName: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  securityCode: string;
  identificationType: string;
  identificationNumber: string;
}

interface MercadoPagoInstance {
  createCardToken: (data: CardTokenData) => Promise<{ id: string }>;
  getIdentificationTypes: () => Promise<Array<{ id: string; name: string }>>;
}

declare global {
  interface Window {
    MercadoPago?: new (
      publicKey: string,
      options?: { locale?: string },
    ) => MercadoPagoInstance;
  }
}

let sdkPromise: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no_window'));
  if (window.MercadoPago) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-mp-sdk="v2"]',
    );
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('sdk_error')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.dataset.mpSdk = 'v2';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('sdk_error'));
    document.head.appendChild(script);
  });

  return sdkPromise;
}

let instance: MercadoPagoInstance | null = null;

export async function getMercadoPago(): Promise<MercadoPagoInstance> {
  await loadSdk();
  if (!window.MercadoPago) throw new Error('sdk_unavailable');
  if (!instance) {
    instance = new window.MercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' });
  }
  return instance;
}

/** Gera o token do cartão no navegador — os dados do cartão nunca passam pelo nosso servidor. */
export async function createCardToken(data: CardTokenData): Promise<string> {
  const mp = await getMercadoPago();
  const token = await mp.createCardToken(data);
  if (!token?.id) throw new Error('token_failed');
  return token.id;
}

export function onlyDigits(value: string): string {
  return value.replace(/\D+/g, '');
}

export function formatCardNumber(value: string): string {
  return onlyDigits(value).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function formatExpiry(value: string): string {
  const digits = onlyDigits(value).slice(0, 6);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function formatCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}
