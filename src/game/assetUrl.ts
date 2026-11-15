const root = new URL(import.meta.env.BASE_URL, document.baseURI).href.replace(/\/?$/, '/');

export const assetUrl = (path: string) => `${root}${path.replace(/^\/+/, '')}`;
