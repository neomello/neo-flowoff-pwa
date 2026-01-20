// webp-support.js - Suporte automático para WebP com fallback
class WebPSupport {
  constructor() {
    this.supportsWebP = false;
    this.checkWebPSupport();
  }

  // Verificar suporte a WebP
  checkWebPSupport() {
    try {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        this.supportsWebP = webP.height === 2;
        window.Logger?.log('WebP support:', this.supportsWebP);
        this.updateImages();
      };
      webP.src =
        'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    } catch (error) {
      window.Logger?.error('Erro ao verificar suporte WebP:', error);
      this.supportsWebP = false;
      this.updateImages();
    }
  }

  // Atualizar todas as imagens para usar WebP quando suportado
  updateImages() {
    try {
      const images = document.querySelectorAll('img[src*=".png"]');

      if (images.length === 0) {
        window.Logger?.log('Nenhuma imagem PNG encontrada para conversão WebP');
        return;
      }

      // Lista de arquivos que têm versão WebP disponível
      const webpAvailable = [
        'public/card.png',
        'public/flowoff logo.png',
        'public/icon-512.png',
        'public/poston.png',
        'public/poston_home.png',
        'public/logos/card-logo.png',
        'public/logos/flowoff logo.png',
        'public/logos/proia.png',
        'public/logos/NEO_LAST.png',
        'public/logos/POSTON.png',
        'public/logos/geometrico.png',
        'public/logos/holografic.png',
        'public/logos/metalica.png',
        'public/logos/pink_metalic.png',
        'public/logos/pink_metalic.png',
        'public/icons/icon-48x48.png',
        'public/icons/icon-72x72.png',
        'public/icons/icon-96x96.png',
        'public/icons/icon-128x128.png',
        'public/icons/icon-144x144.png',
        'public/icons/icon-152x152.png',
        'public/icons/icon-192x192.png',
        'public/icons/icon-256x256.png',
        'public/icons/icon-384x384.png',
        'public/icons/icon-512x512.png',
      ];

      let convertedCount = 0;
      let fallbackCount = 0;

      images.forEach((img) => {
        try {
          const pngSrc = img.src;
          const webpSrc = pngSrc.replace('.png', '.webp');

          // Só tentar converter se o arquivo WebP existe
          const hasWebP = webpAvailable.some((file) => pngSrc.includes(file));

          if (this.supportsWebP && hasWebP) {
            // Criar nova imagem WebP
            const webpImg = new Image();
            webpImg.onload = () => {
              img.src = webpSrc;
              img.classList.add('webp-loaded');
              convertedCount++;
            };
            webpImg.onerror = () => {
              // Fallback para PNG se WebP falhar
              img.classList.add('webp-fallback');
              fallbackCount++;
              window.Logger?.warn(
                'Falha ao carregar WebP, usando PNG:',
                pngSrc
              );
            };
            webpImg.src = webpSrc;
          } else {
            // Usar PNG original
            img.classList.add('webp-not-supported');
          }
        } catch (error) {
          window.Logger?.error('Erro ao processar imagem:', img.src, error);
        }
      });

      window.Logger?.log(
        `WebP: ${convertedCount} convertidas, ${fallbackCount} fallbacks, ${images.length - convertedCount - fallbackCount} PNGs`
      );
    } catch (error) {
      window.Logger?.error('Erro ao atualizar imagens WebP:', error);
    }
  }

  // Função para substituir src de imagem específica
  replaceImageSrc(selector, webpSrc, pngSrc) {
    try {
      const img = document.querySelector(selector);
      if (img) {
        if (this.supportsWebP) {
          img.src = webpSrc;
          img.classList.add('webp-loaded');
          window.Logger?.log('Imagem substituída por WebP:', webpSrc);
        } else {
          img.src = pngSrc;
          img.classList.add('webp-not-supported');
        }
      } else {
        window.Logger?.warn('Imagem não encontrada:', selector);
      }
    } catch (error) {
      window.Logger?.error('Erro ao substituir imagem:', selector, error);
    }
  }
}

// Inicializar quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.webpSupport = new WebPSupport();
    window.Logger?.log('WebPSupport inicializado');
  } catch (error) {
    window.Logger?.error('Erro ao inicializar WebPSupport:', error);
  }
});

// Exportar para uso global
window.WebPSupport = WebPSupport;
