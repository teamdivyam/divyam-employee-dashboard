const _config = {
    BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
    APP_URL: import.meta.env.VITE_APP_URL,
    IMAGE_CDN: import.meta.env.VITE_IMG_PATH,
    REACPTCAH_KEY: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
    PRODUCTION_MODE: import.meta.env.VITE_PRODUCTION,
    SHOW_REGISTER_PAGE: import.meta.env.VITE_SHOW_REGISTER_PAGE,
    SITE_KEY_RECAPTCHA: import.meta.env.VITE_SITE_KEY_RECAPTCHA,
}

export { _config as config }